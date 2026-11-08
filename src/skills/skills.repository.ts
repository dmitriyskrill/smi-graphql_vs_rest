import { Injectable } from '@nestjs/common';
import type { CountById, Profile, Skill } from '../domain.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SkillsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(): Promise<Skill[]> {
    return this.prisma.skill.findMany({ orderBy: { name: 'asc' } });
  }

  findByName(name: string): Promise<Skill | null> {
    return this.prisma.skill.findUnique({ where: { name } });
  }

  findByIds(ids: readonly string[]): Promise<Skill[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.prisma.skill.findMany({ where: { id: { in: [...ids] } } });
  }

  async findProfilesBySkillIds(
    skillIds: readonly string[],
  ): Promise<Array<Profile & { skillId: string }>> {
    if (skillIds.length === 0) return [];
    const rows = await this.prisma.profileSkill.findMany({
      where: { skillId: { in: [...skillIds] } },
      orderBy: [{ skillId: 'asc' }, { profile: { ownerKey: 'asc' } }],
      select: {
        skillId: true,
        profile: {
          select: { id: true, ownerKey: true, name: true, description: true },
        },
      },
    });
    return rows.map(({ skillId, profile }) => ({ ...profile, skillId }));
  }

  async countProfiles(skillIds: readonly string[]): Promise<CountById[]> {
    if (skillIds.length === 0) return [];
    const rows = await this.prisma.profileSkill.groupBy({
      by: ['skillId'],
      where: { skillId: { in: [...skillIds] } },
      _count: true,
    });
    return rows.map((row) => ({ id: row.skillId, count: row._count }));
  }
}
