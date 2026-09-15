import type { Rider, RaceBlock, TimelineEntry } from "./airtable/data";
import type { Role } from "./airtable/schema";
import { parseLocalDate } from "./dates";

export interface RiderCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: true;
  resource: { kind: "rider"; role: Role | null } | { kind: "team" };
}

/**
 * Events for one rider's month calendar: their own race entries, plus every other
 * team race for context (muted, so the rider's own schedule still reads first).
 * Races the rider is themselves entered in are excluded from the team set to avoid
 * showing the same race twice on one day.
 */
export function buildRiderCalendarEvents(
  rider: Rider,
  raceBlocks: RaceBlock[],
  entries: TimelineEntry[],
): RiderCalendarEvent[] {
  const riderEntries = entries.filter((e) => e.riderId === rider.id);
  const riderBlockIds = new Set(riderEntries.map((e) => e.raceBlockId));

  const riderEvents: RiderCalendarEvent[] = riderEntries.map((e) => ({
    id: e.id,
    title: e.raceBlockName,
    start: parseLocalDate(e.start),
    end: parseLocalDate(e.end),
    allDay: true,
    resource: { kind: "rider", role: e.role },
  }));

  const teamEvents: RiderCalendarEvent[] = raceBlocks
    .filter((b): b is RaceBlock & { start: string; end: string } => Boolean(b.start && b.end))
    .filter((b) => !riderBlockIds.has(b.id))
    .map((b) => ({
      id: `team-${b.id}`,
      title: b.name,
      start: parseLocalDate(b.start),
      end: parseLocalDate(b.end),
      allDay: true,
      resource: { kind: "team" },
    }));

  return [...riderEvents, ...teamEvents];
}
