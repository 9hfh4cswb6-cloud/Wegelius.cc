import type { Rider, RaceBlock, TimelineEntry } from "./airtable/data";
import type { TimelineGroup, TimelineItem } from "@/components/RiderTimeline";
import { parseLocalDate } from "./dates";

export const ALL_RIDERS_VALUE = "__all__";

/** The Race Block whose [start, end] range (inclusive) contains the given date, if any. */
export function findRaceBlockForDate(raceBlocks: RaceBlock[], date: Date): RaceBlock | null {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  for (const b of raceBlocks) {
    if (!b.start || !b.end) continue;
    if (target >= parseLocalDate(b.start).getTime() && target <= parseLocalDate(b.end).getTime()) {
      return b;
    }
  }
  return null;
}

/** One row per rider, bars = each rider's own race entries. */
export function buildAllRidersView(
  riders: Rider[],
  entries: TimelineEntry[],
): { groups: TimelineGroup[]; items: TimelineItem[] } {
  return {
    groups: riders.map((r) => ({ id: r.id, content: r.name })),
    items: entries.map((e) => ({
      id: e.id,
      group: e.riderId,
      start: e.start,
      end: e.end,
      content: e.raceBlockName,
      title: `${e.raceBlockName} — ${e.role ?? "Unassigned role"}`,
      className: e.role === "Starter" ? "entry-starter" : "entry-reserve",
    })),
  };
}
