import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { CompaniesService } from '../companies/companies.service.js';
import {
  groupByParent,
  mapById,
  mapCounts,
} from '../domain.js';
import { PositionsService } from '../positions/positions.service.js';
import { ProfileService } from '../profile/profile.service.js';
import { SkillsService } from '../skills/skills.service.js';
import {
  toCompanyObject,
  toExperienceObject,
  toLinkObject,
  toPositionObject,
  toProfileObject,
  toProjectObject,
  toSkillObject,
} from './mappers.js';
import type {
  CompanyObject,
  ExperienceObject,
  PositionObject,
  ProfileLinkObject,
  ProfileObject,
  ProjectObject,
  SkillObject,
} from './types.js';

function required<T>(
  values: readonly (T | null)[],
  entity: string,
): Array<T | Error> {
  return values.map(
    (value) => value ?? new Error(`Связанная сущность ${entity} не найдена`),
  );
}

export interface CatalogLoaders {
  profileById: DataLoader<string, ProfileObject>;
  companyById: DataLoader<string, CompanyObject>;
  positionById: DataLoader<string, PositionObject>;
  skillsByProfile: DataLoader<string, SkillObject[]>;
  experiencesByProfile: DataLoader<string, ExperienceObject[]>;
  projectsByProfile: DataLoader<string, ProjectObject[]>;
  linksByProfile: DataLoader<string, ProfileLinkObject[]>;
  skillCountByProfile: DataLoader<string, number>;
  experienceCountByProfile: DataLoader<string, number>;
  projectCountByProfile: DataLoader<string, number>;
  linkCountByProfile: DataLoader<string, number>;
  profilesBySkill: DataLoader<string, ProfileObject[]>;
  profileCountBySkill: DataLoader<string, number>;
  experiencesByCompany: DataLoader<string, ExperienceObject[]>;
  experienceCountByCompany: DataLoader<string, number>;
  profileCountByCompany: DataLoader<string, number>;
  experiencesByPosition: DataLoader<string, ExperienceObject[]>;
  experienceCountByPosition: DataLoader<string, number>;
  profileCountByPosition: DataLoader<string, number>;
}

export interface GraphqlContext {
  loaders: CatalogLoaders;
}

@Injectable()
export class CatalogLoaderFactory {
  constructor(
    private readonly profiles: ProfileService,
    private readonly skills: SkillsService,
    private readonly companies: CompaniesService,
    private readonly positions: PositionsService,
  ) {}

  create(): CatalogLoaders {
    return {
      profileById: new DataLoader(async (ids) => {
        const rows = await this.profiles.findByIds(ids);
        return required(mapById(ids, rows), 'Profile').map((row) =>
          row instanceof Error ? row : toProfileObject(row),
        );
      }),
      companyById: new DataLoader(async (ids) => {
        const rows = await this.companies.findByIds(ids);
        return required(mapById(ids, rows), 'Company').map((row) =>
          row instanceof Error ? row : toCompanyObject(row),
        );
      }),
      positionById: new DataLoader(async (ids) => {
        const rows = await this.positions.findByIds(ids);
        return required(mapById(ids, rows), 'Position').map((row) =>
          row instanceof Error ? row : toPositionObject(row),
        );
      }),
      skillsByProfile: new DataLoader(async (ids) => {
        const rows = await this.profiles.skillsByProfileIds(ids);
        return groupByParent(ids, rows, (row) => row.profileId).map((group) =>
          group.map(toSkillObject),
        );
      }),
      experiencesByProfile: new DataLoader(async (ids) => {
        const rows = await this.profiles.experiencesByProfileIds(ids);
        return groupByParent(ids, rows, (row) => row.profileId).map((group) =>
          group.map(toExperienceObject),
        );
      }),
      projectsByProfile: new DataLoader(async (ids) => {
        const rows = await this.profiles.projectsByProfileIds(ids);
        return groupByParent(ids, rows, (row) => row.profileId).map((group) =>
          group.map(toProjectObject),
        );
      }),
      linksByProfile: new DataLoader(async (ids) => {
        const rows = await this.profiles.linksByProfileIds(ids);
        return groupByParent(ids, rows, (row) => row.profileId).map((group) =>
          group.map(toLinkObject),
        );
      }),
      skillCountByProfile: new DataLoader(async (ids) =>
        mapCounts(ids, await this.profiles.skillCounts(ids)),
      ),
      experienceCountByProfile: new DataLoader(async (ids) =>
        mapCounts(ids, await this.profiles.experienceCounts(ids)),
      ),
      projectCountByProfile: new DataLoader(async (ids) =>
        mapCounts(ids, await this.profiles.projectCounts(ids)),
      ),
      linkCountByProfile: new DataLoader(async (ids) =>
        mapCounts(ids, await this.profiles.linkCounts(ids)),
      ),
      profilesBySkill: new DataLoader(async (ids) => {
        const rows = await this.skills.profilesBySkillIds(ids);
        return groupByParent(ids, rows, (row) => row.skillId).map((group) =>
          group.map(toProfileObject),
        );
      }),
      profileCountBySkill: new DataLoader(async (ids) =>
        mapCounts(ids, await this.skills.profileCounts(ids)),
      ),
      experiencesByCompany: new DataLoader(async (ids) => {
        const rows = await this.companies.experienceRowsByCompanyIds(ids);
        return groupByParent(ids, rows, (row) => row.companyId).map((group) =>
          group.map(toExperienceObject),
        );
      }),
      experienceCountByCompany: new DataLoader(async (ids) =>
        mapCounts(ids, await this.companies.experienceCounts(ids)),
      ),
      profileCountByCompany: new DataLoader(async (ids) =>
        mapCounts(ids, await this.companies.profileCounts(ids)),
      ),
      experiencesByPosition: new DataLoader(async (ids) => {
        const rows = await this.positions.experienceRowsByPositionIds(ids);
        return groupByParent(ids, rows, (row) => row.positionId).map((group) =>
          group.map(toExperienceObject),
        );
      }),
      experienceCountByPosition: new DataLoader(async (ids) =>
        mapCounts(ids, await this.positions.experienceCounts(ids)),
      ),
      profileCountByPosition: new DataLoader(async (ids) =>
        mapCounts(ids, await this.positions.profileCounts(ids)),
      ),
    };
  }
}
