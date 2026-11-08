import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module.js';
import { PositionsModule } from '../positions/positions.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { ProfileController } from './profile.controller.js';
import { ProfileRepository } from './profile.repository.js';
import {
  ExperienceResolver,
  ProfileLinkResolver,
  ProfileResolver,
  ProjectResolver,
} from './profile.resolver.js';
import { ProfileService } from './profile.service.js';

@Module({
  imports: [SkillsModule, CompaniesModule, PositionsModule],
  controllers: [ProfileController],
  providers: [
    ProfileRepository,
    ProfileService,
    ProfileResolver,
    ExperienceResolver,
    ProjectResolver,
    ProfileLinkResolver,
  ],
  exports: [ProfileService],
})
export class ProfileModule {}
