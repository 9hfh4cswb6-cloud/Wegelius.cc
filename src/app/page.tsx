import { getTimelineData } from "@/lib/airtable/data";
import TimelineView from "@/components/TimelineView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let data: Awaited<ReturnType<typeof getTimelineData>> | null = null;
  let loadError: string | null = null;

  try {
    data = await getTimelineData();
  } catch (err) {
    console.error("Failed to load timeline data:", err);
    loadError =
      err instanceof Error ? err.message : "Failed to load timeline data from Airtable.";
  }

  return (
    <main className="flex h-dvh flex-col">
      <header className="flex items-center border-b border-gray-200 px-4 py-3">
        <h1 className="text-base font-semibold text-gray-900 sm:text-lg">
          Rider Race Calendar
        </h1>
      </header>

      <div className="min-h-0 flex-1">
        {loadError && (
          <div className="p-4 text-sm text-red-600">
            Couldn&apos;t load data from Airtable: {loadError}
          </div>
        )}
        {data && (
          <TimelineView
            riders={data.riders}
            raceBlocks={data.raceBlocks}
            entries={data.entries}
            unscheduledBlockCount={data.unscheduledBlockCount}
          />
        )}
      </div>
    </main>
  );
}
