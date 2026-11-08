import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { dateOnly } from '../domain.js';
import {
  PROFILE_INCLUDES,
  type ProfileInclude,
  type ProfileWithIncludes,
  ProfileService,
} from './profile.service.js';

function parseIncludes(raw?: string | string[]): ReadonlySet<ProfileInclude> {
  if (raw === undefined || raw === '') return new Set();
  const values = (Array.isArray(raw) ? raw : [raw])
    .flatMap((part) => part.split(','))
    .map((part) => part.trim())
    .filter(Boolean);
  const unknown = values.filter(
    (value) => !PROFILE_INCLUDES.includes(value as ProfileInclude),
  );
  if (unknown.length) {
    throw new BadRequestException(`Неизвестный include: ${unknown.join(', ')}`);
  }
  return new Set(values as ProfileInclude[]);
}

function singleQuery(
  value: string | string[] | undefined,
  name: string,
): string | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    throw new BadRequestException(`Параметр ${name} задаётся один раз`);
  }
  return value;
}

function serializeProfile(profile: ProfileWithIncludes): object {
  return {
    ownerKey: profile.ownerKey,
    name: profile.name,
    description: profile.description,
    ...(profile.skills && {
      skills: profile.skills.map(({ name }) => ({ name })),
    }),
    ...(profile.experience && {
      experience: profile.experience.map((row) => ({
        ownerKey: row.ownerKey,
        companyInn: row.companyInn,
        positionName: row.positionName,
        startedOn: dateOnly(row.startedOn),
        endedOn: row.endedOn ? dateOnly(row.endedOn) : null,
        company: { inn: row.company.inn, name: row.company.name },
        position: { name: row.position.name },
      })),
    }),
    ...(profile.projects && {
      projects: profile.projects.map(({ ownerKey, name, url }) => ({
        ownerKey,
        name,
        url,
      })),
    }),
    ...(profile.links && {
      links: profile.links.map(({ ownerKey, label, url }) => ({
        ownerKey,
        label,
        url,
      })),
    }),
  };
}

@Controller()
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get('profiles')
  async profiles(
    @Query('skill') skill?: string | string[],
    @Query('include') include?: string | string[],
  ): Promise<object[]> {
    const includes = parseIncludes(include);
    const profiles = await this.service.findMany(singleQuery(skill, 'skill'));
    return (await this.service.addIncludes(profiles, includes)).map(
      serializeProfile,
    );
  }

  @Get('profiles/:ownerKey')
  async profile(
    @Param('ownerKey') ownerKey: string,
    @Query('include') include?: string | string[],
  ): Promise<object> {
    const includes = parseIncludes(include);
    const profile = await this.service.findByOwnerKey(ownerKey);
    if (!profile) throw new NotFoundException('Профиль не найден');
    const [result] = await this.service.addIncludes([profile], includes);
    return serializeProfile(result);
  }

  @Get('experiences')
  async experiences(): Promise<object[]> {
    return (await this.service.findAllExperiences()).map((row) => ({
      ownerKey: row.ownerKey,
      companyInn: row.companyInn,
      positionName: row.positionName,
      startedOn: dateOnly(row.startedOn),
      endedOn: row.endedOn ? dateOnly(row.endedOn) : null,
    }));
  }

  @Get('projects')
  async projects(): Promise<object[]> {
    return (await this.service.findAllProjects()).map(
      ({ ownerKey, name, url }) => ({ ownerKey, name, url }),
    );
  }

  @Get('links')
  async links(): Promise<object[]> {
    return (await this.service.findAllLinks()).map(
      ({ ownerKey, label, url }) => ({ ownerKey, label, url }),
    );
  }
}
