import "server-only";

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

// Airtable enforces 5 requests/sec per base. This serializes every request made by
// this server process and spaces them out, so a burst of writes (or read + writes)
// never exceeds the limit. It's a best-effort, in-memory throttle — good enough for
// a low-traffic personal app on a single Vercel instance.
const MIN_INTERVAL_MS = 220;
let lastRequestAt = 0;
let queue: Promise<unknown> = Promise.resolve();

function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = Math.max(0, lastRequestAt + MIN_INTERVAL_MS - Date.now());
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequestAt = Date.now();
    return fn();
  });
  // Never let one failed request wedge the queue for subsequent ones.
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function getConfig() {
  const pat = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!pat || !baseId) {
    throw new Error(
      "Missing AIRTABLE_PAT or AIRTABLE_BASE_ID environment variables. Set them in .env.local.",
    );
  }
  return { pat, baseId };
}

export function getBaseId(): string {
  return getConfig().baseId;
}

export async function airtableRequest<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { pat } = getConfig();
  return throttle(async () => {
    const res = await fetch(`${AIRTABLE_API_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${pat}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Airtable API error ${res.status} ${res.statusText}: ${body}`);
    }
    return res.json() as Promise<T>;
  });
}

interface AirtableRecord<F = Record<string, unknown>> {
  id: string;
  createdTime: string;
  fields: F;
}

interface ListRecordsResponse<F = Record<string, unknown>> {
  records: AirtableRecord<F>[];
  offset?: string;
}

/** Lists every record in a table, paginating automatically, with field values keyed by field ID. */
export async function listAllRecords<F = Record<string, unknown>>(
  tableId: string,
  extraParams: Record<string, string> = {},
): Promise<AirtableRecord<F>[]> {
  const { baseId } = getConfig();
  const records: AirtableRecord<F>[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({
      returnFieldsByFieldId: "true",
      pageSize: "100",
      ...extraParams,
    });
    if (offset) params.set("offset", offset);

    const data = await airtableRequest<ListRecordsResponse<F>>(
      `/${baseId}/${tableId}?${params.toString()}`,
    );
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

export async function updateRecord<F = Record<string, unknown>>(
  tableId: string,
  recordId: string,
  fields: Partial<F>,
): Promise<AirtableRecord<F>> {
  const { baseId } = getConfig();
  return airtableRequest<AirtableRecord<F>>(
    `/${baseId}/${tableId}/${recordId}?returnFieldsByFieldId=true`,
    {
      method: "PATCH",
      body: JSON.stringify({ fields }),
    },
  );
}

export async function createRecord<F = Record<string, unknown>>(
  tableId: string,
  fields: Partial<F>,
): Promise<AirtableRecord<F>> {
  const { baseId } = getConfig();
  return airtableRequest<AirtableRecord<F>>(
    `/${baseId}/${tableId}?returnFieldsByFieldId=true`,
    {
      method: "POST",
      body: JSON.stringify({ fields }),
    },
  );
}

export async function deleteRecord(tableId: string, recordId: string): Promise<void> {
  const { baseId } = getConfig();
  await airtableRequest(`/${baseId}/${tableId}/${recordId}`, { method: "DELETE" });
}
