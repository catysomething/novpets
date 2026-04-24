import { NextResponse } from "next/server";
import {
  createPet,
  listDistinctAnimalTypes,
  listPets,
  validateCreatePetInput,
} from "@/lib/pet-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || undefined;
  const animalType = searchParams.get("animalType")?.trim() || undefined;

  const [pets, animalTypes] = await Promise.all([
    listPets({
      ...(search ? { search } : {}),
      ...(animalType ? { animalType } : {}),
    }),
    listDistinctAnimalTypes(),
  ]);

  return NextResponse.json({ pets, animalTypes }, { status: 200 });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateCreatePetInput(payload);
  if (!validation.data) {
    return NextResponse.json(
      { error: "Validation failed.", details: validation.errors },
      { status: 400 },
    );
  }

  const pet = await createPet(validation.data);
  return NextResponse.json({ pet }, { status: 201 });
}
