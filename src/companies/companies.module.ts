import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller.js';
import { CompaniesRepository } from './companies.repository.js';
import { CompaniesResolver } from './companies.resolver.js';
import { CompaniesService } from './companies.service.js';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesRepository, CompaniesService, CompaniesResolver],
  exports: [CompaniesService],
})
export class CompaniesModule {}
