import { Injectable } from '@nestjs/common';
import {
  toExperience,
  toExperienceRecord,
  type Company,
  type CountById,
  type Experience,
  type ExperienceRecord,
} from '../domain.js';
import { PrismaService } from '../prisma/prisma.service.js';

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

@Injectable()
export class CompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(): Promise<Company[]> {
    return this.prisma.company.findMany({
      orderBy: [{ name: 'asc' }, { inn: 'asc' }],
    });
  }

  findByInn(inn: string): Promise<Company | null> {
    return this.prisma.company.findUnique({ where: { inn } });
  }

  findByIds(ids: readonly string[]): Promise<Company[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.prisma.company.findMany({ where: { id: { in: [...ids] } } });
  }

  async findExperienceRowsByCompanyIds(
    companyIds: readonly string[],
  ): Promise<ExperienceRecord[]> {
    if (companyIds.length === 0) return [];
    const rows = await this.prisma.experience.findMany({
      where: { companyId: { in: [...companyIds] } },
      orderBy: [
        { companyId: 'asc' },
        { startedOn: 'desc' },
        { sortOrder: 'asc' },
      ],
      select: experienceRowSelect,
    });
    return rows.map(toExperienceRecord);
  }

  async findExperiencesByCompanyIds(
    companyIds: readonly string[],
  ): Promise<Experience[]> {
    if (companyIds.length === 0) return [];
    const rows = await this.prisma.experience.findMany({
      where: { companyId: { in: [...companyIds] } },
      orderBy: [
        { companyId: 'asc' },
        { startedOn: 'desc' },
        { sortOrder: 'asc' },
      ],
      select: experienceAddressSelect,
    });
    return rows.map(toExperience);
  }

  async countExperiences(companyIds: readonly string[]): Promise<CountById[]> {
    if (companyIds.length === 0) return [];
    const rows = await this.prisma.experience.groupBy({
      by: ['companyId'],
      where: { companyId: { in: [...companyIds] } },
      _count: true,
    });
    return rows.map((row) => ({ id: row.companyId, count: row._count }));
  }

  async countProfiles(companyIds: readonly string[]): Promise<CountById[]> {
    if (companyIds.length === 0) return [];
    const rows = await this.prisma.experience.groupBy({
      by: ['companyId', 'profileId'],
      where: { companyId: { in: [...companyIds] } },
    });
    const counts = new Map<string, number>();
    for (const row of rows) {
      counts.set(row.companyId, (counts.get(row.companyId) ?? 0) + 1);
    }
    return [...counts].map(([id, count]) => ({ id, count }));
  }
}
