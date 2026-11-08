import type {
  Company,
  ExperienceRecord,
  Position,
  Profile,
  ProfileLink,
  Project,
  Skill,
} from '../domain.js';
import { dateOnly } from '../domain.js';
import type {
  CompanyObject,
  ExperienceObject,
  PositionObject,
  ProfileLinkObject,
  ProfileObject,
  ProjectObject,
  SkillObject,
} from './types.js';

export const toProfileObject = (value: Profile): ProfileObject =>
  value as ProfileObject;
export const toSkillObject = (value: Skill): SkillObject =>
  value as SkillObject;
export const toCompanyObject = (value: Company): CompanyObject =>
  value as CompanyObject;
export const toPositionObject = (value: Position): PositionObject =>
  value as PositionObject;
export const toProjectObject = (value: Project): ProjectObject =>
  value as ProjectObject;
export const toLinkObject = (value: ProfileLink): ProfileLinkObject =>
  value as ProfileLinkObject;

export function toExperienceObject(value: ExperienceRecord): ExperienceObject {
  return {
    id: value.id,
    profileId: value.profileId,
    companyId: value.companyId,
    positionId: value.positionId,
    startedOn: dateOnly(value.startedOn),
    endedOn: value.endedOn ? dateOnly(value.endedOn) : null,
  } as ExperienceObject;
}
