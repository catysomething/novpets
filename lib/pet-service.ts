import type { Prisma } from "@prisma/client";
import { Pet as PrismaPet } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const PET_ENTITY = "Pet" as const;

type PetAuditSource = {
  id: string;
  name: string;
  animalType: string;
  ownerName: string;
  dateOfBirth: Date;
  deletedAt: Date | null;
};

function petAuditSnapshot(pet: PetAuditSource) {
  return {
    id: pet.id,
    name: pet.name,
    animalType: pet.animalType,
    ownerName: pet.ownerName,
    dateOfBirth: pet.dateOfBirth.toISOString(),
    deletedAt: pet.deletedAt?.toISOString() ?? null,
  };
}

export type Pet = {
  id: string;
  name: string;
  animalType: string;
  ownerName: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
  vaccines: VaccineRecord[];
  allergies: AllergyRecord[];
};

export type VaccineRecord = {
  id: string;
  vaccineName: string;
  dateAdministered: string;
  updatedAt: string;
};

export type AllergyRecord = {
  id: string;
  allergyName: string;
  reactions: string;
  severity: "mild" | "severe";
  updatedAt: string;
};

export type CreatePetInput = {
  name: string;
  animalType: string;
  ownerName: string;
  dateOfBirth: string;
};

export type UpdatePetInput = Partial<CreatePetInput>;
export type DeactivatedPet = {
  id: string;
  name: string;
  animalType: string;
  ownerName: string;
  deactivatedAt: string;
};

function mapPetToResponse(pet: PrismaPet): Pet {
  return {
    id: pet.id,
    name: pet.name,
    animalType: pet.animalType,
    ownerName: pet.ownerName,
    dateOfBirth: pet.dateOfBirth.toISOString(),
    createdAt: pet.createdAt.toISOString(),
    updatedAt: pet.updatedAt.toISOString(),
    vaccines: [],
    allergies: [],
  };
}

