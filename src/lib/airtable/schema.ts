// Field/table IDs for base apphjQDK3xvqQiTFc, confirmed against the live Airtable schema.
// IDs are used instead of names to stay correct across renames (e.g. "Race Block " has a
// trailing space in its display name) and to make write payloads unambiguous.

export const TABLES = {
  RIDERS: "tbl1EweDMRnYTlMRV",
  RACE_BLOCKS: "tblX5sq6vUmL9eKHe",
  RACE_LINEUPS: "tblydGKTWzyKBk2V7",
  RACE_ENTRIES: "tbldf1cU7idU7nMgZ",
  RACE_CALENDAR_DAYS: "tblFznv28eHBJ937S",
} as const;

export const RIDER_FIELDS = {
  NAME: "fldrxTdTdRUIYf2M6",
  RIDER_STATUS: "fldOzbdTf87SPvmRx",
  CURRENT_STATUS: "fldBWs3kpqtBSuetC",
  RACE_ENTRIES: "fldYiSndAJbS2ugQj",
} as const;

export const RACE_BLOCK_FIELDS = {
  NAME: "fldO3U4JPQgbJR5gj",
  START: "fldo7fn8p1QczgE91",
  END: "fldLsH8YqsEQDWcbn",
  REQUIRED_STARTERS: "fldNkapAT7mvMosd6",
  REQUIRED_RESERVES: "fldY3etOa49QbC9EB",
  RACE_ENTRIES: "fld12iWEOeYcIjyFc",
} as const;

// Only RACE_BLOCK, RIDER, and ROLE are writable on Race Entries. Everything else
// (Name, Start/End Date, Status, Injured Starter?, Entry Error, Active Today?,
// Window Label) is a formula or a lookup fed from Race Block / Rider — never write
// to those. Google Calendar Event ID is owned by an external sync job — never touch it.
export const RACE_ENTRY_FIELDS = {
  NAME: "fldzjV0FsEU7D9MZQ",
  RACE_BLOCK: "fldVcupdXbb6YmEt5",
  RIDER: "fldMbOgGV4FRsWTvw",
  ROLE: "fldjobRvgRHQ4ucVV",
  START_DATE: "fldk5NhdaTG4g6BCF",
  END_DATE: "fldKwjWQyJjeW8Olm",
  STATUS: "fldiqrePPkTfLtDsT",
  GOOGLE_CALENDAR_EVENT_ID: "fldCQofbGBU3y4oyM",
} as const;

export const ROLE = {
  STARTER: "Starter",
  RESERVE: "Reserve",
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];
