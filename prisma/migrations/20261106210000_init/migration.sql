CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "Profile" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ownerKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Skill" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProfileSkill" (
  "profileId" UUID NOT NULL,
  "skillId" UUID NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "ProfileSkill_pkey" PRIMARY KEY ("profileId", "skillId")
);

CREATE TABLE "Company" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "inn" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Position" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Experience" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "profileId" UUID NOT NULL,
  "companyId" UUID NOT NULL,
  "positionId" UUID NOT NULL,
  "startedOn" DATE NOT NULL,
  "endedOn" DATE,
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Project" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "profileId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProfileLink" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "profileId" UUID NOT NULL,
  "label" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "ProfileLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Profile_ownerKey_key" ON "Profile"("ownerKey");
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");
CREATE UNIQUE INDEX "Company_inn_key" ON "Company"("inn");
CREATE UNIQUE INDEX "Position_name_key" ON "Position"("name");
CREATE INDEX "ProfileSkill_skillId_profileId_idx" ON "ProfileSkill"("skillId", "profileId");
CREATE INDEX "ProfileSkill_profileId_sortOrder_idx" ON "ProfileSkill"("profileId", "sortOrder");
CREATE INDEX "Experience_profileId_sortOrder_idx" ON "Experience"("profileId", "sortOrder");
CREATE INDEX "Experience_companyId_idx" ON "Experience"("companyId");
CREATE INDEX "Experience_positionId_idx" ON "Experience"("positionId");
CREATE INDEX "Project_profileId_sortOrder_idx" ON "Project"("profileId", "sortOrder");
CREATE INDEX "ProfileLink_profileId_sortOrder_idx" ON "ProfileLink"("profileId", "sortOrder");

ALTER TABLE "ProfileSkill"
  ADD CONSTRAINT "ProfileSkill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "ProfileSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT;
ALTER TABLE "Experience"
  ADD CONSTRAINT "Experience_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "Experience_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "Experience_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT;
ALTER TABLE "Project"
  ADD CONSTRAINT "Project_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE;
ALTER TABLE "ProfileLink"
  ADD CONSTRAINT "ProfileLink_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE;