function mapPetWithMedicalRecordsToResponse(
  pet: PrismaPet & {
    vaccines: {
      id: string;
      vaccineName: string;
      dateAdministered: Date;
      updatedAt: Date;
    }[];
    allergies: {
      id: string;
      allergyName: string;
      reactions: string;
      severity: "mild" | "severe";
      updatedAt: Date;
    }[];
  },
): Pet {
  return {
    id: pet.id,
    name: pet.name,
    animalType: pet.animalType,
    ownerName: pet.ownerName,
    dateOfBirth: pet.dateOfBirth.toISOString(),
    createdAt: pet.createdAt.toISOString(),
    updatedAt: pet.updatedAt.toISOString(),
    vaccines: pet.vaccines.map((record) => ({
      id: record.id,
      vaccineName: record.vaccineName,
      dateAdministered: record.dateAdministered.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    })),
    allergies: pet.allergies.map((record) => ({
      id: record.id,
      allergyName: record.allergyName,
      reactions: record.reactions,
      severity: record.severity,
      updatedAt: record.updatedAt.toISOString(),
    })),
  };
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

export function validateCreatePetInput(payload: unknown): {
  data?: CreatePetInput;
  errors?: string[];
} {
  if (!payload || typeof payload !== "object") {
    return { errors: ["Request body must be a JSON object."] };
  }

  const body = payload as Record<string, unknown>;
  const name = normalizeString(body.name);
  const animalType = normalizeString(body.animalType);
  const ownerName = normalizeString(body.ownerName);
  const dateOfBirth = normalizeDateString(body.dateOfBirth);

  const errors: string[] = [];
  if (!name) errors.push("name is required.");
  if (!animalType) errors.push("animalType is required.");
  if (!ownerName) errors.push("ownerName is required.");
  if (!dateOfBirth) errors.push("dateOfBirth must be a valid date string.");

  if (errors.length > 0) {
    return { errors };
  }

  if (!name || !animalType || !ownerName || !dateOfBirth) {
    return { errors: ["Invalid pet payload."] };
  }

  return {
    data: { name, animalType, ownerName, dateOfBirth },
  };
}

export function validateUpdatePetInput(payload: unknown): {
  data?: UpdatePetInput;
  errors?: string[];
} {
  if (!payload || typeof payload !== "object") {
    return { errors: ["Request body must be a JSON object."] };
  }

  const body = payload as Record<string, unknown>;
  const data: UpdatePetInput = {};
  const errors: string[] = [];

  if ("name" in body) {
    const name = normalizeString(body.name);
    if (!name) errors.push("name must be a non-empty string.");
    else data.name = name;
  }
  if ("animalType" in body) {
    const animalType = normalizeString(body.animalType);
    if (!animalType) errors.push("animalType must be a non-empty string.");
    else data.animalType = animalType;
  }
  if ("ownerName" in body) {
    const ownerName = normalizeString(body.ownerName);
    if (!ownerName) errors.push("ownerName must be a non-empty string.");
    else data.ownerName = ownerName;
  }
  if ("dateOfBirth" in body) {
    const dateOfBirth = normalizeDateString(body.dateOfBirth);
    if (!dateOfBirth) errors.push("dateOfBirth must be a valid date string.");
    else data.dateOfBirth = dateOfBirth;
  }

  if (Object.keys(data).length === 0) {
    errors.push("At least one field must be provided for update.");
  }
  if (errors.length > 0) return { errors };
  return { data };
}

export async function createPet(input: CreatePetInput): Promise<Pet> {
  return prisma.$transaction(async (tx) => {
    const pet = await tx.pet.create({
      data: {
        name: input.name,
        animalType: input.animalType,
        ownerName: input.ownerName,
        dateOfBirth: new Date(input.dateOfBirth),
      },
    });

    await tx.auditLog.create({
      data: {
        entityType: PET_ENTITY,
        entityId: pet.id,
        action: "CREATE",
        changes: { after: petAuditSnapshot(pet) },
      },
    });

    return mapPetToResponse(pet);
  });
}

export type ListPetsFilters = {
  /** Trims; matches name or owner (substring, case-insensitive when supported). */
  search?: string;
  /** Exact animal type label. */
  animalType?: string;
};

export async function listDistinctAnimalTypes(): Promise<string[]> {
  const rows = await prisma.pet.findMany({
    where: { deletedAt: null },
    select: { animalType: true },
    distinct: ["animalType"],
    orderBy: { animalType: "asc" },
  });
  return rows.map((r) => r.animalType);
}

export async function listPets(filters?: ListPetsFilters): Promise<Pet[]> {
  const search = filters?.search?.trim();
  const typeFilter = filters?.animalType?.trim();

  const andClauses: Prisma.PetWhereInput[] = [];
  if (typeFilter) {
    andClauses.push({ animalType: typeFilter });
  }
  if (search) {
    // SQLite: Prisma has no `mode: insensitive` here; substring match is case-sensitive.
    andClauses.push({
      OR: [{ name: { contains: search } }, { ownerName: { contains: search } }],
    });
  }

  const where: Prisma.PetWhereInput = {
    deletedAt: null,
    ...(andClauses.length > 0 ? { AND: andClauses } : {}),
  };

  const pets = await prisma.pet.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      vaccines: {
        where: { deletedAt: null },
        orderBy: { dateAdministered: "desc" },
      },
      allergies: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return pets.map(mapPetWithMedicalRecordsToResponse);
}

export type PetDashboardStats = {
  totalPets: number;
  byAnimalType: { animalType: string; count: number }[];
  /** Doses with administration date & time strictly after now */
  upcomingVaccines: {
    petId: string;
    petName: string;
    vaccineName: string;
    dateAdministered: string;
  }[];
  totalVaccineRecords: number;
  totalAllergyRecords: number;
};

export async function getPetDashboardStats(): Promise<PetDashboardStats> {
  const pets = await prisma.pet.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      animalType: true,
      vaccines: {
        where: { deletedAt: null },
        select: { vaccineName: true, dateAdministered: true },
        orderBy: { dateAdministered: "asc" },
      },
      allergies: { where: { deletedAt: null }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const byTypeMap = new Map<string, number>();
  const upcomingVaccines: PetDashboardStats["upcomingVaccines"] = [];
  let totalVaccineRecords = 0;
  let totalAllergyRecords = 0;

  for (const pet of pets) {
    byTypeMap.set(pet.animalType, (byTypeMap.get(pet.animalType) ?? 0) + 1);
    totalVaccineRecords += pet.vaccines.length;
    totalAllergyRecords += pet.allergies.length;

    for (const v of pet.vaccines) {
      if (v.dateAdministered.getTime() > now.getTime()) {
        upcomingVaccines.push({
          petId: pet.id,
          petName: pet.name,
          vaccineName: v.vaccineName,
          dateAdministered: v.dateAdministered.toISOString(),
        });
      }
    }
  }

  upcomingVaccines.sort(
    (a, b) =>
      new Date(a.dateAdministered).getTime() -
      new Date(b.dateAdministered).getTime(),
  );

  const byAnimalType = [...byTypeMap.entries()]
    .map(([animalType, count]) => ({ animalType, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalPets: pets.length,
    byAnimalType,
    upcomingVaccines,
    totalVaccineRecords,
    totalAllergyRecords,
  };
}

export async function getPetById(id: string): Promise<Pet | null> {
  const pet = await prisma.pet.findFirst({
    where: { id, deletedAt: null },
    include: {
      vaccines: {
        where: { deletedAt: null },
        orderBy: { dateAdministered: "desc" },
      },
      allergies: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!pet) return null;
  return mapPetWithMedicalRecordsToResponse(pet);
}

export async function updatePet(
  id: string,
  changes: UpdatePetInput,
): Promise<Pet | null> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.pet.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return null;
    }

    const pet = await tx.pet.update({
      where: { id },
      data: {
        ...(changes.name ? { name: changes.name } : {}),
        ...(changes.animalType ? { animalType: changes.animalType } : {}),
        ...(changes.ownerName ? { ownerName: changes.ownerName } : {}),
        ...(changes.dateOfBirth
          ? { dateOfBirth: new Date(changes.dateOfBirth) }
          : {}),
      },
    });

    await tx.auditLog.create({
      data: {
        entityType: PET_ENTITY,
        entityId: pet.id,
        action: "UPDATE",
        changes: {
          before: petAuditSnapshot(existing),
          after: petAuditSnapshot(pet),
        },
      },
    });

    return mapPetToResponse(pet);
  });
}

export async function deletePet(id: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.pet.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return false;
    }

    const pet = await tx.pet.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        entityType: PET_ENTITY,
        entityId: id,
        action: "DELETE",
        changes: {
          before: petAuditSnapshot(existing),
          after: petAuditSnapshot(pet),
        },
      },
    });

    return true;
  });
}

export async function listDeactivatedPets(): Promise<DeactivatedPet[]> {
  const pets = await prisma.pet.findMany({
    where: { NOT: { deletedAt: null } },
    select: {
      id: true,
      name: true,
      animalType: true,
      ownerName: true,
      deletedAt: true,
    },
    orderBy: { deletedAt: "desc" },
  });

  return pets.flatMap((pet) => {
    if (!pet.deletedAt) return [];
    return [
      {
        id: pet.id,
        name: pet.name,
        animalType: pet.animalType,
        ownerName: pet.ownerName,
        deactivatedAt: pet.deletedAt.toISOString(),
      },
    ];
  });
}

export async function reactivatePet(id: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.pet.findFirst({
      where: { id, NOT: { deletedAt: null } },
    });
    if (!existing) {
      return false;
    }

    const pet = await tx.pet.update({
      where: { id },
      data: { deletedAt: null },
    });

    await tx.auditLog.create({
      data: {
        entityType: PET_ENTITY,
        entityId: id,
        action: "REACTIVATE",
        changes: {
          before: petAuditSnapshot(existing),
          after: petAuditSnapshot(pet),
        },
      },
    });

    return true;
  });
}
