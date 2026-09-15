import type { Rider, RaceBlock, TimelineEntry } from "./airtable/data";
import type { TimelineGroup, TimelineItem } from "@/components/RiderTimeline";

export const TEAM_CALENDAR_GROUP_ID = "__team__";
export const ALL_RIDERS_VALUE = "__all__";

function entryItem(e: TimelineEntry, groupId: string): TimelineItem {
  return {
    id: e.id,
    group: groupId,
    start: e.start,
    end: e.end,
    content: e.raceBlockName,
    title: `${e.raceBlockName} — ${e.role ?? "Unassigned role"}`,
    className: e.role === "Starter" ? "entry-starter" : "entry-reserve",
  };
}

/** One row per rider, bars = each rider's own race entries. */
export function buildAllRidersView(
  riders: Rider[],
  entries: TimelineEntry[],
): { groups: TimelineGroup[]; items: TimelineItem[] } {
  return {
    groups: riders.map((r) => ({ id: r.id, content: r.name })),
    items: entries.map((e) => entryItem(e, e.riderId)),
  };
}

/**
 * Two rows sharing one time axis (so zoom/scroll stay in sync): every race on the
 * season calendar, and just this rider's own assignments — without the other 30
 * riders' rows in the way.
 */
export function buildRiderWithTeamCalendarView(
  rider: Rider,
  raceBlocks: RaceBlock[],
  entries: TimelineEntry[],
): { groups: TimelineGroup[]; items: TimelineItem[] } {
  const groups: TimelineGroup[] = [
    { id: TEAM_CALENDAR_GROUP_ID, content: "Team Calendar" },
    { id: rider.id, content: rider.name },
  ];

  const teamItems: TimelineItem[] = raceBlocks
    .filter((b): b is RaceBlock & { start: string; end: string } => Boolean(b.start && b.end))
    .map((b) => ({
      id: `team-${b.id}`,
      group: TEAM_CALENDAR_GROUP_ID,
      start: b.start,
      end: b.end,
      content: b.name,
      title: b.name,
      className: "team-block",
    }));

  const riderItems = entries
    .filter((e) => e.riderId === rider.id)
    .map((e) => entryItem(e, rider.id));

  return { groups, items: [...teamItems, ...riderItems] };
}
