import "server-only";
import { listAllRecords } from "./client";
import {
  TABLES,
  RIDER_FIELDS,
  RACE_BLOCK_FIELDS,
  RACE_ENTRY_FIELDS,
  type Role,
} from "./schema";

export interface Rider {
  id: string;
  name: string;
  riderStatus: string | null;
  currentStatus: string | null;
}

export interface RaceBlock {
  id: string;
  name: string;
  start: string | null;
  end: string | null;
  requiredStarters: number | null;
  requiredReserves: number | null;
}

export interface TimelineEntry {
  id: string;
  riderId: string;
  raceBlockId: string;
  raceBlockName: string;
  role: Role | null;
  start: string;
  end: string;
}

export interface TimelineData {
  riders: Rider[];
  raceBlocks: RaceBlock[];
  entries: TimelineEntry[];
  /** Race Blocks with no dates set yet — not placed on the timeline, but worth surfacing. */
  unscheduledBlockCount: number;
}

type RiderFieldsRaw = {
  [RIDER_FIELDS.NAME]?: string;
  [RIDER_FIELDS.RIDER_STATUS]?: string;
  [RIDER_FIELDS.CURRENT_STATUS]?: string;
};

type RaceBlockFieldsRaw = {
  [RACE_BLOCK_FIELDS.NAME]?: string;
  [RACE_BLOCK_FIELDS.START]?: string;
  [RACE_BLOCK_FIELDS.END]?: string;
  [RACE_BLOCK_FIELDS.REQUIRED_STARTERS]?: number;
  [RACE_BLOCK_FIELDS.REQUIRED_RESERVES]?: number;
};

type RaceEntryFieldsRaw = {
  [RACE_ENTRY_FIELDS.RACE_BLOCK]?: string[];
  [RACE_ENTRY_FIELDS.RIDER]?: string[];
  [RACE_ENTRY_FIELDS.ROLE]?: Role;
};

export async function getTimelineData(): Promise<TimelineData> {
  const [riderRecords, raceBlockRecords, entryRecords] = await Promise.all([
    listAllRecords<RiderFieldsRaw>(TABLES.RIDERS),
    listAllRecords<RaceBlockFieldsRaw>(TABLES.RACE_BLOCKS),
    listAllRecords<RaceEntryFieldsRaw>(TABLES.RACE_ENTRIES),
  ]);

  const riders: Rider[] = riderRecords.map((r) => ({
    id: r.id,
    name: r.fields[RIDER_FIELDS.NAME] ?? "(unnamed)",
    riderStatus: r.fields[RIDER_FIELDS.RIDER_STATUS] ?? null,
    currentStatus: r.fields[RIDER_FIELDS.CURRENT_STATUS] ?? null,
  }));

  const raceBlockById = new Map<string, RaceBlock>();
  for (const b of raceBlockRecords) {
    raceBlockById.set(b.id, {
      id: b.id,
      name: b.fields[RACE_BLOCK_FIELDS.NAME] ?? "(unnamed race)",
      start: b.fields[RACE_BLOCK_FIELDS.START] ?? null,
      end: b.fields[RACE_BLOCK_FIELDS.END] ?? null,
      requiredStarters: b.fields[RACE_BLOCK_FIELDS.REQUIRED_STARTERS] ?? null,
      requiredReserves: b.fields[RACE_BLOCK_FIELDS.REQUIRED_RESERVES] ?? null,
    });
  }

  const entries: TimelineEntry[] = [];
  for (const e of entryRecords) {
    const raceBlockId = e.fields[RACE_ENTRY_FIELDS.RACE_BLOCK]?.[0];
    const riderId = e.fields[RACE_ENTRY_FIELDS.RIDER]?.[0];
    if (!raceBlockId || !riderId) continue; // malformed/incomplete entry, skip

    const block = raceBlockById.get(raceBlockId);
    if (!block || !block.start || !block.end) continue; // undated block, can't place on the timeline

    entries.push({
      id: e.id,
      riderId,
      raceBlockId,
      raceBlockName: block.name,
      role: e.fields[RACE_ENTRY_FIELDS.ROLE] ?? null,
      start: block.start,
      end: block.end,
    });
  }

  const unscheduledBlockCount = raceBlockRecords.filter(
    (b) => !b.fields[RACE_BLOCK_FIELDS.START] || !b.fields[RACE_BLOCK_FIELDS.END],
  ).length;

  return {
    riders,
    raceBlocks: Array.from(raceBlockById.values()),
    entries,
    unscheduledBlockCount,
  };
}
