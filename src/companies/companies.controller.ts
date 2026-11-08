import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { dateOnly } from '../domain.js';
import { CompaniesService } from './companies.service.js';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  async companies(): Promise<object[]> {
    const companies = await this.service.findMany();
    const ids = companies.map(({ id }) => id);
    const [experienceCounts, profileCounts] = await Promise.all([
      this.service.experienceCounts(ids),
      this.service.profileCounts(ids),
    ]);
    const experiences = new Map(
      experienceCounts.map(({ id, count }) => [id, count]),
    );
    const profiles = new Map(
      profileCounts.map(({ id, count }) => [id, count]),
    );
    return companies.map(({ id, inn, name }) => ({
      inn,
      name,
      experienceCount: experiences.get(id) ?? 0,
      profileCount: profiles.get(id) ?? 0,
    }));
  }

  @Get(':inn')
  async company(@Param('inn') inn: string): Promise<object> {
    const company = await this.service.findByInn(inn);
    if (!company) throw new NotFoundException('Компания не найдена');
    const experiences = await this.service.experiencesByCompanyIds([
      company.id,
    ]);
    return {
      inn: company.inn,
      name: company.name,
      experiences: experiences.map((row) => ({
        ownerKey: row.ownerKey,
        companyInn: row.companyInn,
        positionName: row.positionName,
        startedOn: dateOnly(row.startedOn),
        endedOn: row.endedOn ? dateOnly(row.endedOn) : null,
      })),
    };
  }
}
