"use client";

import { useState } from "react";
import Modal from "./Modal";
import type { TimelineEntry } from "@/lib/airtable/data";
import type { Role } from "@/lib/airtable/schema";
import { ROLE } from "@/lib/airtable/schema";
import { updateEntryRole, deleteEntry } from "@/lib/mutations";

interface Props {
  entry: TimelineEntry;
  riderName: string;
  onClose: () => void;
  onChanged: () => void;
}

export default function EditEntryPanel({ entry, riderName, onClose, onChanged }: Props) {
  const [role, setRole] = useState<Role>(entry.role ?? ROLE.STARTER);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleSave() {
    if (role === entry.role) {
      onClose();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateEntryRole(entry.id, role);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      await deleteEntry(entry.id);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="text-sm font-semibold text-gray-900">{entry.raceBlockName}</h2>
      <p className="mb-4 text-sm text-gray-500">{riderName}</p>

      <label className="mb-1 block text-xs font-medium text-gray-600">Role</label>
      <div className="mb-4 flex gap-2">
        {([ROLE.STARTER, ROLE.RESERVE] as const).map((r) => (
          <button
            key={r}
            type="button"
            disabled={busy}
            onClick={() => setRole(r)}
            className={`flex-1 rounded-md border px-3 py-1.5 text-sm font-medium ${
              role === r
                ? r === ROLE.STARTER
                  ? "border-green-700 bg-green-700 text-white"
                  : "border-yellow-700 bg-yellow-600 text-white"
                : "border-gray-300 text-gray-700"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {confirmingDelete ? (
        <div className="rounded-md bg-red-50 p-3">
          <p className="mb-2 text-sm text-red-800">
            Remove {riderName} from {entry.raceBlockName}?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmingDelete(false)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleDelete}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? "Removing…" : "Yes, remove"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmingDelete(true)}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Remove entry
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleSave}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
