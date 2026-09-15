"use client";

import { useMemo, useState } from "react";
import RiderTimeline from "./RiderTimeline";
import RiderMonthCalendar from "./RiderMonthCalendar";
import type { Rider, RaceBlock, TimelineEntry } from "@/lib/airtable/data";
import { ALL_RIDERS_VALUE, buildAllRidersView } from "@/lib/timeline-views";
import { buildRiderCalendarEvents } from "@/lib/calendar-events";

interface Props {
  riders: Rider[];
  raceBlocks: RaceBlock[];
  entries: TimelineEntry[];
}

export default function TimelineView({ riders, raceBlocks, entries }: Props) {
  const [selectedRiderId, setSelectedRiderId] = useState<string>(ALL_RIDERS_VALUE);

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
      </div>
      <div className="min-h-0 flex-1">
        {selectedRider ? (
          <RiderMonthCalendar events={calendarEvents} />
        ) : (
          <RiderTimeline groups={allRidersView.groups} items={allRidersView.items} />
        )}
      </div>
    </div>
  );
}
