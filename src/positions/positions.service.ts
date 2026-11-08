import { Injectable } from '@nestjs/common';
import type {
  CountById,
  Experience,
  ExperienceRecord,
  Position,
} from '../domain.js';
import { PositionsRepository } from './positions.repository.js';

@Injectable()
export class PositionsService {
  constructor(private readonly repository: PositionsRepository) {}

  findMany(): Promise<Position[]> {
    return this.repository.findMany();
  }

  findByName(name: string): Promise<Position | null> {
    return this.repository.findByName(name);
  }

  findByIds(ids: readonly string[]): Promise<Position[]> {
    return this.repository.findByIds(ids);
  }

  experienceRowsByPositionIds(
    ids: readonly string[],
  ): Promise<ExperienceRecord[]> {
    return this.repository.findExperienceRowsByPositionIds(ids);
  }

  experiencesByPositionIds(ids: readonly string[]): Promise<Experience[]> {
    return this.repository.findExperiencesByPositionIds(ids);
  }

  experienceCounts(ids: readonly string[]): Promise<CountById[]> {
    return this.repository.countExperiences(ids);
  }

  profileCounts(ids: readonly string[]): Promise<CountById[]> {
    return this.repository.countProfiles(ids);
  }
}
