"use client";

import { useParams } from "next/navigation";
import PetDetailsView from "@/components/PetDetailsView";

export default function PetDetailsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  if (!id) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-slate-600">Invalid pet link.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <PetDetailsView petId={id} />
      </div>
    </main>
  );
}
