import { NextResponse } from "next/server";
import {
  deletePet,
  getPetById,
  updatePet,
  validateUpdatePetInput,
} from "@/lib/pet-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const pet = await getPetById(id);
  if (!pet) {
    return NextResponse.json({ error: "Pet not found." }, { status: 404 });
  }
  return NextResponse.json({ pet }, { status: 200 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateUpdatePetInput(payload);
  if (!validation.data) {
    return NextResponse.json(
      { error: "Validation failed.", details: validation.errors },
      { status: 400 },
    );
  }

  const pet = await updatePet(id, validation.data);
  if (!pet) return NextResponse.json({ error: "Pet not found." }, { status: 404 });
  return NextResponse.json({ pet }, { status: 200 });
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const deleted = await deletePet(id);
  if (!deleted) return NextResponse.json({ error: "Pet not found." }, { status: 404 });
  return NextResponse.json({ deleted: true }, { status: 200 });
}
