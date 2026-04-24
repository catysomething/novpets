"use client";

import { type FormEvent, useState } from "react";
import PetsList from "@/components/PetsList";

export default function PetsPage() {
  const [isAddPetOpen, setIsAddPetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [petsRefreshKey, setPetsRefreshKey] = useState(0);

  async function handleAddPet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const animalType = String(formData.get("animalType") ?? "").trim();
    const ownerName = String(formData.get("ownerName") ?? "").trim();
    const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          animalType,
          ownerName,
          dateOfBirth,
        }),
      });

      const data = (await response.json()) as {
        pet?: { name: string };
        error?: string;
        details?: string[];
      };

      if (!response.ok) {
        const detailText = data.details?.length
          ? ` ${data.details.join(" ")}`
          : "";
        setFormError(
          `${data.error ?? "Could not add pet."}${detailText}`.trim(),
        );
        return;
      }

      form.reset();
      setIsAddPetOpen(false);
      setSuccessMessage(
        data.pet
          ? `${data.pet.name} was added successfully.`
          : "Pet was added successfully.",
      );
      setPetsRefreshKey((k) => k + 1);
    } catch {
      setFormError("Could not add pet. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <main className="flex-1 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Pet records
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                View pets in the system and add new records.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setSuccessMessage(null);
                setIsAddPetOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              Add pet
            </button>
          </header>

          {successMessage ? (
            <p
              className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              role="status"
            >
              {successMessage}
            </p>
          ) : null}

          <PetsList refreshKey={petsRefreshKey} />
        </div>
      </main>

      {isAddPetOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-pet-title"
        >
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="add-pet-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Add a pet
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Enter the pet&apos;s details. All fields are required.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddPetOpen(false);
                  setFormError(null);
                }}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close add pet dialog"
              >
                ×
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleAddPet}>
              <div>
                <label
                  htmlFor="pet-name"
                  className="block text-sm font-medium text-slate-700"
                >
                  Name
                </label>
                <input
                  id="pet-name"
                  name="name"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div>
                <label
                  htmlFor="pet-animal-type"
                  className="block text-sm font-medium text-slate-700"
                >
                  Animal type
                </label>
                <input
                  id="pet-animal-type"
                  name="animalType"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div>
                <label
                  htmlFor="pet-owner"
                  className="block text-sm font-medium text-slate-700"
                >
                  Owner name
                </label>
                <input
                  id="pet-owner"
                  name="ownerName"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div>
                <label
                  htmlFor="pet-dob"
                  className="block text-sm font-medium text-slate-700"
                >
                  Date of birth
                </label>
                <input
                  id="pet-dob"
                  name="dateOfBirth"
                  type="date"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {formError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              ) : null}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddPetOpen(false);
                    setFormError(null);
                  }}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Saving…" : "Save pet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
