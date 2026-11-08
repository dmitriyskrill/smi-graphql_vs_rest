import {
  Args,
  Context,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { GraphqlContext } from '../graphql/loaders.js';
import { toSkillObject } from '../graphql/mappers.js';
import { ProfileObject, SkillObject } from '../graphql/types.js';
import { SkillsService } from './skills.service.js';

@Resolver(() => SkillObject)
export class SkillsResolver {
  constructor(private readonly service: SkillsService) {}

  @Query(() => [SkillObject])
  async skills(): Promise<SkillObject[]> {
    return (await this.service.findMany()).map(toSkillObject);
  }

  @Query(() => SkillObject, { nullable: true })
  async skill(@Args('name') name: string): Promise<SkillObject | null> {
    const skill = await this.service.findByName(name);
    return skill ? toSkillObject(skill) : null;
  }

  @ResolveField(() => [ProfileObject])
  profiles(
    @Parent() skill: SkillObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.profilesBySkill.load(skill.id);
  }

  @ResolveField()
  profileCount(
    @Parent() skill: SkillObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.profileCountBySkill.load(skill.id);
  }
}
