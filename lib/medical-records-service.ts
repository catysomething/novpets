import type { MedicalRecordType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PropertyDefinition =
  | "string"
  | "date"
  | { type: "enum"; values: string[] };

type OperationSchema = {
  required?: string[];
  properties?: Record<string, PropertyDefinition>;
};

type PayloadSchemaDocument = {
  create?: OperationSchema;
  update?: OperationSchema;
  delete?: OperationSchema;
};

export type ValidatedMedicalRecord = {
  typeId: string;
  storageModel: string;
  /** Normalized string values; dates as ISO strings; enums as allowed string values. */
  fields: Record<string, string>;
};

function asPayloadSchemaDocument(json: unknown): PayloadSchemaDocument | null {
  if (!json || typeof json !== "object") return null;
  return json as PayloadSchemaDocument;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeDateString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function isFieldEmpty(value: unknown, def: PropertyDefinition | undefined): boolean {
  if (!def) return normalizeString(value) == null;
  if (def === "string") return normalizeString(value) == null;
  if (def === "date") return normalizeDateString(value) == null;
  if (typeof def === "object" && def.type === "enum") {
    return typeof value !== "string" || !def.values.includes(value);
  }
  return true;
}

function shouldSkipRow(
  storageModel: string,
  fields: Record<string, unknown>,
  createSchema: OperationSchema,
): boolean {
  if (storageModel === "vaccine") {
    return (
      !normalizeString(fields.vaccineName) &&
      !normalizeDateString(fields.dateAdministered)
    );
  }
  if (storageModel === "allergy") {
    return (
      !normalizeString(fields.allergyName) && !normalizeString(fields.reactions)
    );
  }
  const required = createSchema.required ?? [];
  const props = createSchema.properties ?? {};
  return required.every((key) => isFieldEmpty(fields[key], props[key]));
}

function validateField(
  key: string,
  value: unknown,
  def: PropertyDefinition | undefined,
): { ok: true; value: string } | { ok: false; message: string } {
  if (!def) {
    const s = normalizeString(value);
    if (!s) return { ok: false, message: `${key} is required.` };
    return { ok: true, value: s };
  }
  if (def === "string") {
    const s = normalizeString(value);
    if (!s) return { ok: false, message: `${key} must be a non-empty string.` };
    return { ok: true, value: s };
  }
  if (def === "date") {
    const d = normalizeDateString(value);
    if (!d) return { ok: false, message: `${key} must be a valid date.` };
    return { ok: true, value: d };
  }
  if (typeof def === "object" && def.type === "enum" && Array.isArray(def.values)) {
    if (typeof value !== "string" || !def.values.includes(value)) {
      return {
        ok: false,
        message: `${key} must be one of: ${def.values.join(", ")}.`,
      };
    }
    return { ok: true, value };
  }
  return { ok: false, message: `${key} has an unsupported schema definition.` };
}

type CreateRowOutcome =
  | { outcome: "skip" }
  | { outcome: "ok"; record: ValidatedMedicalRecord }
  | { outcome: "error"; errors: string[] };

function validateCreateRow(
  rowLabel: string,
  raw: Record<string, unknown>,
  typeRow: MedicalRecordType,
): CreateRowOutcome {
  const doc = asPayloadSchemaDocument(typeRow.payloadSchema);
  const createSchema = doc?.create;
  if (!createSchema) {
    return {
      outcome: "error",
      errors: [
        `${rowLabel}: type "${typeRow.id}" has no create schema in payloadSchema.`,
      ],
    };
  }

  if (typeRow.storageModel !== "vaccine" && typeRow.storageModel !== "allergy") {
    return {
      outcome: "error",
      errors: [
        `${rowLabel}: type "${typeRow.id}" uses unsupported storageModel "${typeRow.storageModel}".`,
      ],
    };
  }

  const { required = [], properties = {} } = createSchema;
  const fields: Record<string, unknown> = { ...raw };
  delete fields.typeId;
  delete fields.kind;

  if (shouldSkipRow(typeRow.storageModel, fields, createSchema)) {
    return { outcome: "skip" };
  }

  const errors: string[] = [];
  const started = required.some(
    (key) => !isFieldEmpty(fields[key], properties[key]),
  );

  if (!started) {
    return { outcome: "skip" };
  }

  for (const key of required) {
    if (isFieldEmpty(fields[key], properties[key])) {
      errors.push(`${rowLabel}: ${key} is required for type ${typeRow.id}.`);
    }
  }

  if (errors.length > 0) {
    return { outcome: "error", errors };
  }

  const normalized: Record<string, string> = {};

  for (const key of required) {
    const result = validateField(key, fields[key], properties[key]);
    if (!result.ok) errors.push(`${rowLabel}: ${result.message}`);
    else normalized[key] = result.value;
  }

  for (const key of Object.keys(properties)) {
    if (required.includes(key)) continue;
    if (fields[key] === undefined || fields[key] === "") continue;
    const result = validateField(key, fields[key], properties[key]);
    if (!result.ok) errors.push(`${rowLabel}: ${result.message}`);
    else normalized[key] = result.value;
  }

  if (errors.length > 0) return { outcome: "error", errors };

  return {
    outcome: "ok",
    record: {
      typeId: typeRow.id,
      storageModel: typeRow.storageModel,
      fields: normalized,
    },
  };
}

export async function listMedicalRecordTypes(): Promise<MedicalRecordType[]> {
  return prisma.medicalRecordType.findMany({ orderBy: { id: "asc" } });
}

export async function validateMedicalRecordsPayload(payload: unknown): Promise<{
  data?: ValidatedMedicalRecord[];
  errors?: string[];
}> {
  if (!payload || typeof payload !== "object") {
    return { errors: ["Request body must be a JSON object."] };
  }

  const body = payload as Record<string, unknown>;
  if (!Array.isArray(body.records)) {
    return { errors: ["records must be an array."] };
  }

  const types = await prisma.medicalRecordType.findMany();
  const typeById = new Map(types.map((t) => [t.id, t]));

  const data: ValidatedMedicalRecord[] = [];
  const errors: string[] = [];

  for (let index = 0; index < body.records.length; index++) {
    const item = body.records[index];
    const rowLabel = `Row ${index + 1}`;

    if (!item || typeof item !== "object") {
      errors.push(`${rowLabel}: must be an object.`);
      continue;
    }

    const rec = item as Record<string, unknown>;
    const typeIdRaw = rec.typeId ?? rec.kind;
    const typeId =
      typeof typeIdRaw === "string" ? typeIdRaw.trim().toUpperCase() : "";

    const hasOtherKeys = Object.keys(rec).some(
      (k) =>
        k !== "typeId" &&
        k !== "kind" &&
        rec[k] !== "" &&
        rec[k] != null &&
        !(typeof rec[k] === "object" && Object.keys(rec[k] as object).length === 0),
    );

    if (!typeId) {
      if (!hasOtherKeys) continue;
      errors.push(
        `${rowLabel}: typeId is required (e.g. VACCINE or ALLERGY, or kind "vaccine" / "allergy").`,
      );
      continue;
    }

    const typeRow = typeById.get(typeId);
    if (!typeRow) {
      errors.push(`${rowLabel}: unknown medical record type "${typeId}".`);
      continue;
    }

    const result = validateCreateRow(rowLabel, rec, typeRow);
    if (result.outcome === "ok") {
      data.push(result.record);
      continue;
    }
    if (result.outcome === "error") {
      errors.push(...result.errors);
    }
  }

  if (errors.length > 0) return { errors };
  if (data.length === 0) {
    return { errors: ["At least one complete medical record is required."] };
  }
  return { data };
}

export async function addMedicalRecordsForPet(
  petId: string,
  records: ValidatedMedicalRecord[],
): Promise<{ vaccineCount: number; allergyCount: number } | null> {
  const pet = await prisma.pet.findFirst({
    where: { id: petId, deletedAt: null },
  });
  if (!pet) return null;

  const vaccines = records.filter((r) => r.storageModel === "vaccine");
  const allergies = records.filter((r) => r.storageModel === "allergy");

  await prisma.$transaction(async (tx) => {
    if (vaccines.length > 0) {
      await tx.vaccine.createMany({
        data: vaccines.map((v) => ({
          petId,
          recordTypeId: v.typeId,
          vaccineName: v.fields.vaccineName,
          dateAdministered: new Date(v.fields.dateAdministered),
        })),
      });
    }
    if (allergies.length > 0) {
      await tx.allergy.createMany({
        data: allergies.map((a) => ({
          petId,
          recordTypeId: a.typeId,
          allergyName: a.fields.allergyName,
          reactions: a.fields.reactions,
          severity: a.fields.severity as "mild" | "severe",
        })),
      });
    }
  });

  return { vaccineCount: vaccines.length, allergyCount: allergies.length };
}
