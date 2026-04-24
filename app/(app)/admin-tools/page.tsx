import { listDeactivatedPets } from "@/lib/pet-service";
import DeactivatedPetsList from "@/components/DeactivatedPetsList";

export default async function AdminToolsPage() {
  const deactivatedPets = await listDeactivatedPets();

  return (
    <main className="flex-1 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Admin Tools</h1>
          <p className="mt-1 text-sm text-slate-600">
            Restore deactivated pet records.
          </p>
        </header>

        <section className="mt-8">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Deactivated Pets
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Pets with a `deactivatedAt` date are eligible for restoration.
            </p>

            <DeactivatedPetsList initialPets={deactivatedPets} />
          </div>
        </section>
      </div>
    </main>
  );
}
