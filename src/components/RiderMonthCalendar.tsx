"use client";

import { useState } from "react";
import { Calendar, Views, type EventPropGetter, type View } from "react-big-calendar";
import { calendarLocalizer } from "@/lib/calendar-localizer";
import type { RiderCalendarEvent } from "@/lib/calendar-events";

interface Props {
  events: RiderCalendarEvent[];
}

const eventPropGetter: EventPropGetter<RiderCalendarEvent> = (event) => {
  if (event.resource.kind === "rider") {
    return {
      className: event.resource.role === "Starter" ? "entry-starter" : "entry-reserve",
    };
  }
  return { className: "team-block" };
};

export default function RiderMonthCalendar({ events }: Props) {
  // react-big-calendar can manage date/view internally when left uncontrolled, but
  // that path is flaky under React 19 (Back/Next silently no-op) — controlling it
  // explicitly here sidesteps that.
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.MONTH);

  return (
    <div className="calendar-shell h-full w-full p-2">
      <Calendar
        localizer={calendarLocalizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        allDayAccessor="allDay"
        date={date}
        onNavigate={setDate}
        view={view}
        onView={setView}
        views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
        eventPropGetter={eventPropGetter}
        popup
        style={{ height: "100%" }}
      />
    </div>
  );
}
