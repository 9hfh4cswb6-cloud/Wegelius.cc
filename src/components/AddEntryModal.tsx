"use client";

import { useMemo, useState } from "react";
import Modal from "./Modal";
import type { Rider, RaceBlock } from "@/lib/airtable/data";
import type { Role } from "@/lib/airtable/schema";
import { ROLE } from "@/lib/airtable/schema";
import { createEntry } from "@/lib/mutations";

interface Props {
  riders: Rider[];
  raceBlocks: RaceBlock[];
  defaultRiderId?: string | null;
  onClose: () => void;
  onChanged: () => void;
}

export default function AddEntryModal({
  riders,
  raceBlocks,
  defaultRiderId,
  onClose,
  onChanged,
}: Props) {
  const sortedRiders = useMemo(
    () => [...riders].sort((a, b) => a.name.localeCompare(b.name)),
    [riders],
  );

  const datedBlocks = useMemo(
    () =>
      raceBlocks
        .filter((b): b is RaceBlock & { start: string } => Boolean(b.start))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [raceBlocks],
  );

  const [riderId, setRiderId] = useState(defaultRiderId ?? sortedRiders[0]?.id ?? "");
  const [raceBlockId, setRaceBlockId] = useState(datedBlocks[0]?.id ?? "");
  const [role, setRole] = useState<Role>(ROLE.STARTER);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!riderId || !raceBlockId) return;
    setBusy(true);
    setError(null);
    try {
      await createEntry(riderId, raceBlockId, role);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry.");
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="mb-4 text-sm font-semibold text-gray-900">Add race entry</h2>

      <label className="mb-1 block text-xs font-medium text-gray-600">Rider</label>
      <select
        value={riderId}
        onChange={(e) => setRiderId(e.target.value)}
        disabled={busy}
        className="mb-3 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
      >
        {sortedRiders.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      <label className="mb-1 block text-xs font-medium text-gray-600">Race</label>
      <select
        value={raceBlockId}
        onChange={(e) => setRaceBlockId(e.target.value)}
        disabled={busy}
        className="mb-3 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
      >
        {datedBlocks.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name} ({b.start})
          </option>
        ))}
      </select>

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

      <div className="flex justify-end gap-2">
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
          disabled={busy || !riderId || !raceBlockId}
          onClick={handleSubmit}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add"}
        </button>
      </div>
    </Modal>
  );
}
