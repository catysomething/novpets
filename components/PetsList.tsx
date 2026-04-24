"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Pet = {
  id: string;
  name: string;
  animalType: string;
  ownerName: string;
  dateOfBirth: string;
  vaccines: {
    id: string;
    vaccineName: string;
    dateAdministered: string;
  }[];
  allergies: {
    id: string;
    allergyName: string;
    reactions: string;
    severity: "mild" | "severe";
  }[];
};

type PetsListProps = {
  refreshKey?: number;
};

export default function PetsList({ refreshKey = 0 }: PetsListProps) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [animalTypes, setAnimalTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedPetIds, setExpandedPetIds] = useState<string[]>([]);

  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [animalType, setAnimalType] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchQuery(searchDraft.trim());
    }, 350);
    return () => clearTimeout(handle);
  }, [searchDraft]);

  useEffect(() => {
    setExpandedPetIds([]);
  }, [searchQuery, animalType]);

  function toggleExpanded(petId: string) {
    setExpandedPetIds((previous) =>
      previous.includes(petId)
        ? previous.filter((id) => id !== petId)
        : [...previous, petId],
    );
  }

  const fetchPets = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (animalType) params.set("animalType", animalType);
      const qs = params.toString();
      const response = await fetch(qs ? `/api/pets?${qs}` : "/api/pets");
      const data = (await response.json()) as {
        pets?: Pet[];
        animalTypes?: string[];
        error?: string;
      };

      if (!response.ok) {
        setErrorMessage(data.error ?? "Failed to load pets.");
        return;
      }

      const types = data.animalTypes ?? [];
      setPets(data.pets ?? []);
      setAnimalTypes(types);
      setAnimalType((prev) => (prev && !types.includes(prev) ? "" : prev));
    } catch {
      setErrorMessage("Failed to load pets.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, animalType]);

  useEffect(() => {
    void fetchPets();
  }, [refreshKey, fetchPets]);

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Pets</h2>
        <p className="text-sm text-slate-600">
          All pets currently in the system.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="pet-search"
            className="block text-xs font-medium uppercase tracking-wide text-slate-500"
          >
            Search
          </label>
          <input
            id="pet-search"
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Pet name or owner…"
            autoComplete="off"
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
        <div className="w-full sm:w-52">
          <label
            htmlFor="pet-animal-type-filter"
            className="block text-xs font-medium uppercase tracking-wide text-slate-500"
          >
            Animal type
          </label>
          <select
            id="pet-animal-type-filter"
            value={animalType}
            onChange={(e) => setAnimalType(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">All types</option>
            {animalTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="px-6 py-6 text-sm text-slate-600">Loading pets...</p>
      ) : null}

      {errorMessage ? (
        <p className="mx-6 my-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {!isLoading && !errorMessage ? (
        pets.length === 0 ? (
          <p className="px-6 py-6 text-sm text-slate-600">
            {searchQuery || animalType
              ? "No pets match your search or filter."
              : "No pets added yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="w-10 px-0 py-3" aria-hidden />
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Animal Type</th>
                  <th className="px-6 py-3 font-semibold">Owner</th>
                  <th className="px-6 py-3 font-semibold">Date of Birth</th>
                  <th className="px-6 py-3 text-right font-semibold">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pets.map((pet) => {
                  const isExpanded = expandedPetIds.includes(pet.id);

                  return (
                    <Fragment key={pet.id}>
                      <tr>
                        <td className="w-10 px-0 py-4 align-middle text-center">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(pet.id)}
                            className="inline-flex size-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
                            title="Expand to view medical records"
                            aria-expanded={isExpanded}
                            aria-label={`${isExpanded ? "Collapse" : "Expand"} records for ${pet.name}`}
                          >
                            <span
                              className={`inline-block text-base leading-none transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                              aria-hidden
                            >
                              ›
                            </span>
                          </button>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {pet.name}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {pet.animalType}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {pet.ownerName}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {new Date(pet.dateOfBirth).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/pets/${pet.id}`}
                            className="inline-block rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 shadow-sm transition hover:bg-emerald-50"
                          >
                            View pet details
                          </Link>
                        </td>
                      </tr>

                      {isExpanded ? (
                        <tr className="bg-slate-50/60">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="rounded-md border border-slate-200 bg-white p-4">
                                <h3 className="text-sm font-semibold text-slate-900">
                                  Vaccine Records
                                </h3>
                                {pet.vaccines.length === 0 ? (
                                  <p className="mt-2 text-sm text-slate-600">
                                    No vaccine records.
                                  </p>
                                ) : (
                                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                                    {pet.vaccines.map((record) => (
                                      <li
                                        key={record.id}
                                        className="rounded border border-slate-100 p-2"
                                      >
                                        <p className="font-medium text-slate-900">
                                          {record.vaccineName}
                                        </p>
                                        <p>
                                          Administered:{" "}
                                          {new Date(
                                            record.dateAdministered,
                                          ).toLocaleDateString()}
                                        </p>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              <div className="rounded-md border border-slate-200 bg-white p-4">
                                <h3 className="text-sm font-semibold text-slate-900">
                                  Allergy Records
                                </h3>
                                {pet.allergies.length === 0 ? (
                                  <p className="mt-2 text-sm text-slate-600">
                                    No allergy records.
                                  </p>
                                ) : (
                                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                                    {pet.allergies.map((record) => (
                                      <li
                                        key={record.id}
                                        className="rounded border border-slate-100 p-2"
                                      >
                                        <p className="font-medium text-slate-900">
                                          {record.allergyName}
                                        </p>
                                        <p>Reactions: {record.reactions}</p>
                                        <p className="capitalize">
                                          Severity: {record.severity}
                                        </p>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </section>
  );
}
