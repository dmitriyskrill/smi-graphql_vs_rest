import { Injectable } from '@nestjs/common';
import {
  toExperience,
  toExperienceRecord,
  type CountById,
  type Experience,
  type ExperienceRecord,
  type Position,
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
export class PositionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(): Promise<Position[]> {
    return this.prisma.position.findMany({ orderBy: { name: 'asc' } });
  }

  findByName(name: string): Promise<Position | null> {
    return this.prisma.position.findUnique({ where: { name } });
  }

  findByIds(ids: readonly string[]): Promise<Position[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.prisma.position.findMany({ where: { id: { in: [...ids] } } });
  }

  async findExperienceRowsByPositionIds(
    positionIds: readonly string[],
  ): Promise<ExperienceRecord[]> {
    if (positionIds.length === 0) return [];
    const rows = await this.prisma.experience.findMany({
      where: { positionId: { in: [...positionIds] } },
      orderBy: [
        { positionId: 'asc' },
        { startedOn: 'desc' },
        { sortOrder: 'asc' },
      ],
      select: experienceRowSelect,
    });
    return rows.map(toExperienceRecord);
  }

  async findExperiencesByPositionIds(
    positionIds: readonly string[],
  ): Promise<Experience[]> {
    if (positionIds.length === 0) return [];
    const rows = await this.prisma.experience.findMany({
      where: { positionId: { in: [...positionIds] } },
      orderBy: [
        { positionId: 'asc' },
        { startedOn: 'desc' },
        { sortOrder: 'asc' },
      ],
      select: experienceAddressSelect,
    });
    return rows.map(toExperience);
  }

  async countExperiences(
    positionIds: readonly string[],
  ): Promise<CountById[]> {
    if (positionIds.length === 0) return [];
    const rows = await this.prisma.experience.groupBy({
      by: ['positionId'],
      where: { positionId: { in: [...positionIds] } },
      _count: true,
    });
    return rows.map((row) => ({ id: row.positionId, count: row._count }));
  }

  async countProfiles(positionIds: readonly string[]): Promise<CountById[]> {
    if (positionIds.length === 0) return [];
    const rows = await this.prisma.experience.groupBy({
      by: ['positionId', 'profileId'],
      where: { positionId: { in: [...positionIds] } },
    });
    const counts = new Map<string, number>();
    for (const row of rows) {
      counts.set(row.positionId, (counts.get(row.positionId) ?? 0) + 1);
    }
    return [...counts].map(([id, count]) => ({ id, count }));
  }
}
