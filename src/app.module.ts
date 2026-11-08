import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { CompaniesModule } from './companies/companies.module.js';
import { validateEnv } from './config/env.js';
import { GraphqlContextModule } from './graphql/graphql-context.module.js';
import { CatalogLoaderFactory } from './graphql/loaders.js';
import { PositionsModule } from './positions/positions.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { SkillsModule } from './skills/skills.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    ProfileModule,
    SkillsModule,
    CompaniesModule,
    PositionsModule,
    GraphqlContextModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [GraphqlContextModule],
      inject: [CatalogLoaderFactory],
      useFactory: (loaderFactory: CatalogLoaderFactory) => ({
        autoSchemaFile: true,
        sortSchema: true,
        path: '/graphql',
        // @nestjs/apollo 14: graphiql и playground — это GraphiQL, не Sandbox.
        // false добавляет маркер LandingPageDisabled, и Apollo Server 5 не
        // ставит второй renderLandingPage. Плагин ниже — единственная страница:
        // GET /graphql отдаёт встроенный Apollo Sandbox.
        graphiql: false,
        introspection: true,
        plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
        context: () => ({ loaders: loaderFactory.create() }),
      }),
    }),
  ],
})
export class AppModule {}
