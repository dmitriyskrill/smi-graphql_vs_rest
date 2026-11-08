import {
  Args,
  Context,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { GraphqlContext } from '../graphql/loaders.js';
import {
  toExperienceObject,
  toLinkObject,
  toProfileObject,
  toProjectObject,
} from '../graphql/mappers.js';
import {
  ExperienceObject,
  ProfileLinkObject,
  ProfileObject,
  ProjectObject,
  SkillObject,
} from '../graphql/types.js';
import { ProfileService } from './profile.service.js';

@Resolver(() => ProfileObject)
export class ProfileResolver {
  constructor(private readonly service: ProfileService) {}

  @Query(() => [ProfileObject])
  async profiles(
    @Args('skill', { nullable: true }) skill?: string,
  ): Promise<ProfileObject[]> {
    return (await this.service.findMany(skill)).map(toProfileObject);
  }

  @Query(() => ProfileObject, { nullable: true })
  async profile(
    @Args('ownerKey') ownerKey: string,
  ): Promise<ProfileObject | null> {
    const profile = await this.service.findByOwnerKey(ownerKey);
    return profile ? toProfileObject(profile) : null;
  }

  @Query(() => [ExperienceObject])
  async experiences(): Promise<ExperienceObject[]> {
    return (await this.service.findAllExperienceRows()).map(toExperienceObject);
  }

  @Query(() => [ProjectObject])
  async projects(): Promise<ProjectObject[]> {
    return (await this.service.findAllProjects()).map(toProjectObject);
  }

  @Query(() => [ProfileLinkObject])
  async links(): Promise<ProfileLinkObject[]> {
    return (await this.service.findAllLinks()).map(toLinkObject);
  }

  @ResolveField(() => [SkillObject])
  skills(
    @Parent() profile: ProfileObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.skillsByProfile.load(profile.id);
  }

  @ResolveField(() => [ExperienceObject])
  experience(
    @Parent() profile: ProfileObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.experiencesByProfile.load(profile.id);
  }

  @ResolveField('projects', () => [ProjectObject])
  profileProjects(
    @Parent() profile: ProfileObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.projectsByProfile.load(profile.id);
  }

  @ResolveField('links', () => [ProfileLinkObject])
  profileLinks(
    @Parent() profile: ProfileObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.linksByProfile.load(profile.id);
  }

  @ResolveField()
  skillCount(
    @Parent() profile: ProfileObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.skillCountByProfile.load(profile.id);
  }

  @ResolveField()
  experienceCount(
    @Parent() profile: ProfileObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.experienceCountByProfile.load(profile.id);
  }

  @ResolveField()
  projectCount(
    @Parent() profile: ProfileObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.projectCountByProfile.load(profile.id);
  }

  @ResolveField()
  linkCount(
    @Parent() profile: ProfileObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.linkCountByProfile.load(profile.id);
  }
}

@Resolver(() => ExperienceObject)
export class ExperienceResolver {
  @ResolveField()
  async ownerKey(
    @Parent() experience: ExperienceObject,
    @Context() context: GraphqlContext,
  ): Promise<string> {
    const profile = await context.loaders.profileById.load(experience.profileId);
    return profile.ownerKey;
  }

  @ResolveField(() => ProfileObject)
  profile(
    @Parent() experience: ExperienceObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.profileById.load(experience.profileId);
  }

  @ResolveField()
  company(
    @Parent() experience: ExperienceObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.companyById.load(experience.companyId);
  }

  @ResolveField()
  position(
    @Parent() experience: ExperienceObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.positionById.load(experience.positionId);
  }
}

@Resolver(() => ProjectObject)
export class ProjectResolver {
  @ResolveField(() => ProfileObject)
  profile(
    @Parent() project: ProjectObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.profileById.load(project.profileId);
  }
}

@Resolver(() => ProfileLinkObject)
export class ProfileLinkResolver {
  @ResolveField(() => ProfileObject)
  profile(
    @Parent() link: ProfileLinkObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.profileById.load(link.profileId);
  }
}
