"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import RiderTimeline from "./RiderTimeline";
import RiderMonthCalendar from "./RiderMonthCalendar";
import EditEntryPanel from "./EditEntryPanel";
import AddEntryModal from "./AddEntryModal";
import type { Rider, RaceBlock, TimelineEntry, TimelineData } from "@/lib/airtable/data";
import { ALL_RIDERS_VALUE, buildAllRidersView, findRaceBlockForDate } from "@/lib/timeline-views";
import { buildRiderCalendarEvents } from "@/lib/calendar-events";
import { reassignEntry } from "@/lib/mutations";

interface Props {
  riders: Rider[];
  raceBlocks: RaceBlock[];
  entries: TimelineEntry[];
  unscheduledBlockCount: number;
}

export default function TimelineView({
  riders: initialRiders,
  raceBlocks: initialRaceBlocks,
  entries: initialEntries,
  unscheduledBlockCount: initialUnscheduledBlockCount,
}: Props) {
  const [riders, setRiders] = useState(initialRiders);
  const [raceBlocks, setRaceBlocks] = useState(initialRaceBlocks);
  const [entries, setEntries] = useState(initialEntries);
  const [unscheduledBlockCount, setUnscheduledBlockCount] = useState(
    initialUnscheduledBlockCount,
  );

  const [selectedRiderId, setSelectedRiderId] = useState<string>(ALL_RIDERS_VALUE);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/timeline", { cache: "no-store" });
      if (!res.ok) throw new Error(`Refresh failed (${res.status})`);
      const data: TimelineData = await res.json();
      setRiders(data.riders);
      setRaceBlocks(data.raceBlocks);
      setEntries(data.entries);
      setUnscheduledBlockCount(data.unscheduledBlockCount);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to refresh data.");
    }
  }, [showToast]);

  const sortedRiders = useMemo(
    () => [...riders].sort((a, b) => a.name.localeCompare(b.name)),
    [riders],
  );

  const selectedRider = useMemo(
    () => riders.find((r) => r.id === selectedRiderId) ?? null,
    [riders, selectedRiderId],
  );

  const allRidersView = useMemo(() => buildAllRidersView(riders, entries), [riders, entries]);

  const calendarEvents = useMemo(() => {
    if (!selectedRider) return [];
    return buildRiderCalendarEvents(selectedRider, raceBlocks, entries);
  }, [selectedRider, raceBlocks, entries]);

  const editingEntry = useMemo(
    () => entries.find((e) => e.id === editingEntryId) ?? null,
    [entries, editingEntryId],
  );
  const editingEntryRiderName = useMemo(
    () => (editingEntry ? riders.find((r) => r.id === editingEntry.riderId)?.name ?? "" : ""),
    [editingEntry, riders],
  );

  const handleItemMove = useCallback(
    async (itemId: string, newStart: Date) => {
      const entry = entries.find((e) => e.id === itemId);
      if (!entry) return;

      const targetBlock = findRaceBlockForDate(raceBlocks, newStart);
      if (!targetBlock) {
        showToast("No race scheduled there — drag onto a race block.");
        return;
      }
      if (targetBlock.id === entry.raceBlockId) return; // dropped back on the same race

      try {
        await reassignEntry(entry.id, targetBlock.id);
        showToast(`Moved to ${targetBlock.name}`);
        await refetch();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to reassign entry.");
      }
    },
    [entries, raceBlocks, refetch, showToast],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2">
          <label htmlFor="rider-select" className="text-sm text-gray-600">
            View
          </label>
          <select
            id="rider-select"
            value={selectedRiderId}
            onChange={(e) => setSelectedRiderId(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
          >
            <option value={ALL_RIDERS_VALUE}>All riders</option>
            {sortedRiders.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {selectedRider && (
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#15803d]" />
              Starter
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#ca8a04]" />
              Reserve
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm border border-gray-400 bg-[#e5e7eb]" />
              Team Calendar
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {riders.length} riders · {entries.length} entries
            {unscheduledBlockCount > 0 && ` · ${unscheduledBlockCount} races unscheduled`}
          </span>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            + Add entry
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {selectedRider ? (
          <RiderMonthCalendar
            events={calendarEvents}
            onEventClick={(entryId) => setEditingEntryId(entryId)}
          />
        ) : (
          <RiderTimeline
            groups={allRidersView.groups}
            items={allRidersView.items}
            editable
            onItemClick={(itemId) => setEditingEntryId(itemId)}
            onItemMove={handleItemMove}
          />
        )}
      </div>

      {editingEntry && (
        <EditEntryPanel
          entry={editingEntry}
          riderName={editingEntryRiderName}
          onClose={() => setEditingEntryId(null)}
          onChanged={refetch}
        />
      )}

      {addModalOpen && (
        <AddEntryModal
          riders={riders}
          raceBlocks={raceBlocks}
          defaultRiderId={selectedRider?.id}
          onClose={() => setAddModalOpen(false)}
          onChanged={refetch}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
