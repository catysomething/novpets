import { NextResponse } from "next/server";
import { reactivatePet } from "@/lib/pet-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const reactivated = await reactivatePet(id);
  if (!reactivated) {
    return NextResponse.json(
      { error: "Pet not found or is already active." },
      { status: 404 },
    );
  }
  return NextResponse.json({ reactivated: true }, { status: 200 });
}
