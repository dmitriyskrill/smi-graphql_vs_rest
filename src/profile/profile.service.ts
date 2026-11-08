import { Injectable } from '@nestjs/common';
import { CompaniesService } from '../companies/companies.service.js';
import {
  groupByParent,
  type Company,
  type CountById,
  type Experience,
  type ExperienceRecord,
  type Position,
  type Profile,
  type ProfileLink,
  type Project,
  type Skill,
} from '../domain.js';
import { PositionsService } from '../positions/positions.service.js';
import { SkillsService } from '../skills/skills.service.js';
import { ProfileRepository } from './profile.repository.js';

export const PROFILE_INCLUDES = [
  'skills',
  'experience',
  'projects',
  'links',
] as const;
export type ProfileInclude = (typeof PROFILE_INCLUDES)[number];
export type ProfileWithIncludes = Profile &
  Partial<{
    skills: Array<Skill & { profileId: string }>;
    experience: Array<
      Experience & { company: Company; position: Position }
    >;
    projects: Project[];
    links: ProfileLink[];
  }>;

@Injectable()
export class ProfileService {
  constructor(
    private readonly repository: ProfileRepository,
    private readonly skillsService: SkillsService,
    private readonly companiesService: CompaniesService,
    private readonly positionsService: PositionsService,
  ) {}

  async findMany(skillName?: string): Promise<Profile[]> {
    if (!skillName) return this.repository.findMany();
    const skill = await this.skillsService.findByName(skillName);
    return skill ? this.repository.findMany(skill.id) : [];
  }

  findByOwnerKey(ownerKey: string): Promise<Profile | null> {
    return this.repository.findByOwnerKey(ownerKey);
  }

  findByIds(ids: readonly string[]): Promise<Profile[]> {
    return this.repository.findByIds(ids);
  }

  skillsByProfileIds(
    ids: readonly string[],
  ): Promise<Array<Skill & { profileId: string }>> {
    return this.repository.findSkillsByProfileIds(ids);
  }

  experiencesByProfileIds(ids: readonly string[]): Promise<ExperienceRecord[]> {
    return this.repository.findExperiencesByProfileIds(ids);
  }

  projectsByProfileIds(ids: readonly string[]): Promise<Project[]> {
    return this.repository.findProjectsByProfileIds(ids);
  }

  linksByProfileIds(ids: readonly string[]): Promise<ProfileLink[]> {
    return this.repository.findLinksByProfileIds(ids);
  }

  skillCounts(ids: readonly string[]): Promise<CountById[]> {
    return this.repository.countSkills(ids);
  }

  experienceCounts(ids: readonly string[]): Promise<CountById[]> {
    return this.repository.countExperiences(ids);
  }

  projectCounts(ids: readonly string[]): Promise<CountById[]> {
    return this.repository.countProjects(ids);
  }

  linkCounts(ids: readonly string[]): Promise<CountById[]> {
    return this.repository.countLinks(ids);
  }

  findAllExperienceRows(): Promise<ExperienceRecord[]> {
    return this.repository.findAllExperienceRows();
  }

  findAllExperiences(): Promise<Experience[]> {
    return this.repository.findAllExperiences();
  }

  findAllProjects(): Promise<Project[]> {
    return this.repository.findAllProjects();
  }

  findAllLinks(): Promise<ProfileLink[]> {
    return this.repository.findAllLinks();
  }

  async addIncludes(
    profiles: readonly Profile[],
    includes: ReadonlySet<ProfileInclude>,
  ): Promise<ProfileWithIncludes[]> {
    const ids = profiles.map(({ id }) => id);
    const [skills, experience, projects, links] = await Promise.all([
      includes.has('skills') ? this.skillsByProfileIds(ids) : undefined,
      includes.has('experience')
        ? this.experiencesByProfileIds(ids)
        : undefined,
      includes.has('projects') ? this.projectsByProfileIds(ids) : undefined,
      includes.has('links') ? this.linksByProfileIds(ids) : undefined,
    ]);
    const companiesById = new Map<string, Company>();
    const positionsById = new Map<string, Position>();
    if (experience) {
      const [companies, positions] = await Promise.all([
        this.companiesService.findByIds([
          ...new Set(experience.map(({ companyId }) => companyId)),
        ]),
        this.positionsService.findByIds([
          ...new Set(experience.map(({ positionId }) => positionId)),
        ]),
      ]);
      for (const company of companies) companiesById.set(company.id, company);
      for (const position of positions) positionsById.set(position.id, position);
    }
    const skillsByProfile = skills
      ? groupByParent(ids, skills, (row) => row.profileId)
      : undefined;
    const experienceByProfile = experience
      ? groupByParent(ids, experience, (row) => row.profileId)
      : undefined;
    const projectsByProfile = projects
      ? groupByParent(ids, projects, (row) => row.profileId)
      : undefined;
    const linksByProfile = links
      ? groupByParent(ids, links, (row) => row.profileId)
      : undefined;
    return profiles.map((profile, index) => ({
      ...profile,
      ...(skillsByProfile && { skills: skillsByProfile[index] ?? [] }),
      ...(experienceByProfile && {
        experience: (experienceByProfile[index] ?? []).map((row) => {
          const company = requiredReference(
            companiesById,
            row.companyId,
            'Company',
          );
          const position = requiredReference(
            positionsById,
            row.positionId,
            'Position',
          );
          return {
            ...row,
            ownerKey: profile.ownerKey,
            companyInn: company.inn,
            positionName: position.name,
            company,
            position,
          };
        }),
      }),
      ...(projectsByProfile && { projects: projectsByProfile[index] ?? [] }),
      ...(linksByProfile && { links: linksByProfile[index] ?? [] }),
    }));
  }
}

function requiredReference<T>(
  rows: ReadonlyMap<string, T>,
  id: string,
  entity: string,
): T {
  const row = rows.get(id);
  if (!row) {
    throw new Error(`Связанная сущность ${entity} не найдена`);
  }
  return row;
}
