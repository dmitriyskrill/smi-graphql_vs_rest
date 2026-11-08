import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { SkillsService } from './skills.service.js';

@Controller('skills')
export class SkillsController {
  constructor(private readonly service: SkillsService) {}

  @Get()
  async skills(): Promise<object[]> {
    const skills = await this.service.findMany();
    const counts = new Map(
      (await this.service.profileCounts(skills.map(({ id }) => id))).map(
        ({ id, count }) => [id, count],
      ),
    );
    return skills.map(({ id, name }) => ({
      name,
      profileCount: counts.get(id) ?? 0,
    }));
  }

  @Get(':name')
  async skill(@Param('name') name: string): Promise<object> {
    const skill = await this.service.findByName(name);
    if (!skill) throw new NotFoundException('Навык не найден');
    const profiles = await this.service.profilesBySkillIds([skill.id]);
    return {
      name: skill.name,
      profiles: profiles.map(({ ownerKey, name: profileName, description }) => ({
        ownerKey,
        name: profileName,
        description,
      })),
    };
  }
}
