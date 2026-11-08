export interface Profile {
  id: string;
  ownerKey: string;
  name: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
}

export interface Company {
  id: string;
  inn: string;
  name: string;
}

export interface Position {
  id: string;
  name: string;
}

export interface ExperienceRecord {
  id: string;
  profileId: string;
  companyId: string;
  positionId: string;
  startedOn: Date;
  endedOn: Date | null;
}

export interface Experience extends ExperienceRecord {
  ownerKey: string;
  companyInn: string;
  positionName: string;
}

export interface Project {
  id: string;
  profileId: string;
  ownerKey: string;
  name: string;
  url: string;
}

export interface ProfileLink {
  id: string;
  profileId: string;
  ownerKey: string;
  label: string;
  url: string;
}

export interface CountById {
  id: string;
  count: number;
}

export function groupByParent<T>(
  parentIds: readonly string[],
  rows: readonly T[],
  getParentId: (row: T) => string,
): T[][] {
  const grouped = new Map(parentIds.map((id) => [id, [] as T[]]));
  for (const row of rows) {
    grouped.get(getParentId(row))?.push(row);
  }
  return parentIds.map((id) => grouped.get(id) ?? []);
}

export function mapById<T extends { id: string }>(
  ids: readonly string[],
  rows: readonly T[],
): (T | null)[] {
  const indexed = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => indexed.get(id) ?? null);
}

export function mapCounts(
  ids: readonly string[],
  counts: readonly CountById[],
): number[] {
  const indexed = new Map(counts.map(({ id, count }) => [id, count]));
  return ids.map((id) => indexed.get(id) ?? 0);
}

export function dateOnly(value: Date | string): string {
  const date = value instanceof Date ? value : parseDateOnly(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Некорректная дата');
  }
  // @db.Date приходит либо календарной строкой, либо UTC-полночью,
  // либо локальной полночью драйвера. Берём тот календарный день,
  // который совпадает с полночью, чтобы сдвиг пояса не менял дату.
  const utcMidnight =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;
  const year = utcMidnight ? date.getUTCFullYear() : date.getFullYear();
  const month = (utcMidnight ? date.getUTCMonth() : date.getMonth()) + 1;
  const day = utcMidnight ? date.getUTCDate() : date.getDate();
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseDateOnly(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
  return new Date(value);
}

export interface ExperienceSource {
  id: string;
  profileId: string;
  companyId: string;
  positionId: string;
  startedOn: Date | string;
  endedOn: Date | string | null;
  profile: { ownerKey: string };
  company: { inn: string };
  position: { name: string };
}

export function toExperienceRecord(row: {
  id: string;
  profileId: string;
  companyId: string;
  positionId: string;
  startedOn: Date | string;
  endedOn: Date | string | null;
}): ExperienceRecord {
  return {
    id: row.id,
    profileId: row.profileId,
    companyId: row.companyId,
    positionId: row.positionId,
    startedOn:
      row.startedOn instanceof Date ? row.startedOn : parseDateOnly(row.startedOn),
    endedOn:
      row.endedOn == null
        ? null
        : row.endedOn instanceof Date
          ? row.endedOn
          : parseDateOnly(row.endedOn),
  };
}

export function toExperience(row: ExperienceSource): Experience {
  return {
    ...toExperienceRecord(row),
    ownerKey: row.profile.ownerKey,
    companyInn: row.company.inn,
    positionName: row.position.name,
  };
}

export function toProject(row: {
  id: string;
  profileId: string;
  name: string;
  url: string;
  profile: { ownerKey: string };
}): Project {
  return {
    id: row.id,
    profileId: row.profileId,
    ownerKey: row.profile.ownerKey,
    name: row.name,
    url: row.url,
  };
}

export function toLink(row: {
  id: string;
  profileId: string;
  label: string;
  url: string;
  profile: { ownerKey: string };
}): ProfileLink {
  return {
    id: row.id,
    profileId: row.profileId,
    ownerKey: row.profile.ownerKey,
    label: row.label,
    url: row.url,
  };
}
