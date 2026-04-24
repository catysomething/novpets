import Link from "next/link";
import { getPetDashboardStats } from "@/lib/pet-service";

export default async function DashboardPage() {
  const stats = await getPetDashboardStats();

  return (
    <main className="flex-1 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Overview of pets and medical activity in the system.
            </p>
          </div>
          <Link
            href="/pets"
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-eucalyptus-dark px-4 py-2 text-sm font-medium text-white shadow-sm shadow-eucalyptus-darker/25 transition hover:bg-eucalyptus-darker"
          >
            View pets list
          </Link>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total pets
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
              {stats.totalPets}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Vaccine records
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
              {stats.totalVaccineRecords}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Allergy records
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
              {stats.totalAllergyRecords}
            </p>
          </div>
        </div>

        <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Pets by type</h2>
          <p className="mt-1 text-sm text-slate-600">
            Count of active pets grouped by animal type.
          </p>
          {stats.byAnimalType.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No pets yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {stats.byAnimalType.map((row) => (
                <li
                  key={row.animalType}
                  className="flex items-center justify-between py-3 text-sm first:pt-0"
                >
                  <span className="font-medium text-slate-900">
                    {row.animalType}
                  </span>
                  <span className="tabular-nums text-slate-600">
                    {row.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Upcoming Vaccines
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Records with an administration date and time in the future (e.g.
            scheduled visits).
          </p>
          {stats.upcomingVaccines.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              None on file. Past doses appear on each pet&apos;s profile under
              Pets.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.upcomingVaccines.map((row) => (
                <li
                  key={`${row.petId}-${row.dateAdministered}-${row.vaccineName}`}
                  className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link
                      href={`/pets/${row.petId}`}
                      className="font-medium text-indigo-700 hover:underline"
                    >
                      {row.petName}
                    </Link>
                    <span className="text-slate-600"> — {row.vaccineName}</span>
                  </div>
                  <time
                    dateTime={row.dateAdministered}
                    className="shrink-0 text-slate-600"
                  >
                    {new Date(row.dateAdministered).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
