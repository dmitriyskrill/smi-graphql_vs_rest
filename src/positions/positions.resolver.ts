import {
  Args,
  Context,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { GraphqlContext } from '../graphql/loaders.js';
import { toPositionObject } from '../graphql/mappers.js';
import { ExperienceObject, PositionObject } from '../graphql/types.js';
import { PositionsService } from './positions.service.js';

@Resolver(() => PositionObject)
export class PositionsResolver {
  constructor(private readonly service: PositionsService) {}

  @Query(() => [PositionObject])
  async positions(): Promise<PositionObject[]> {
    return (await this.service.findMany()).map(toPositionObject);
  }

  @Query(() => PositionObject, { nullable: true })
  async position(@Args('name') name: string): Promise<PositionObject | null> {
    const position = await this.service.findByName(name);
    return position ? toPositionObject(position) : null;
  }

  @ResolveField(() => [ExperienceObject])
  experiences(
    @Parent() position: PositionObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.experiencesByPosition.load(position.id);
  }

  @ResolveField()
  experienceCount(
    @Parent() position: PositionObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.experienceCountByPosition.load(position.id);
  }

  @ResolveField()
  profileCount(
    @Parent() position: PositionObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.profileCountByPosition.load(position.id);
  }
}
