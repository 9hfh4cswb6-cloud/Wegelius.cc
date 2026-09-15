"use client";

import { useMemo, useState } from "react";
import RiderTimeline from "./RiderTimeline";
import type { Rider, RaceBlock, TimelineEntry } from "@/lib/airtable/data";
import {
  ALL_RIDERS_VALUE,
  buildAllRidersView,
  buildRiderWithTeamCalendarView,
} from "@/lib/timeline-views";

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

  const { groups, items } = useMemo(() => {
    if (selectedRiderId !== ALL_RIDERS_VALUE) {
      const rider = riders.find((r) => r.id === selectedRiderId);
      if (rider) return buildRiderWithTeamCalendarView(rider, raceBlocks, entries);
    }
    return buildAllRidersView(riders, entries);
  }, [selectedRiderId, riders, raceBlocks, entries]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-2">
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
      <div className="min-h-0 flex-1">
        <RiderTimeline groups={groups} items={items} />
      </div>
    </div>
  );
}
