import type { Rider, TimelineEntry } from "./airtable/data";
import type { TimelineGroup, TimelineItem } from "@/components/RiderTimeline";

export const ALL_RIDERS_VALUE = "__all__";

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
