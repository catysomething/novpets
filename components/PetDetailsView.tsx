"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Pet } from "@/lib/pet-service";

function newDraftKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function dateInputValueFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** US-style display for profile (use local TZ). */
function formatMMDDYYYY(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const y = d.getFullYear();
  return `${m}/${day}/${y}`;
}

type MedicalDraftRow =
  | {
      key: string;
      typeId: "VACCINE";
      vaccineName: string;
      dateAdministered: string;
    }
  | {
      key: string;
      typeId: "ALLERGY";
      allergyName: string;
      reactions: string;
      severity: "mild" | "severe";
    };

function emptyVaccineRow(): MedicalDraftRow {
  return {
    key: newDraftKey(),
    typeId: "VACCINE",
    vaccineName: "",
    dateAdministered: "",
  };
}

type HealthRecordRow =
  | {
      kind: "vaccine";
      id: string;
      vaccineName: string;
      dateAdministered: string;
      updatedAt: string;
    }
  | {
      kind: "allergy";
      id: string;
      allergyName: string;
      reactions: string;
      severity: "mild" | "severe";
      updatedAt: string;
    };

type EditableMedicalRecord =
  | {
      kind: "vaccine";
      id: string;
      vaccineName: string;
      dateAdministered: string;
    }
  | {
      kind: "allergy";
      id: string;
      allergyName: string;
      reactions: string;
      severity: "mild" | "severe";
    };

function HealthRecordTypeIcon({ kind }: { kind: "vaccine" | "allergy" }) {
  if (kind === "vaccine") {
    return (
      <span
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800"
        title="Vaccine"
      >
        <svg
          className="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      </span>
    );
  }

  return (
    <span
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-900"
      title="Allergy"
    >
      <svg
        className="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    </span>
  );
}

type PetDetailsViewProps = {
  petId: string;
};

