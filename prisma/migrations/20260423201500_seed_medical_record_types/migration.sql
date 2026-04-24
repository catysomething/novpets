-- Seed catalog rows (required for FK inserts on Vaccine / Allergy).
INSERT OR IGNORE INTO "MedicalRecordTypes" ("id", "name", "payloadSchema", "storageModel")
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

-- Backfill existing rows if migration 20260423201445 ran on a DB that already had data without recordTypeId.
UPDATE "Vaccine" SET "recordTypeId" = 'VACCINE' WHERE "recordTypeId" IS NULL OR "recordTypeId" = '';
UPDATE "Allergy" SET "recordTypeId" = 'ALLERGY' WHERE "recordTypeId" IS NULL OR "recordTypeId" = '';
