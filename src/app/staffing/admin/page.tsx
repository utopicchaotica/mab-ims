import type { Metadata } from "next";
import { DailyEventSchedule } from "@/components/schedule/DailyEventSchedule";
// import type { FestivalDay, VolunteerEventShift } from "@/types/volunteers";
import { getStaffingScheduleData } from "@/lib/airtable/staffing-schedule";

export const metadata: Metadata = {
  title: "MAB 2026 Summer Festival - Staffing",
};

export default async function StaffingSchedulePage() {
  const { festivalDays, shifts } = await getStaffingScheduleData();

  return (
    <DailyEventSchedule
      days={festivalDays}
      events={shifts}
      isAdmin={true}
    />
  );
}