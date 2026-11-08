import { Module } from '@nestjs/common';
import { SkillsController } from './skills.controller.js';
import { SkillsRepository } from './skills.repository.js';
import { SkillsResolver } from './skills.resolver.js';
import { SkillsService } from './skills.service.js';

@Module({
  controllers: [SkillsController],
  providers: [SkillsRepository, SkillsService, SkillsResolver],
  exports: [SkillsService],
})
export class SkillsModule {}
