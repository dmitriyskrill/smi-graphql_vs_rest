import { Injectable } from '@nestjs/common';
import type {
  Company,
  CountById,
  Experience,
  ExperienceRecord,
} from '../domain.js';
import { CompaniesRepository } from './companies.repository.js';

@Injectable()
export class CompaniesService {
  constructor(private readonly repository: CompaniesRepository) {}

  findMany(): Promise<Company[]> {
    return this.repository.findMany();
  }

  findByInn(inn: string): Promise<Company | null> {
    return this.repository.findByInn(inn);
  }

  findByIds(ids: readonly string[]): Promise<Company[]> {
    return this.repository.findByIds(ids);
  }

  experienceRowsByCompanyIds(
    ids: readonly string[],
  ): Promise<ExperienceRecord[]> {
    return this.repository.findExperienceRowsByCompanyIds(ids);
  }

  experiencesByCompanyIds(ids: readonly string[]): Promise<Experience[]> {
    return this.repository.findExperiencesByCompanyIds(ids);
  }

  experienceCounts(ids: readonly string[]): Promise<CountById[]> {
    return this.repository.countExperiences(ids);
  }

  profileCounts(ids: readonly string[]): Promise<CountById[]> {
    return this.repository.countProfiles(ids);
  }
}
