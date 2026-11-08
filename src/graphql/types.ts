import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('Profile')
export class ProfileObject {
  id: string;

  @Field()
  ownerKey: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => Int)
  skillCount: number;

  @Field(() => Int)
  experienceCount: number;

  @Field(() => Int)
  projectCount: number;

  @Field(() => Int)
  linkCount: number;

  @Field(() => [SkillObject])
  skills: SkillObject[];

  @Field(() => [ExperienceObject])
  experience: ExperienceObject[];

  @Field(() => [ProjectObject])
  projects: ProjectObject[];

  @Field(() => [ProfileLinkObject])
  links: ProfileLinkObject[];
}

@ObjectType('Skill')
export class SkillObject {
  id: string;

  @Field()
  name: string;

  @Field(() => Int)
  profileCount: number;

  @Field(() => [ProfileObject])
  profiles: ProfileObject[];
}

@ObjectType('Company')
export class CompanyObject {
  id: string;

  @Field()
  inn: string;

  @Field()
  name: string;

  @Field(() => Int)
  experienceCount: number;

  @Field(() => Int)
  profileCount: number;

  @Field(() => [ExperienceObject])
  experiences: ExperienceObject[];
}

@ObjectType('Position')
export class PositionObject {
  id: string;

  @Field()
  name: string;

  @Field(() => Int)
  experienceCount: number;

  @Field(() => Int)
  profileCount: number;

  @Field(() => [ExperienceObject])
  experiences: ExperienceObject[];
}

@ObjectType('Experience')
export class ExperienceObject {
  id: string;
  profileId: string;
  companyId: string;
  positionId: string;

  @Field()
  ownerKey: string;

  @Field()
  startedOn: string;

  @Field(() => String, { nullable: true })
  endedOn: string | null;

  @Field(() => ProfileObject)
  profile: ProfileObject;

  @Field(() => CompanyObject)
  company: CompanyObject;

  @Field(() => PositionObject)
  position: PositionObject;
}

@ObjectType('Project')
export class ProjectObject {
  id: string;
  profileId: string;

  @Field()
  ownerKey: string;

  @Field()
  name: string;

  @Field()
  url: string;

  @Field(() => ProfileObject)
  profile: ProfileObject;
}

@ObjectType('ProfileLink')
export class ProfileLinkObject {
  id: string;
  profileId: string;

  @Field()
  ownerKey: string;

  @Field()
  label: string;

  @Field()
  url: string;

  @Field(() => ProfileObject)
  profile: ProfileObject;
}
