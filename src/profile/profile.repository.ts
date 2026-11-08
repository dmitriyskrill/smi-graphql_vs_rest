import { Injectable } from '@nestjs/common';
import {
  toExperience,
  toExperienceRecord,
  toLink,
  toProject,
  type CountById,
  type Experience,
  type ExperienceRecord,
  type Profile,
  type ProfileLink,
  type Project,
  type Skill,
} from '../domain.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

interface SkillByProfileIdRow {
  id: string;
  name: string;
  profileId: string;
}

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(skillId?: string): Promise<Profile[]> {
    return this.prisma.profile.findMany({
      where: skillId ? { skills: { some: { skillId } } } : undefined,
      orderBy: { ownerKey: 'asc' },
    });
  }

  findByOwnerKey(ownerKey: string): Promise<Profile | null> {
    return this.prisma.profile.findUnique({ where: { ownerKey } });
  }

  findByIds(ids: readonly string[]): Promise<Profile[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.prisma.profile.findMany({ where: { id: { in: [...ids] } } });
  }

  async findSkillsByProfileIds(
    profileIds: readonly string[],
  ): Promise<Array<Skill & { profileId: string }>> {
    if (profileIds.length === 0) return [];
    const rows = await this.prisma.$queryRaw<SkillByProfileIdRow[]>(
      Prisma.sql`
        SELECT
          s."id" AS "id",
          s."name" AS "name",
          ps."profileId" AS "profileId"
        FROM "ProfileSkill" AS ps
        INNER JOIN "Skill" AS s ON s."id" = ps."skillId"
        WHERE ps."profileId" IN (${Prisma.join(
          profileIds.map((profileId) => Prisma.sql`${profileId}::uuid`),
        )})
        ORDER BY ps."profileId" ASC, ps."sortOrder" ASC
      `,
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      profileId: row.profileId,
    }));
  }

  async findExperiencesByProfileIds(
    profileIds: readonly string[],
  ): Promise<ExperienceRecord[]> {
    if (profileIds.length === 0) return [];
    const rows = await this.prisma.experience.findMany({
      where: { profileId: { in: [...profileIds] } },
      orderBy: [{ profileId: 'asc' }, { sortOrder: 'asc' }],
      select: experienceRowSelect,
    });
    return rows.map(toExperienceRecord);
  }

  async findProjectsByProfileIds(
    profileIds: readonly string[],
  ): Promise<Project[]> {
    if (profileIds.length === 0) return [];
    const rows = await this.prisma.project.findMany({
      where: { profileId: { in: [...profileIds] } },
      orderBy: [{ profileId: 'asc' }, { sortOrder: 'asc' }],
      select: projectAddressSelect,
    });
    return rows.map(toProject);
  }

  async findLinksByProfileIds(
    profileIds: readonly string[],
  ): Promise<ProfileLink[]> {
    if (profileIds.length === 0) return [];
    const rows = await this.prisma.profileLink.findMany({
      where: { profileId: { in: [...profileIds] } },
      orderBy: [{ profileId: 'asc' }, { sortOrder: 'asc' }],
      select: linkAddressSelect,
    });
    return rows.map(toLink);
  }

  async countSkills(profileIds: readonly string[]): Promise<CountById[]> {
    if (profileIds.length === 0) return [];
    const rows = await this.prisma.profileSkill.groupBy({
      by: ['profileId'],
      where: { profileId: { in: [...profileIds] } },
      _count: true,
    });
    return rows.map((row) => ({ id: row.profileId, count: row._count }));
  }

  async countExperiences(profileIds: readonly string[]): Promise<CountById[]> {
    if (profileIds.length === 0) return [];
    const rows = await this.prisma.experience.groupBy({
      by: ['profileId'],
      where: { profileId: { in: [...profileIds] } },
      _count: true,
    });
    return rows.map((row) => ({ id: row.profileId, count: row._count }));
  }

  async countProjects(profileIds: readonly string[]): Promise<CountById[]> {
    if (profileIds.length === 0) return [];
    const rows = await this.prisma.project.groupBy({
      by: ['profileId'],
      where: { profileId: { in: [...profileIds] } },
      _count: true,
    });
    return rows.map((row) => ({ id: row.profileId, count: row._count }));
  }

  async countLinks(profileIds: readonly string[]): Promise<CountById[]> {
    if (profileIds.length === 0) return [];
    const rows = await this.prisma.profileLink.groupBy({
      by: ['profileId'],
      where: { profileId: { in: [...profileIds] } },
      _count: true,
    });
    return rows.map((row) => ({ id: row.profileId, count: row._count }));
  }

  async findAllExperienceRows(): Promise<ExperienceRecord[]> {
    const rows = await this.prisma.experience.findMany({
      orderBy: [{ profileId: 'asc' }, { sortOrder: 'asc' }],
      select: experienceRowSelect,
    });
    return rows.map(toExperienceRecord);
  }

  async findAllExperiences(): Promise<Experience[]> {
    const rows = await this.prisma.experience.findMany({
      orderBy: [{ profile: { ownerKey: 'asc' } }, { sortOrder: 'asc' }],
      select: experienceAddressSelect,
    });
    return rows.map(toExperience);
  }

  async findAllProjects(): Promise<Project[]> {
    const rows = await this.prisma.project.findMany({
      orderBy: [{ profile: { ownerKey: 'asc' } }, { sortOrder: 'asc' }],
      select: projectAddressSelect,
    });
    return rows.map(toProject);
  }

  async findAllLinks(): Promise<ProfileLink[]> {
    const rows = await this.prisma.profileLink.findMany({
      orderBy: [{ profile: { ownerKey: 'asc' } }, { sortOrder: 'asc' }],
      select: linkAddressSelect,
    });
    return rows.map(toLink);
  }
}

const experienceRowSelect = {
  id: true,
  profileId: true,
  companyId: true,
  positionId: true,
  startedOn: true,
  endedOn: true,
} as const;

const experienceAddressSelect = {
  id: true,
  profileId: true,
  companyId: true,
  positionId: true,
  startedOn: true,
  endedOn: true,
  profile: { select: { ownerKey: true } },
  company: { select: { inn: true } },
  position: { select: { name: true } },
} as const;

const projectAddressSelect = {
  id: true,
  profileId: true,
  name: true,
  url: true,
  profile: { select: { ownerKey: true } },
} as const;

const linkAddressSelect = {
  id: true,
  profileId: true,
  label: true,
  url: true,
  profile: { select: { ownerKey: true } },
} as const;
