"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DeactivatedPet } from "@/lib/pet-service";

type DeactivatedPetsListProps = {
  initialPets: DeactivatedPet[];
};

export default function DeactivatedPetsList({
  initialPets,
}: DeactivatedPetsListProps) {
  const router = useRouter();
  const [pets, setPets] = useState(initialPets);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRestorePet(pet: DeactivatedPet) {
    if (pendingId) return;
    setError(null);
    setPendingId(pet.id);
    try {
      const response = await fetch(`/api/pets/${pet.id}/reactivate`, {
        method: "POST",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? `Could not restore ${pet.name}.`);
        return;
      }

      setPets((prev) => prev.filter((p) => p.id !== pet.id));
      router.refresh();
    } catch {
      setError(`Could not restore ${pet.name}. Please try again.`);
    } finally {
      setPendingId(null);
    }
  }

  const hasPets = useMemo(() => pets.length > 0, [pets.length]);

  return (
    <>
      {!hasPets ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
          <p className="text-sm text-slate-500">No deactivated pets found.</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {pets.map((pet) => {
            const isPending = pendingId === pet.id;
            return (
              <li
                key={pet.id}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{pet.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {pet.animalType} · Owner: {pet.ownerName}
                    </p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Deactivated At
                    </p>
                    <time
                      dateTime={pet.deactivatedAt}
                      className="mt-1 block text-sm tabular-nums text-slate-700"
                    >
                      {new Date(pet.deactivatedAt).toLocaleString()}
                    </time>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleRestorePet(pet)}
                    disabled={isPending || pendingId != null}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span aria-hidden className="text-base leading-none">
                      ↺
                    </span>
                    {isPending ? `Restoring ${pet.name}...` : `Restore ${pet.name}`}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </>
  );
}