export default function PetDetailsView({ petId }: PetDetailsViewProps) {
  const router = useRouter();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [medicalOpen, setMedicalOpen] = useState(false);
  const [medicalRows, setMedicalRows] = useState<MedicalDraftRow[]>([
    emptyVaccineRow(),
  ]);
  const [medicalError, setMedicalError] = useState<string | null>(null);
  const [isSavingMedical, setIsSavingMedical] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EditableMedicalRecord | null>(
    null,
  );
  const [editMedicalError, setEditMedicalError] = useState<string | null>(null);
  const [isSavingEditMedical, setIsSavingEditMedical] = useState(false);
  const [isDeletingEditMedical, setIsDeletingEditMedical] = useState(false);
  const [medicalRemovalNote, setMedicalRemovalNote] = useState("");

  const [isDeleting, setIsDeleting] = useState(false);

  const loadPet = useCallback(async () => {
    setLoadError(null);
    try {
      const response = await fetch(`/api/pets/${petId}`);
      const data = (await response.json()) as { pet?: Pet; error?: string };

      if (!response.ok) {
        setPet(null);
        setLoadError(data.error ?? "Could not load pet.");
        return;
      }

      setPet(data.pet ?? null);
    } catch {
      setPet(null);
      setLoadError("Could not load pet.");
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    void loadPet();
  }, [loadPet]);

  function openMedicalModal() {
    setMedicalRows([emptyVaccineRow()]);
    setMedicalError(null);
    setMedicalOpen(true);
    setIsEditing(false);
  }

  function closeMedicalModal() {
    setMedicalOpen(false);
    setMedicalError(null);
  }

  function openEditMedicalRecord(row: HealthRecordRow) {
    setEditMedicalError(null);
    setMedicalRemovalNote("");
    if (row.kind === "vaccine") {
      setEditingRecord({
        kind: "vaccine",
        id: row.id,
        vaccineName: row.vaccineName,
        dateAdministered: dateInputValueFromIso(row.dateAdministered),
      });
      return;
    }
    setEditingRecord({
      kind: "allergy",
      id: row.id,
      allergyName: row.allergyName,
      reactions: row.reactions,
      severity: row.severity,
    });
  }

  function closeEditMedicalModal() {
    setEditingRecord(null);
    setEditMedicalError(null);
    setMedicalRemovalNote("");
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pet) return;

    setEditError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const animalType = String(formData.get("animalType") ?? "").trim();
    const ownerName = String(formData.get("ownerName") ?? "").trim();
    const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();

    setIsSavingEdit(true);
    try {
      const response = await fetch(`/api/pets/${pet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          animalType,
          ownerName,
          dateOfBirth,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        details?: string[];
      };

      if (!response.ok) {
        const extra = data.details?.length ? ` ${data.details.join(" ")}` : "";
        setEditError(`${data.error ?? "Could not update pet."}${extra}`.trim());
        return;
      }

      setIsEditing(false);
      await loadPet();
    } catch {
      setEditError("Could not update pet. Please try again.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleSaveMedicalRecords(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pet) return;

    setMedicalError(null);
    const records: Record<string, unknown>[] = [];

    for (const row of medicalRows) {
      if (row.typeId === "VACCINE") {
        records.push({
          typeId: "VACCINE",
          vaccineName: row.vaccineName,
          dateAdministered: row.dateAdministered,
        });
      } else {
        records.push({
          typeId: "ALLERGY",
          allergyName: row.allergyName,
          reactions: row.reactions,
          severity: row.severity,
        });
      }
    }

    setIsSavingMedical(true);
    try {
      const response = await fetch(`/api/pets/${pet.id}/medical-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });

      const data = (await response.json()) as {
        error?: string;
        details?: string[];
      };

      if (!response.ok) {
        const extra = data.details?.length ? ` ${data.details.join(" ")}` : "";
        setMedicalError(
          `${data.error ?? "Could not save records."}${extra}`.trim(),
        );
        return;
      }

      closeMedicalModal();
      await loadPet();
    } catch {
      setMedicalError("Could not save records. Please try again.");
    } finally {
      setIsSavingMedical(false);
    }
  }

  async function handleDelete() {
    if (!pet) return;
    if (
      !window.confirm(
        `Delete ${pet.name}? This marks the pet as removed from the active list.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/pets/${pet.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        window.alert(data.error ?? "Could not delete pet.");
        return;
      }
      router.push("/pets");
      router.refresh();
    } catch {
      window.alert("Could not delete pet.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSaveEditedMedicalRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pet || !editingRecord) return;

    setEditMedicalError(null);
    const formData = new FormData(event.currentTarget);

    const payload: Record<string, unknown> = {
      recordId: editingRecord.id,
      kind: editingRecord.kind,
    };

    if (editingRecord.kind === "vaccine") {
      payload.vaccineName = String(formData.get("vaccineName") ?? "").trim();
      payload.dateAdministered = String(formData.get("dateAdministered") ?? "").trim();
    } else {
      payload.allergyName = String(formData.get("allergyName") ?? "").trim();
      payload.reactions = String(formData.get("reactions") ?? "").trim();
      payload.severity = String(formData.get("severity") ?? "").trim();
    }

    setIsSavingEditMedical(true);
    try {
      const response = await fetch(`/api/pets/${pet.id}/medical-records`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        error?: string;
        details?: string[];
      };

      if (!response.ok) {
        const extra = data.details?.length ? ` ${data.details.join(" ")}` : "";
        setEditMedicalError(
          `${data.error ?? "Could not update record."}${extra}`.trim(),
        );
        return;
      }

      closeEditMedicalModal();
      await loadPet();
    } catch {
      setEditMedicalError("Could not update record. Please try again.");
    } finally {
      setIsSavingEditMedical(false);
    }
  }

  async function handleDeleteEditedMedicalRecord() {
    if (!pet || !editingRecord) return;

    const removalNote = medicalRemovalNote.trim();
    if (!removalNote) {
      setEditMedicalError("Please add a removal note before deleting this record.");
      return;
    }

    if (
      !window.confirm(
        `Delete this ${editingRecord.kind} record? This will hide it from active medical history.`,
      )
    ) {
      return;
    }

    setEditMedicalError(null);
    setIsDeletingEditMedical(true);
    try {
      const response = await fetch(`/api/pets/${pet.id}/medical-records`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: editingRecord.id,
          kind: editingRecord.kind,
          removalNote,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        details?: string[];
      };

      if (!response.ok) {
        const extra = data.details?.length ? ` ${data.details.join(" ")}` : "";
        setEditMedicalError(
          `${data.error ?? "Could not delete record."}${extra}`.trim(),
        );
        return;
      }

      closeEditMedicalModal();
      await loadPet();
    } catch {
      setEditMedicalError("Could not delete record. Please try again.");
    } finally {
      setIsDeletingEditMedical(false);
    }
  }

  const healthRows = useMemo((): HealthRecordRow[] => {
    if (!pet) return [];
    const rows: HealthRecordRow[] = [
      ...pet.vaccines.map((v) => ({ kind: "vaccine" as const, ...v })),
      ...pet.allergies.map((a) => ({ kind: "allergy" as const, ...a })),
    ];
    rows.sort((a, b) => {
      if (a.kind === "vaccine" && b.kind === "vaccine") {
        return (
          new Date(b.dateAdministered).getTime() -
          new Date(a.dateAdministered).getTime()
        );
      }
      if (a.kind === "allergy" && b.kind === "allergy") {
        return a.allergyName.localeCompare(b.allergyName);
      }
      return a.kind === "vaccine" ? -1 : 1;
    });
    return rows;
  }, [pet]);

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-10 shadow-lg shadow-slate-200/50">
        <div className="mx-auto max-w-md animate-pulse space-y-4">
          <div className="h-4 w-32 rounded-full bg-slate-200" />
          <div className="h-10 max-w-xs rounded-lg bg-slate-200" />
          <div className="h-3 w-full rounded-full bg-slate-100" />
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="h-24 rounded-xl bg-slate-100" />
            <div className="h-24 rounded-xl bg-slate-100" />
            <div className="h-24 rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !pet) {
    return (
      <div className="overflow-hidden rounded-2xl border border-red-200/60 bg-gradient-to-b from-red-50 to-white px-6 py-10 text-center shadow-md">
        <p className="text-sm font-medium text-red-900">
          {loadError ?? "Pet not found."}
        </p>
        <Link
          href="/pets"
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Back to all pets
        </Link>
      </div>
    );
  }

  const dobDisplay = formatMMDDYYYY(pet.dateOfBirth);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-300/25 ring-1 ring-slate-900/5">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_0%_-10%,color-mix(in_srgb,var(--novellia-eucalyptus)_55%,transparent),transparent_55%),radial-gradient(700px_circle_at_100%_0%,color-mix(in_srgb,var(--novellia-eucalyptus-depth)_40%,transparent),transparent_50%)]"
          aria-hidden
        />
        <div className="relative px-6 pb-12 pt-6 sm:px-10">
          <button
            type="button"
            onClick={() => router.push("/pets")}
            className="group mb-8 inline-flex items-center gap-2.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <span
              className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-500 shadow-sm backdrop-blur transition group-hover:border-indigo-200 group-hover:text-indigo-700"
              aria-hidden
            >
              ←
            </span>
            Back to all pets
          </button>

          {!isEditing ? (
            <>
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 shadow-md ring-1 ring-slate-900/[0.04]">
                <div
                  className="pointer-events-none absolute inset-0 "
                  aria-hidden
                />
                <div className="relative px-6 py-8 sm:px-8 sm:py-9">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600/90">
                        Pet profile
                      </p>
                      <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.1]">
                        {pet.name}
                      </h1>
                      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-600">
                        Vaccines, allergies, and owner details in one place.
                        Edit core info anytime, or add new clinical rows in the
                        health section below.
                      </p>
                    </div>
                    <div className="flex shrink-0 sm:pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditError(null);
                          setIsEditing(true);
                        }}
                        className="rounded-xl border border-slate-200/90 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm transition hover:border-indigo-200 hover:bg-white hover:text-indigo-900"
                      >
                        Edit pet
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-slate-900/[0.06] pt-8">
                    <dl className="grid gap-8 sm:grid-cols-3 sm:gap-6">
                      <div className="min-w-0">
                        <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Animal type
                        </dt>
                        <dd className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                          {pet.animalType}
                        </dd>
                      </div>
                      <div className="min-w-0 sm:border-l sm:border-slate-900/[0.06] sm:pl-6">
                        <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Owner
                        </dt>
                        <dd className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                          {pet.ownerName}
                        </dd>
                      </div>
                      <div className="min-w-0 sm:border-l sm:border-slate-900/[0.06] sm:pl-6">
                        <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Date of birth
                        </dt>
                        <dd className="mt-2 text-sm font-semibold leading-snug text-slate-900 sm:text-base">
                          {dobDisplay}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <div className="max-w-2xl">
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">
                    Care History
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-500">
                    Immunizations and allergies on file for this pet.
                  </p>
                  <button
                    type="button"
                    onClick={openMedicalModal}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-eucalyptus-dark px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-eucalyptus-darker/25 transition hover:bg-eucalyptus-darker hover:shadow-lg"
                  >
                    <span className="flex size-6 items-center justify-center rounded-lg bg-white/20 text-base leading-none">
                      +
                    </span>
                    Add records
                  </button>
                </div>
              </div>

              <div className="mt-10">
                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/40 shadow-sm">
                  {healthRows.length === 0 ? (
                    <p className="px-6 py-10 text-center text-sm text-slate-500">
                      No vaccine or allergy records yet. Use{" "}
                      <span className="font-medium text-slate-700">
                        Add records
                      </span>{" "}
                      above to create some.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="border-b border-emerald-950/10 bg-eucalyptus text-left text-xs font-semibold uppercase tracking-wide text-emerald-950/75">
                          <tr>
                            <th className="w-14 px-4 py-3" scope="col">
                              <span className="sr-only">Type</span>
                            </th>
                            <th className="px-4 py-3" scope="col">
                              Record
                            </th>
                            <th className="px-4 py-3" scope="col">
                              Details
                            </th>
                          <th className="pl-10 pr-4 py-3 text-right" scope="col">
                            Updated
                          </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {healthRows.map((row) => (
                            <tr
                              key={`${row.kind}-${row.id}`}
                              className="cursor-pointer transition hover:bg-slate-50/80"
                              onClick={() => openEditMedicalRecord(row)}
                            >
                              <td className="px-4 py-4 align-middle">
                                <HealthRecordTypeIcon kind={row.kind} />
                              </td>
                              <td className="px-4 py-4 align-top">
                                <p className="font-semibold text-slate-900">
                                  {row.kind === "vaccine"
                                    ? row.vaccineName
                                    : row.allergyName}
                                </p>
                                <p className="mt-0.5 text-xs font-medium text-slate-500">
                                  {row.kind === "vaccine"
                                    ? "Vaccine"
                                    : "Allergy"}
                                </p>
                              </td>
                              <td className="px-4 py-4 align-top text-slate-600">
                                {row.kind === "vaccine" ? (
                                  <span>
                                    Administered{" "}
                                    <span className="font-medium text-slate-800">
                                      {new Date(
                                        row.dateAdministered,
                                      ).toLocaleDateString()}
                                    </span>
                                  </span>
                                ) : (
                                  <div className="space-y-1">
                                    <p>
                                      Reactions:{" "}
                                      <span className="text-slate-800">
                                        {row.reactions}
                                      </span>
                                    </p>
                                    <p className="capitalize">
                                      Severity:{" "}
                                      <span className="font-medium text-slate-800">
                                        {row.severity}
                                      </span>
                                    </p>
                                  </div>
                                )}
                              </td>
                              <td className="pl-10 pr-4 py-4 text-right align-top text-slate-600">
                                <time
                                  dateTime={row.updatedAt}
                                  className="text-xs font-medium tabular-nums"
                                >
                                  {new Date(row.updatedAt).toLocaleDateString()}
                                </time>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-8 text-xs text-slate-500">
                <span>Record ID</span>
                <code className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700">
                  {pet.id}
                </code>
              </div>

              <div className="mt-10 rounded-2xl border border-red-200/70 bg-gradient-to-b from-red-50/90 to-white p-6 sm:p-8">
                <h3 className="text-sm font-bold text-red-900">Danger zone</h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-red-900/80">
                  Deleting removes this pet from your active list. This cannot
                  be undone from the app.
                </p>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="mt-5 rounded-xl border border-red-300/80 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-60"
                >
                  {isDeleting ? "Deleting…" : "Delete pet"}
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Edit pet
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditError(null);
                  }}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>

              <form
                key={`${pet.id}-${pet.updatedAt}`}
                className="max-w-xl space-y-4"
                onSubmit={handleSaveEdit}
              >
                <div>
                  <label
                    htmlFor="edit-name"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Name
                  </label>
                  <input
                    id="edit-name"
                    name="name"
                    required
                    defaultValue={pet.name}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-animal-type"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Animal type
                  </label>
                  <input
                    id="edit-animal-type"
                    name="animalType"
                    required
                    defaultValue={pet.animalType}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-owner"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Owner name
                  </label>
                  <input
                    id="edit-owner"
                    name="ownerName"
                    required
                    defaultValue={pet.ownerName}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-dob"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Date of birth
                  </label>
                  <input
                    id="edit-dob"
                    name="dateOfBirth"
                    type="date"
                    required
                    defaultValue={dateInputValueFromIso(pet.dateOfBirth)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {editError ? (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {editError}
                  </p>
                ) : null}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="rounded-xl bg-eucalyptus-dark px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-eucalyptus-darker/25 transition hover:bg-eucalyptus-darker disabled:opacity-60"
                  >
                    {isSavingEdit ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {medicalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="medical-modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl ring-1 ring-slate-900/5 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="medical-modal-title"
                className="text-lg font-semibold text-slate-900"
              >
                Add medical records
              </h2>
              <button
                type="button"
                onClick={closeMedicalModal}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Add one or more rows. Empty rows are skipped. Vaccine rows need a
              name and date; allergy rows need name, reactions, and severity.
            </p>

            <form
              className="mt-6 space-y-6"
              onSubmit={handleSaveMedicalRecords}
            >
              {medicalRows.map((row, index) => (
                <div
                  key={row.key}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-sm font-medium text-slate-700">
                      Record type
                      <select
                        value={row.typeId}
                        onChange={(e) => {
                          const v = e.target.value as "VACCINE" | "ALLERGY";
                          setMedicalRows((prev) =>
                            prev.map((r, i) =>
                              i === index
                                ? v === "VACCINE"
                                  ? {
                                      key: r.key,
                                      typeId: "VACCINE",
                                      vaccineName: "",
                                      dateAdministered: "",
                                    }
                                  : {
                                      key: r.key,
                                      typeId: "ALLERGY",
                                      allergyName: "",
                                      reactions: "",
                                      severity: "mild",
                                    }
                                : r,
                            ),
                          );
                        }}
                        className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                      >
                        <option value="VACCINE">Vaccine</option>
                        <option value="ALLERGY">Allergy</option>
                      </select>
                    </label>
                    {medicalRows.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setMedicalRows((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Remove row
                      </button>
                    ) : null}
                  </div>

                  {row.typeId === "VACCINE" ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600">
                          Vaccine name
                        </label>
                        <input
                          value={row.vaccineName}
                          onChange={(e) =>
                            setMedicalRows((prev) =>
                              prev.map((r, i) =>
                                i === index && r.typeId === "VACCINE"
                                  ? { ...r, vaccineName: e.target.value }
                                  : r,
                              ),
                            )
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600">
                          Date administered
                        </label>
                        <input
                          type="date"
                          value={row.dateAdministered}
                          onChange={(e) =>
                            setMedicalRows((prev) =>
                              prev.map((r, i) =>
                                i === index && r.typeId === "VACCINE"
                                  ? { ...r, dateAdministered: e.target.value }
                                  : r,
                              ),
                            )
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600">
                          Allergy name
                        </label>
                        <input
                          value={row.allergyName}
                          onChange={(e) =>
                            setMedicalRows((prev) =>
                              prev.map((r, i) =>
                                i === index && r.typeId === "ALLERGY"
                                  ? { ...r, allergyName: e.target.value }
                                  : r,
                              ),
                            )
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600">
                          Reactions
                        </label>
                        <input
                          value={row.reactions}
                          onChange={(e) =>
                            setMedicalRows((prev) =>
                              prev.map((r, i) =>
                                i === index && r.typeId === "ALLERGY"
                                  ? { ...r, reactions: e.target.value }
                                  : r,
                              ),
                            )
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600">
                          Severity
                        </label>
                        <select
                          value={row.severity}
                          onChange={(e) =>
                            setMedicalRows((prev) =>
                              prev.map((r, i) =>
                                i === index && r.typeId === "ALLERGY"
                                  ? {
                                      ...r,
                                      severity: e.target.value as
                                        | "mild"
                                        | "severe",
                                    }
                                  : r,
                              ),
                            )
                          }
                          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        >
                          <option value="mild">Mild</option>
                          <option value="severe">Severe</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setMedicalRows((prev) => [...prev, emptyVaccineRow()])
                }
                className="text-sm font-medium text-slate-700 underline-offset-2 hover:underline"
              >
                + Add another row
              </button>

              {medicalError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {medicalError}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeMedicalModal}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMedical}
                  className="rounded-md bg-eucalyptus-dark px-4 py-2 text-sm font-medium text-white shadow-sm shadow-eucalyptus-darker/25 transition hover:bg-eucalyptus-darker disabled:opacity-60"
                >
                  {isSavingMedical ? "Saving…" : "Save records"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editingRecord ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-medical-record-title"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl ring-1 ring-slate-900/5 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="edit-medical-record-title"
                className="text-lg font-semibold text-slate-900"
              >
                Edit {editingRecord.kind === "vaccine" ? "vaccine" : "allergy"} record
              </h2>
              <button
                type="button"
                onClick={closeEditMedicalModal}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSaveEditedMedicalRecord}>
              {editingRecord.kind === "vaccine" ? (
                <>
                  <div>
                    <label
                      htmlFor="edit-vaccine-name"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Vaccine name
                    </label>
                    <input
                      id="edit-vaccine-name"
                      name="vaccineName"
                      required
                      defaultValue={editingRecord.vaccineName}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-date-administered"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Date administered
                    </label>
                    <input
                      id="edit-date-administered"
                      name="dateAdministered"
                      type="date"
                      required
                      defaultValue={editingRecord.dateAdministered}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="edit-allergy-name"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Allergy name
                    </label>
                    <input
                      id="edit-allergy-name"
                      name="allergyName"
                      required
                      defaultValue={editingRecord.allergyName}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-reactions"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Reactions
                    </label>
                    <input
                      id="edit-reactions"
                      name="reactions"
                      required
                      defaultValue={editingRecord.reactions}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-severity"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Severity
                    </label>
                    <select
                      id="edit-severity"
                      name="severity"
                      defaultValue={editingRecord.severity}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="mild">Mild</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="edit-removal-note"
                  className="block text-sm font-medium text-slate-700"
                >
                  Removal note (required for delete)
                </label>
                <textarea
                  id="edit-removal-note"
                  name="removalNote"
                  value={medicalRemovalNote}
                  onChange={(event) => setMedicalRemovalNote(event.target.value)}
                  rows={3}
                  placeholder="Add why this medical record is being removed."
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {editMedicalError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {editMedicalError}
                </p>
              ) : null}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => void handleDeleteEditedMedicalRecord()}
                  disabled={isSavingEditMedical || isDeletingEditMedical}
                  className="mr-auto rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingEditMedical ? "Deleting…" : "Delete record"}
                </button>
                <button
                  type="button"
                  onClick={closeEditMedicalModal}
                  disabled={isSavingEditMedical || isDeletingEditMedical}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditMedical || isDeletingEditMedical}
                  className="rounded-md bg-eucalyptus-dark px-4 py-2 text-sm font-medium text-white shadow-sm shadow-eucalyptus-darker/25 transition hover:bg-eucalyptus-darker disabled:opacity-60"
                >
                  {isSavingEditMedical ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
