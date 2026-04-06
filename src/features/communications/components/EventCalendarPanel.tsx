import { useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import { formatDate } from "../../../utils/date";
import type { EventItem } from "../services/communicationService";

type Props = {
  events: EventItem[];
  onOpen: (eventId: string) => void;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfWeek(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - value.getDay());
  return value;
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function EventCalendarPanel({ events, onOpen }: Props) {
  const [view, setView] = useState<"month" | "week" | "list" | "upcoming">("month");
  const [cursor, setCursor] = useState(new Date());

  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  const monthGridDays = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const gridStart = startOfWeek(start);
    const gridEnd = new Date(end);
    gridEnd.setDate(end.getDate() + (6 - end.getDay()));

    const days: Date[] = [];
    const iter = new Date(gridStart);
    while (iter <= gridEnd) {
      days.push(new Date(iter));
      iter.setDate(iter.getDate() + 1);
    }
    return days;
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [cursor]);

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (left, right) =>
          new Date(`${left.startDate}T${left.startTime || "00:00"}`).getTime() -
          new Date(`${right.startDate}T${right.startTime || "00:00"}`).getTime()
      ),
    [events]
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    sortedEvents.forEach((eventItem) => {
      const key = eventItem.startDate.slice(0, 10);
      const list = map.get(key) || [];
      list.push(eventItem);
      map.set(key, list);
    });
    return map;
  }, [sortedEvents]);

  const upcomingEvents = useMemo(
    () => sortedEvents.filter((eventItem) => new Date(eventItem.endDate) >= new Date()).slice(0, 8),
    [sortedEvents]
  );

  const moveBackward = () => {
    setCursor(
      view === "month"
        ? new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)
        : new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 7)
    );
  };

  const moveForward = () => {
    setCursor(
      view === "month"
        ? new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
        : new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7)
    );
  };

  return (
    <div className="space-y-4 rounded-[26px] border border-[rgba(123,97,63,0.12)] bg-[rgba(255,253,248,0.92)] p-4 shadow-[0_18px_40px_rgba(33,29,22,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["month", "week", "list", "upcoming"] as const).map((mode) => (
            <Button key={mode} size="sm" variant={view === mode ? "primary" : "outline"} onClick={() => setView(mode)}>
              {mode[0].toUpperCase() + mode.slice(1)}
            </Button>
          ))}
        </div>
        {view === "month" || view === "week" ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={moveBackward}>
              Prev
            </Button>
            <span className="text-sm font-semibold text-slate-800">{monthLabel}</span>
            <Button variant="outline" size="sm" onClick={moveForward}>
              Next
            </Button>
          </div>
        ) : null}
      </div>

      {view === "month" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/90">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <div key={label} className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthGridDays.map((day) => {
              const key = toDateKey(day);
              const dayEvents = eventsByDate.get(key) || [];
              const visibleEvents = dayEvents.slice(0, 2);
              const extraCount = Math.max(dayEvents.length - visibleEvents.length, 0);
              const isCurrentMonth = day.getMonth() === cursor.getMonth();

              return (
                <div
                  key={key}
                  className={`min-h-[112px] border-b border-r border-slate-200 px-2 py-2 ${
                    isCurrentMonth ? "bg-white" : "bg-slate-50/55"
                  }`}
                >
                  <p className={`text-sm font-semibold ${isCurrentMonth ? "text-slate-900" : "text-slate-400"}`}>
                    {day.getDate()}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {visibleEvents.map((eventItem) => (
                      <button
                        key={eventItem.id}
                        type="button"
                        onClick={() => onOpen(eventItem.id)}
                        className="w-full rounded-xl bg-teal-50 px-2 py-1.5 text-left text-xs text-teal-800 transition hover:bg-teal-100"
                      >
                        <p className="truncate font-semibold">{eventItem.title}</p>
                      </button>
                    ))}
                    {extraCount > 0 ? (
                      <p className="px-1 text-[11px] font-semibold text-slate-500">+{extraCount} more</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === "week" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          {weekDays.map((day) => {
            const key = toDateKey(day);
            return (
              <div key={key} className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(day.toISOString())}</p>
                <div className="mt-3 space-y-1.5">
                  {(eventsByDate.get(key) || []).map((eventItem) => (
                    <button
                      key={eventItem.id}
                      type="button"
                      onClick={() => onOpen(eventItem.id)}
                      className="w-full rounded-xl bg-amber-50 px-2.5 py-2 text-left text-xs text-amber-800 transition hover:bg-amber-100"
                    >
                      <p className="font-semibold">{eventItem.title}</p>
                      <p className="text-[11px]">{eventItem.allDay ? "All Day" : `${eventItem.startTime} - ${eventItem.endTime}`}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {view === "list" ? (
        <div className="space-y-3">
          {sortedEvents.map((eventItem) => (
            <button
              key={eventItem.id}
              type="button"
              onClick={() => onOpen(eventItem.id)}
              className="flex w-full flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-teal-200 hover:bg-teal-50/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-base font-semibold text-slate-900">{eventItem.title}</p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                  {eventItem.lifecycleStatus}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                {formatDate(eventItem.startDate)} {eventItem.allDay ? "All Day" : `${eventItem.startTime} - ${eventItem.endTime}`}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      {view === "upcoming" ? (
        <div className="space-y-3">
          {upcomingEvents.map((eventItem) => (
            <button
              key={eventItem.id}
              type="button"
              onClick={() => onOpen(eventItem.id)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-teal-200 hover:bg-teal-50/40"
            >
              <div>
                <p className="text-base font-semibold text-slate-900">{eventItem.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(eventItem.startDate)}
                  {eventItem.location ? ` | ${eventItem.location}` : ""}
                </p>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                {eventItem.mode}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
