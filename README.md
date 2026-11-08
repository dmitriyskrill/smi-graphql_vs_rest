# it_smi-hh-analog-server

Учебный каталог специалистов: много профилей, общие справочники навыков,
компаний и должностей, REST и GraphQL поверх одних сценариев. Условие —
[TASK.md](TASK.md). Пишет данные только seed.

Node одной версии `26.13.0`: `.nvmrc`, `engines` и образ `node:26.13.0-bookworm-slim`.

## Границы

Один процесс Nest на штатном Express. Модуль появляется вместе со сценарием.

| Модуль | Сценарий | Кто читает базу |
| --- | --- | --- |
| `profile` | карточка, список, фильтр по навыку, опыты, проекты и ссылки | `profile.repository`: скаляры и пакетные выборки связей профиля |
| `skills` | справочник, число людей, люди с навыком | `skills.repository`: один запрос справочника или один запрос `ProfileSkill` |
| `companies` | справочник, число опытов, число разных людей, опыты компании | `companies.repository` |
| `positions` | справочник, число опытов, число разных людей, опыты должности | `positions.repository` |

`profile` импортирует `skills`, чтобы превратить имя фильтра в id навыка, и
импортирует `companies` и `positions`, чтобы по id опыта пакетно подставить
строки справочника. Аналитика справочника остаётся в своём модуле: карточка
вызывает только «найти строки по id».

Таблица `Experience` общая, запросы разные: `profile` читает опыты человека,
`companies` — опыты компании, `positions` — опыты должности. Проект и ссылка
своих модулей не имеют: отдельные списки — ещё один вход `profile`.

Внутри модуля три слоя. Контроллер и резолвер вызывают сервис; поле GraphQL
идёт в loader текущего запроса. Сервис держит сценарий и не пишет условия
запросов. Репозиторий читает Prisma и возвращает доменные типы из
`src/domain.ts`. HTTP- и GraphQL-ответ собирается снаружи репозитория.
`PrismaService` — один `PrismaClient` на процесс. Seed импортирует клиент
напрямую и в Nest не входит.

## Модель

Схема — `prisma/schema.prisma`, миграция —
`prisma/migrations/20261106210000_init`.

| Сущность | Адрес | Связи |
| --- | --- | --- |
| `Profile` | уникальный `ownerKey` | навыки, опыты, проекты, ссылки |
| `Skill` | уникальное `name` | профили через `ProfileSkill` |
| `ProfileSkill` | пара `profileId` + `skillId` | `sortOrder` свой у человека |
| `Company` | уникальный `inn` | опыты; название ключом не является |
| `Position` | уникальное `name` | опыты |
| `Experience` | строка одного профиля | `companyId`, `positionId`, даты; текста компании и должности нет |
| `Project`, `ProfileLink` | строки одного профиля | общего справочника нет |

Пустая дата окончания опыта значит, что работа продолжается. Пустая связь
возвращается пустым списком. Внешние ключи на владельца — `ON DELETE CASCADE`,
на справочники — `ON DELETE RESTRICT`. Индексы стоят на адресах и на полях,
по которым связи читаются пакетом: `profileId` и `sortOrder`, `skillId`,
`companyId`, `positionId`.

## Запись

`prisma/seed.ts` — единственный писатель. Компания поднимается `upsert` по
`inn` (имя обновляется), навык и должность — по `name`, профиль — по
`ownerKey` (имя и описание обновляются). Опыт выбирает уже созданную компанию
по ИНН и должность по названию. У каждого профиля из списка seed заново
собирает навыки, опыты, проекты и ссылки. Повторный запуск оставляет одну
строку на `ownerKey`, `inn` и название и тот же набор связей этого профиля.
Профили и строки справочников с другими ключами seed не удаляет.

В seed два профиля. Оба связаны с компанией `7700000000` и навыком
`TypeScript`; у второго есть ещё компания `7800000000`.

## GraphQL

Code-first, маршрут `POST /graphql`. Корневые поля: `profiles(skill)`,
`profile(ownerKey)`, `skills`, `skill(name)`, `companies`, `company(inn)`,
`positions`, `position(name)`, `experiences`, `projects`, `links`.

