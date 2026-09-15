"use client";

import { useEffect, useRef, useState } from "react";

export interface TimelineGroup {
  id: string;
  content: string;
}

export interface TimelineItem {
  id: string;
  group: string;
  start: string;
  end: string;
  content: string;
  title?: string;
  className?: string;
}

interface Props {
  groups: TimelineGroup[];
  items: TimelineItem[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Race Block End Date is the last inclusive day of the race. vis-timeline's range
// items treat `end` as an exact boundary, so without this the bar would visually
// stop one day short of the race's actual last day.
function toExclusiveEnd(dateStr: string): Date {
  return new Date(new Date(dateStr).getTime() + DAY_MS);
}

export default function RiderTimeline({ groups, items }: Props) {
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

        const groupsDs = new DataSet(groups);
        const itemsDs = new DataSet(
          items.map((it) => ({
            id: it.id,
            group: it.group,
            start: it.start,
            end: toExclusiveEnd(it.end),
            content: it.content,
            title: it.title,
            className: it.className,
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

        timelineInstance = new Timeline(containerRef.current, itemsDs, groupsDs, options);
      } catch (err) {
        console.error("Failed to initialize timeline:", err);
        if (!disposed) setError("Failed to render the timeline.");
      }
    })();

    return () => {
      disposed = true;
      timelineInstance?.destroy();
    };
  }, [groups, items]);

  if (error) {
    return <div className="p-4 text-sm text-red-600">{error}</div>;
  }

  return <div ref={containerRef} className="timeline-shell h-full w-full" />;
}
