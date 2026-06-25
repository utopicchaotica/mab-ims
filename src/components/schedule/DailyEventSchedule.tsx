"use client";

import { useMemo, useState } from "react";
import { DayNav } from "@/components/volunteers/DayNav";
import { EventShiftCard } from "@/components/volunteers/EventShiftCard";
import type { FestivalDay, ScheduleEvent } from "@/types/volunteers";

type DailyEventScheduleProps = {
  days: FestivalDay[];
  events: ScheduleEvent[];
  isAdmin?: boolean;
  isProdAdmin?: boolean;
  showStaffing?: boolean;
  showProdInfo?: boolean;
  isDemoMode?: boolean;
};

export function DailyEventSchedule({
  days,
  events,
  isAdmin = false,
  isProdAdmin = false,
  showStaffing = true,
  showProdInfo = false,
  isDemoMode = false,
}: DailyEventScheduleProps) {
  const [selectedDate, setSelectedDate] = useState(days[0]?.date ?? "");

  const selectedDay = useMemo(() => {
    return days.find((day) => day.date === selectedDate) ?? days[0];
  }, [days, selectedDate]);

  const selectedDayShifts = useMemo(() => {
    return events.filter((event) => event.date === selectedDate);
  }, [events, selectedDate]);

  const afternoonShifts = selectedDayShifts.filter(
    (event) => event.timeBlock === "afternoon"
  );

  const eveningShifts = selectedDayShifts.filter(
    (event) => event.timeBlock === "evening"
  );

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-neutral-100">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          {selectedDay?.dateLabel ?? "Festival Schedule"}{" "}
          {selectedDay && (
            <span className="text-neutral-400">
              (Day {selectedDay.dayNumber})
            </span>
          )}
        </h1>

        <p className="mt-2 text-sm text-neutral-400">
          {selectedDayShifts.length} total events
        </p>

        {isDemoMode && (
          <p className="mt-2 inline-flex rounded-full border border-amber-700 bg-amber-950 px-3 py-1 text-xs font-medium text-amber-200">
            Demo mode: changes are temporary
          </p>
        )}

        <DayNav
          days={days}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </header>

      <ScheduleRow
        title="Afternoon Events"
        shifts={afternoonShifts}
        isAdmin={isAdmin}
        isProdAdmin={isProdAdmin}
        showStaffing={showStaffing}
        showProdInfo={showProdInfo}
      />

      <ScheduleRow
        title="Evening Events"
        shifts={eveningShifts}
        isAdmin={isAdmin}
        isProdAdmin={isProdAdmin}
        showStaffing={showStaffing}
        showProdInfo={showProdInfo}
      />
    </main>
  );
}

type ScheduleRowProps = {
  title: string;
  shifts: ScheduleEvent[];
  showStaffing: boolean;
  showProdInfo: boolean;
  isAdmin: boolean;
  isProdAdmin: boolean;
};

function ScheduleRow({ title, shifts, isAdmin, isProdAdmin,showStaffing, showProdInfo }: ScheduleRowProps) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
        {title}
      </h2>

      {shifts.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-3">
          {shifts.map((shift) => (
            <EventShiftCard
              key={shift.id}
              shift={shift}
              isAdmin={isAdmin}
              isProdAdmin={isProdAdmin}
              showStaffing={showStaffing}
              showProdInfo={showProdInfo} 
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-500">
          No {title.toLowerCase()} scheduled for this day.
        </div>
      )}
    </section>
  );
}