ALTER TABLE "Vaccine" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Vaccine" ADD COLUMN "removalNote" TEXT;
CREATE INDEX "Vaccine_deletedAt_idx" ON "Vaccine"("deletedAt");

ALTER TABLE "Allergy" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Allergy" ADD COLUMN "removalNote" TEXT;
CREATE INDEX "Allergy_deletedAt_idx" ON "Allergy"("deletedAt");
