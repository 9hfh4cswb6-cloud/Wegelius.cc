import { NextRequest, NextResponse } from "next/server";
import { createRecord } from "@/lib/airtable/client";
import { TABLES, RACE_ENTRY_FIELDS, ROLE } from "@/lib/airtable/schema";

const RECORD_ID_RE = /^rec[A-Za-z0-9]{14}$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const riderId = body?.riderId;
  const raceBlockId = body?.raceBlockId;
  const role = body?.role;

  if (typeof riderId !== "string" || !RECORD_ID_RE.test(riderId)) {
    return NextResponse.json({ error: "Invalid or missing riderId" }, { status: 400 });
  }
  if (typeof raceBlockId !== "string" || !RECORD_ID_RE.test(raceBlockId)) {
    return NextResponse.json({ error: "Invalid or missing raceBlockId" }, { status: 400 });
  }
  if (role !== ROLE.STARTER && role !== ROLE.RESERVE) {
    return NextResponse.json(
      { error: `role must be "${ROLE.STARTER}" or "${ROLE.RESERVE}"` },
      { status: 400 },
    );
  }

  try {
    const record = await createRecord(TABLES.RACE_ENTRIES, {
      [RACE_ENTRY_FIELDS.RIDER]: [riderId],
      [RACE_ENTRY_FIELDS.RACE_BLOCK]: [raceBlockId],
      [RACE_ENTRY_FIELDS.ROLE]: role,
    });
    return NextResponse.json({ id: record.id });
  } catch (err) {
    console.error("Failed to create race entry:", err);
    return NextResponse.json({ error: "Failed to create race entry" }, { status: 500 });
  }
}
