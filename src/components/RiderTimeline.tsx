"use client";

import { useEffect, useRef, useState } from "react";
import { parseLocalDate, addDays } from "@/lib/dates";

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
  editable?: boolean;
  /** A tap/click on an item (not a drag) — id matches TimelineItem.id. */
  onItemClick?: (itemId: string) => void;
  /** Fired after a drag-move finishes. The visual drag is always reverted immediately
   * (see comment below); the caller decides whether it actually sticks once the write
   * to Airtable resolves and fresh data flows back down through `items`. */
  onItemMove?: (itemId: string, newStart: Date) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export default function RiderTimeline({
  groups,
  items,
  editable = false,
  onItemClick,
  onItemMove,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const onItemClickRef = useRef(onItemClick);
  const onItemMoveRef = useRef(onItemMove);
  useEffect(() => {
    onItemClickRef.current = onItemClick;
    onItemMoveRef.current = onItemMove;
  });

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
            start: parseLocalDate(it.start),
            // Race Block End Date is the last inclusive day of the race. vis-timeline's
            // range items treat `end` as an exact boundary, so without the +1 day the
            // bar would visually stop one day short of the race's actual last day.
            end: addDays(parseLocalDate(it.end), 1),
            content: it.content,
            title: it.title,
            className: it.className,
          })),
        );

        const now = new Date();
        const options = {
          editable: editable
            ? { add: false, updateTime: true, updateGroup: false, remove: false }
            : false,
          stack: false,
          zoomMin: 3 * DAY_MS * 7,
          zoomMax: 500 * DAY_MS,
          margin: { item: { horizontal: 2, vertical: 6 } },
          orientation: "top" as const,
          start: new Date(now.getTime() - 14 * DAY_MS),
          end: new Date(now.getTime() + 45 * DAY_MS),
          groupHeightMode: "fixed" as const,
          tooltip: { followMouse: true },
          // A drag always snaps back to wherever `items` says it belongs — the actual
          // reassignment happens through onItemMove -> the Airtable write -> a refetch
          // that redraws the item at its real (possibly new) Race Block dates. This
          // avoids ever showing a bar at an imprecise, un-committed pixel position.
          onMove: (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            item: any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            callback: (item: any | null) => void,
          ) => {
            onItemMoveRef.current?.(item.id, item.start);
            callback(null);
          },
        };

        timelineInstance = new Timeline(containerRef.current, itemsDs, groupsDs, options);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        timelineInstance.on("select", (props: any) => {
          if (props.items.length === 1) {
            onItemClickRef.current?.(props.items[0]);
          }
        });
      } catch (err) {
        console.error("Failed to initialize timeline:", err);
        if (!disposed) setError("Failed to render the timeline.");
      }
    })();

    return () => {
      disposed = true;
      timelineInstance?.destroy();
    };
  }, [groups, items, editable]);

  if (error) {
    return <div className="p-4 text-sm text-red-600">{error}</div>;
  }

  return <div ref={containerRef} className="timeline-shell h-full w-full" />;
}
