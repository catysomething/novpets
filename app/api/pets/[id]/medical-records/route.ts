import { NextResponse } from "next/server";
import {
  addMedicalRecordsForPet,
  deleteMedicalRecordForPet,
  updateMedicalRecordForPet,
  validateDeleteMedicalRecordPayload,
  validateMedicalRecordsPayload,
  validateUpdateMedicalRecordPayload,
} from "@/lib/medical-records-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id: petId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = await validateMedicalRecordsPayload(payload);
  if (!validation.data) {
    return NextResponse.json(
      { error: "Validation failed.", details: validation.errors },
      { status: 400 },
    );
  }

  const result = await addMedicalRecordsForPet(petId, validation.data);
  if (!result) {
    return NextResponse.json({ error: "Pet not found." }, { status: 404 });
  }

  return NextResponse.json({ created: result }, { status: 201 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: petId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = await validateUpdateMedicalRecordPayload(payload);
  if (!validation.data) {
    return NextResponse.json(
      { error: "Validation failed.", details: validation.errors },
      { status: 400 },
    );
  }

  const result = await updateMedicalRecordForPet(petId, validation.data);
  if (!result) {
    return NextResponse.json(
      { error: "Pet or medical record not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ updated: result });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id: petId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateDeleteMedicalRecordPayload(payload);
  if (!validation.data) {
    return NextResponse.json(
      { error: "Validation failed.", details: validation.errors },
      { status: 400 },
    );
  }

  const result = await deleteMedicalRecordForPet(petId, validation.data);
  if (!result) {
    return NextResponse.json(
      { error: "Pet or medical record not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ deleted: result });
}
