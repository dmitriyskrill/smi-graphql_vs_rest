import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module.js';
import { PositionsModule } from '../positions/positions.module.js';
import { ProfileModule } from '../profile/profile.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { CatalogLoaderFactory } from './loaders.js';

@Module({
  imports: [ProfileModule, SkillsModule, CompaniesModule, PositionsModule],
  providers: [CatalogLoaderFactory],
  exports: [CatalogLoaderFactory],
})
export class GraphqlContextModule {}
