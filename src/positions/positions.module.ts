import { Module } from '@nestjs/common';
import { PositionsController } from './positions.controller.js';
import { PositionsRepository } from './positions.repository.js';
import { PositionsResolver } from './positions.resolver.js';
import { PositionsService } from './positions.service.js';

@Module({
  controllers: [PositionsController],
  providers: [PositionsRepository, PositionsService, PositionsResolver],
  exports: [PositionsService],
})
export class PositionsModule {}
