import { NextRequest, NextResponse } from "next/server";
import { updateRecord, deleteRecord } from "@/lib/airtable/client";
import { TABLES, RACE_ENTRY_FIELDS, ROLE } from "@/lib/airtable/schema";

const RECORD_ID_RE = /^rec[A-Za-z0-9]{14}$/;

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/race-entries/[id]">) {
  const { id } = await ctx.params;
  if (!RECORD_ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid entry id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const raceBlockId = body?.raceBlockId;
  const role = body?.role;

  if (raceBlockId === undefined && role === undefined) {
    return NextResponse.json(
      { error: "Provide at least one of raceBlockId or role" },
      { status: 400 },
    );
  }
  if (raceBlockId !== undefined && (typeof raceBlockId !== "string" || !RECORD_ID_RE.test(raceBlockId))) {
    return NextResponse.json({ error: "Invalid raceBlockId" }, { status: 400 });
  }
  if (role !== undefined && role !== ROLE.STARTER && role !== ROLE.RESERVE) {
    return NextResponse.json(
      { error: `role must be "${ROLE.STARTER}" or "${ROLE.RESERVE}"` },
      { status: 400 },
    );
  }

  const fields: Record<string, unknown> = {};
  if (raceBlockId !== undefined) fields[RACE_ENTRY_FIELDS.RACE_BLOCK] = [raceBlockId];
  if (role !== undefined) fields[RACE_ENTRY_FIELDS.ROLE] = role;

  try {
    await updateRecord(TABLES.RACE_ENTRIES, id, fields);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to update race entry:", err);
    return NextResponse.json({ error: "Failed to update race entry" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/race-entries/[id]">) {
  const { id } = await ctx.params;
  if (!RECORD_ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid entry id" }, { status: 400 });
  }

  try {
    await deleteRecord(TABLES.RACE_ENTRIES, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete race entry:", err);
    return NextResponse.json({ error: "Failed to delete race entry" }, { status: 500 });
  }
}
