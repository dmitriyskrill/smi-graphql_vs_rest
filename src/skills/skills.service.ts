import { Injectable } from '@nestjs/common';
import type { CountById, Profile, Skill } from '../domain.js';
import { SkillsRepository } from './skills.repository.js';

@Injectable()
export class SkillsService {
  constructor(private readonly repository: SkillsRepository) {}

  findMany(): Promise<Skill[]> {
    return this.repository.findMany();
  }

  findByName(name: string): Promise<Skill | null> {
    return this.repository.findByName(name);
  }

  findByIds(ids: readonly string[]): Promise<Skill[]> {
    return this.repository.findByIds(ids);
  }

  profilesBySkillIds(
    ids: readonly string[],
  ): Promise<Array<Profile & { skillId: string }>> {
    return this.repository.findProfilesBySkillIds(ids);
  }

  profileCounts(ids: readonly string[]): Promise<CountById[]> {
    return this.repository.countProfiles(ids);
  }
}
