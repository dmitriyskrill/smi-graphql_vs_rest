import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { dateOnly } from '../domain.js';
import { PositionsService } from './positions.service.js';

@Controller('positions')
export class PositionsController {
  constructor(private readonly service: PositionsService) {}

  @Get()
  async positions(): Promise<object[]> {
    const positions = await this.service.findMany();
    const ids = positions.map(({ id }) => id);
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
    return positions.map(({ id, name }) => ({
      name,
      experienceCount: experiences.get(id) ?? 0,
      profileCount: profiles.get(id) ?? 0,
    }));
  }

  @Get(':name')
  async position(@Param('name') name: string): Promise<object> {
    const position = await this.service.findByName(name);
    if (!position) throw new NotFoundException('Должность не найдена');
    const experiences = await this.service.experiencesByPositionIds([
      position.id,
    ]);
    return {
      name: position.name,
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
