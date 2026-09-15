import type { Role } from "./airtable/schema";

async function parseErrorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.error ?? `Request failed (${res.status})`;
}

export async function reassignEntry(entryId: string, raceBlockId: string): Promise<void> {
  const res = await fetch(`/api/race-entries/${entryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raceBlockId }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
}

export async function updateEntryRole(entryId: string, role: Role): Promise<void> {
  const res = await fetch(`/api/race-entries/${entryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
}

export async function createEntry(
  riderId: string,
  raceBlockId: string,
  role: Role,
): Promise<void> {
  const res = await fetch("/api/race-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ riderId, raceBlockId, role }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
}

export async function deleteEntry(entryId: string): Promise<void> {
  const res = await fetch(`/api/race-entries/${entryId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
}
