/*
  Warnings:

  - Added the required column `recordTypeId` to the `Allergy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recordTypeId` to the `Vaccine` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "MedicalRecordTypes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "payloadSchema" JSONB NOT NULL,
    "storageModel" TEXT NOT NULL
);

INSERT INTO "MedicalRecordTypes" ("id", "name", "payloadSchema", "storageModel")
VALUES
  (
    'VACCINE',
    'Vaccine',
    '{"create":{"required":["vaccineName","dateAdministered"],"properties":{"vaccineName":"string","dateAdministered":"date"}},"update":{"required":[],"properties":{"vaccineName":"string","dateAdministered":"date"}},"delete":{"required":[],"properties":{}}}',
    'vaccine'
  ),
  (
    'ALLERGY',
    'Allergy',
    '{"create":{"required":["allergyName","reactions","severity"],"properties":{"allergyName":"string","reactions":"string","severity":{"type":"enum","values":["mild","severe"]}}},"update":{"required":[],"properties":{"allergyName":"string","reactions":"string","severity":{"type":"enum","values":["mild","severe"]}}},"delete":{"required":[],"properties":{}}}',
    'allergy'
  );

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Allergy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "recordTypeId" TEXT NOT NULL,
    "allergyName" TEXT NOT NULL,
    "reactions" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Allergy_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Allergy_recordTypeId_fkey" FOREIGN KEY ("recordTypeId") REFERENCES "MedicalRecordTypes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Allergy" ("allergyName", "createdAt", "id", "petId", "recordTypeId", "reactions", "severity", "updatedAt") SELECT "allergyName", "createdAt", "id", "petId", 'ALLERGY', "reactions", "severity", "updatedAt" FROM "Allergy";
DROP TABLE "Allergy";
ALTER TABLE "new_Allergy" RENAME TO "Allergy";
CREATE INDEX "Allergy_petId_idx" ON "Allergy"("petId");
CREATE INDEX "Allergy_recordTypeId_idx" ON "Allergy"("recordTypeId");
CREATE TABLE "new_Vaccine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "recordTypeId" TEXT NOT NULL,
    "vaccineName" TEXT NOT NULL,
    "dateAdministered" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vaccine_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vaccine_recordTypeId_fkey" FOREIGN KEY ("recordTypeId") REFERENCES "MedicalRecordTypes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Vaccine" ("createdAt", "dateAdministered", "id", "petId", "recordTypeId", "updatedAt", "vaccineName") SELECT "createdAt", "dateAdministered", "id", "petId", 'VACCINE', "updatedAt", "vaccineName" FROM "Vaccine";
DROP TABLE "Vaccine";
ALTER TABLE "new_Vaccine" RENAME TO "Vaccine";
CREATE INDEX "Vaccine_petId_idx" ON "Vaccine"("petId");
CREATE INDEX "Vaccine_recordTypeId_idx" ON "Vaccine"("recordTypeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