Вложенные поля объявлены `@ResolveField` и читаются через `CatalogLoaders` из
`src/graphql/loaders.ts`. Фабрика создаёт новый набор `DataLoader` в
`context` каждого HTTP-запроса; кэша между запросами нет. Запрос одних
скаляров связи не читает и не считает. Число — отдельный `groupBy` в
репозитории, без загрузки строк. `profileCount` компании и должности считает
разных людей. Список из десяти карточек с навыками — два SQL: профили и одна
выборка навыков по их id. Следующий уровень графа — ещё одно пакетное чтение
по id родителей этого уровня.

`Experience` в GraphQL — это `ownerKey`, даты, `profile`, `company` и
`position`. Строка опыта для резолверов не присоединяет эти таблицы.
`ownerKey` и `profile` идут через один `profileById`, компания и должность —
своими loader-ами. Адреса ИНН и названия должности в GraphQL нет: их отдают
отдельные REST-списки.

GET `/graphql` открывает встроенный Apollo Sandbox. В `@nestjs/apollo` 14
`graphiql` и устаревший `playground` — это GraphiQL, не Sandbox. Пока флаг не
`false`, драйвер добавляет `GraphiQLPlaygroundPlugin`. При `graphiql: false`
он добавляет маркер `ApolloServerPluginLandingPageDisabled`, и Apollo Server 5
не ставит свою landing page сам. Явный
`ApolloServerPluginLandingPageLocalDefault({ embed: true })` остаётся
единственным плагином с `renderLandingPage` и отдаёт Sandbox. Два таких
плагина сервер не поднимет.

## REST

Те же сервисы. Без `include` список и карточка не читают связи и не считают
их. `include` принимает `skills`, `experience`, `projects`, `links` и
подключает только названные прямые связи. `include=experience` читает строки
опыта без join компании и должности и подставляет справочники одним
`findByIds` на каждую таблицу, без `experienceCount` и без второго чтения тех
же строк. `GET /experiences`, `GET /companies/:inn` и `GET /positions/:name`
отдают адреса `ownerKey`, ИНН и название должности своим запросом.
Следующий уровень — другой маршрут.

| Метод и путь | Ответ |
| --- | --- |
| `GET /profiles` | скаляры карточек |
| `GET /profiles?skill=TypeScript` | тот же список, фильтр по id навыка |
| `GET /profiles?include=skills` | скаляры и одна пакетная выборка навыков |
| `GET /profiles/:ownerKey` | одна карточка |
| `GET /profiles/:ownerKey?include=skills,experience,projects,links` | карточка и названные связи |
| `GET /skills` | справочник и число людей |
| `GET /skills/:name` | навык и профили, у которых он есть |
| `GET /companies` | справочник, число опытов и число людей |
| `GET /companies/:inn` | компания и её опыты с адресами |
| `GET /positions` | справочник, число опытов и число людей |
| `GET /positions/:name` | должность и её опыты с адресами |
| `GET /experiences` | все опыты: `ownerKey`, ИНН, должность, даты |
| `GET /projects` | все проекты |
| `GET /links` | все ссылки |

## Запуск

Локально, при уже запущенном PostgreSQL:

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

Нужны переменные из `.env.example`: `PORT` и `DATABASE_URL`.

Контейнеры:

```bash
docker compose up --build
```

Postgres `18` с healthcheck `pg_isready`. У официального образа 18 каталог
данных — `/var/lib/postgresql/18/docker`, том монтируется в
`/var/lib/postgresql`. Приложение стартует после `service_healthy`.
`docker-entrypoint.sh` выполняет `prisma migrate deploy`, затем идемпотентный
seed, и только потом `node dist/main.js`. Если миграция или seed завершились
с ошибкой, процесс слушать порт не начинает. Образ собирается на Node
`26.13.0`. На шаге `prisma generate` в сборку передаётся placeholder
`DATABASE_URL`: конфиг Prisma читает переменную, к базе сборка не подключается.
Повторный `up` оставляет те же справочники и те же профили по `ownerKey` и не
удаляет строки с другими ключами. Том PostgreSQL 17 с этим монтированием
несовместим: для пустого старта нужен новый volume.
