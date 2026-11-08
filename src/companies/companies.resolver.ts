import {
  Args,
  Context,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { GraphqlContext } from '../graphql/loaders.js';
import { toCompanyObject } from '../graphql/mappers.js';
import { CompanyObject, ExperienceObject } from '../graphql/types.js';
import { CompaniesService } from './companies.service.js';

@Resolver(() => CompanyObject)
export class CompaniesResolver {
  constructor(private readonly service: CompaniesService) {}

  @Query(() => [CompanyObject])
  async companies(): Promise<CompanyObject[]> {
    return (await this.service.findMany()).map(toCompanyObject);
  }

  @Query(() => CompanyObject, { nullable: true })
  async company(@Args('inn') inn: string): Promise<CompanyObject | null> {
    const company = await this.service.findByInn(inn);
    return company ? toCompanyObject(company) : null;
  }

  @ResolveField(() => [ExperienceObject])
  experiences(
    @Parent() company: CompanyObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.experiencesByCompany.load(company.id);
  }

  @ResolveField()
  experienceCount(
    @Parent() company: CompanyObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.experienceCountByCompany.load(company.id);
  }

  @ResolveField()
  profileCount(
    @Parent() company: CompanyObject,
    @Context() context: GraphqlContext,
  ) {
    return context.loaders.profileCountByCompany.load(company.id);
  }
}
