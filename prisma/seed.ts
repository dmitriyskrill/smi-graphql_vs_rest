import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL обязателен для seed');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const companies = [
  { inn: '7700000000', name: 'ООО Технологии' },
  { inn: '7800000000', name: 'АО Платформа' },
] as const;

const profiles = [
  {
    ownerKey: 'anna-petrova',
    name: 'Анна Петрова',
    description: 'Backend-разработчик TypeScript и Node.js',
    skills: ['TypeScript', 'Node.js', 'NestJS', 'PostgreSQL'],
    experiences: [
      {
        companyInn: '7700000000',
        position: 'Backend-разработчик',
        startedOn: '2023-02-01',
        endedOn: null,
      },
    ],
    projects: [
      {
        name: 'Каталог специалистов',
        url: 'https://github.com/example/catalog',
      },
    ],
    links: [{ label: 'GitHub', url: 'https://github.com/example/anna' }],
  },
  {
    ownerKey: 'ivan-sidorov',
    name: 'Иван Сидоров',
    description: 'Fullstack-разработчик распределённых веб-приложений',
    skills: ['TypeScript', 'React', 'Node.js', 'GraphQL'],
    experiences: [
      {
        companyInn: '7700000000',
        position: 'Fullstack-разработчик',
        startedOn: '2022-06-01',
        endedOn: '2024-12-31',
      },
      {
        companyInn: '7800000000',
        position: 'Backend-разработчик',
        startedOn: '2025-01-15',
        endedOn: null,
      },
    ],
    projects: [
      {
        name: 'GraphQL gateway',
        url: 'https://github.com/example/gateway',
      },
    ],
    links: [{ label: 'GitHub', url: 'https://github.com/example/ivan' }],
  },
] as const;

function utcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function uniqueInOrder(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function requiredId(
  index: ReadonlyMap<string, string>,
  key: string,
  entity: string,
): string {
  const id = index.get(key);
  if (!id) throw new Error(`Seed не нашёл ${entity} «${key}»`);
  return id;
}

async function seed(): Promise<void> {
  const companyByInn = new Map(companies.map((row) => [row.inn, row.name]));
  for (const profile of profiles) {
    for (const experience of profile.experiences) {
      if (!companyByInn.has(experience.companyInn)) {
        throw new Error(
          `Опыт ${profile.ownerKey} ссылается на ИНН ${experience.companyInn}, которого нет в справочнике seed`,
        );
      }
    }
  }

  const companyIdByInn = new Map<string, string>();
  for (const company of companies) {
    const row = await prisma.company.upsert({
      where: { inn: company.inn },
      update: { name: company.name },
      create: { inn: company.inn, name: company.name },
    });
    companyIdByInn.set(row.inn, row.id);
  }

  const skillNames = uniqueInOrder(profiles.flatMap((row) => row.skills));
  const skillIdByName = new Map<string, string>();
  for (const name of skillNames) {
    const row = await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    skillIdByName.set(row.name, row.id);
  }

  const positionNames = uniqueInOrder(
    profiles.flatMap((row) =>
      row.experiences.map((experience) => experience.position),
    ),
  );
  const positionIdByName = new Map<string, string>();
  for (const name of positionNames) {
    const row = await prisma.position.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    positionIdByName.set(row.name, row.id);
  }

  await prisma.$transaction(async (tx) => {
    for (const data of profiles) {
      const profile = await tx.profile.upsert({
        where: { ownerKey: data.ownerKey },
        update: { name: data.name, description: data.description },
        create: {
          ownerKey: data.ownerKey,
          name: data.name,
          description: data.description,
        },
      });

      await tx.profileSkill.deleteMany({ where: { profileId: profile.id } });
      await tx.experience.deleteMany({ where: { profileId: profile.id } });
      await tx.project.deleteMany({ where: { profileId: profile.id } });
      await tx.profileLink.deleteMany({ where: { profileId: profile.id } });

      const skills = uniqueInOrder(data.skills).map((name, sortOrder) => ({
        profileId: profile.id,
        skillId: requiredId(skillIdByName, name, 'навык'),
        sortOrder,
      }));
      if (skills.length > 0) {
        await tx.profileSkill.createMany({ data: skills });
      }

      const experiences = data.experiences.map((experience, sortOrder) => ({
        profileId: profile.id,
        companyId: requiredId(
          companyIdByInn,
          experience.companyInn,
          'компания',
        ),
        positionId: requiredId(
          positionIdByName,
          experience.position,
          'должность',
        ),
        startedOn: utcDate(experience.startedOn),
        endedOn: experience.endedOn ? utcDate(experience.endedOn) : null,
        sortOrder,
      }));
      if (experiences.length > 0) {
        await tx.experience.createMany({ data: experiences });
      }

      const projects = data.projects.map((project, sortOrder) => ({
        profileId: profile.id,
        name: project.name,
        url: project.url,
        sortOrder,
      }));
      if (projects.length > 0) {
        await tx.project.createMany({ data: projects });
      }

      const links = data.links.map((link, sortOrder) => ({
        profileId: profile.id,
        label: link.label,
        url: link.url,
        sortOrder,
      }));
      if (links.length > 0) {
        await tx.profileLink.createMany({ data: links });
      }
    }
  });
}

try {
  await seed();
} finally {
  await prisma.$disconnect();
}
