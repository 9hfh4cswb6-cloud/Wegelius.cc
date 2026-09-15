import { NextResponse } from "next/server";
import { getTimelineData } from "@/lib/airtable/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getTimelineData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to load timeline data:", err);
    return NextResponse.json(
      { error: "Failed to load timeline data from Airtable." },
      { status: 500 },
    );
  }
}
