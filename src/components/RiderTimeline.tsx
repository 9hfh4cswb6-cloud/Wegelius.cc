"use client";

import { useEffect, useRef, useState } from "react";
import type { Rider, TimelineEntry } from "@/lib/airtable/data";

interface Props {
  riders: Rider[];
  entries: TimelineEntry[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Race Block End Date is the last inclusive day of the race. vis-timeline's range
// items treat `end` as an exact boundary, so without this the bar would visually
// stop one day short of the race's actual last day.
function toExclusiveEnd(dateStr: string): Date {
  return new Date(new Date(dateStr).getTime() + DAY_MS);
}

export default function RiderTimeline({ riders, entries }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let timelineInstance: any;

    (async () => {
      try {
        const [{ Timeline }, { DataSet }] = await Promise.all([
          import("vis-timeline/standalone"),
          import("vis-data"),
        ]);

        if (disposed || !containerRef.current) return;

        const groups = new DataSet(
          riders.map((r) => ({
            id: r.id,
            content: r.name,
          })),
        );

        const items = new DataSet(
          entries.map((e) => ({
            id: e.id,
            group: e.riderId,
            start: e.start,
            end: toExclusiveEnd(e.end),
            content: e.raceBlockName,
            title: `${e.raceBlockName} — ${e.role ?? "Unassigned role"}`,
            className: e.role === "Starter" ? "entry-starter" : "entry-reserve",
          })),
        );

        const now = new Date();
        const options = {
          editable: false, // read-only for now — editing comes in a later pass
          stack: false,
          zoomMin: 3 * DAY_MS * 7,
          zoomMax: 500 * DAY_MS,
          margin: { item: { horizontal: 2, vertical: 6 } },
          orientation: "top" as const,
          start: new Date(now.getTime() - 14 * DAY_MS),
          end: new Date(now.getTime() + 45 * DAY_MS),
          groupHeightMode: "fixed" as const,
          tooltip: { followMouse: true },
        };

        timelineInstance = new Timeline(containerRef.current, items, groups, options);
      } catch (err) {
        console.error("Failed to initialize timeline:", err);
        if (!disposed) setError("Failed to render the timeline.");
      }
    })();

    return () => {
      disposed = true;
      timelineInstance?.destroy();
    };
  }, [riders, entries]);

  if (error) {
    return <div className="p-4 text-sm text-red-600">{error}</div>;
  }

  return <div ref={containerRef} className="timeline-shell h-full w-full" />;
}
