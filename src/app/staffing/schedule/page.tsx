import type { Metadata } from "next";
import { DailyVolunteerSchedule as DailyStaffSchedule } from "@/components/volunteers/DailyVolunteerSchedule";
import { getVolunteerScheduleData as getStaffingScheduleData } from "@/lib/airtable/volunteer-schedule";

export const metadata: Metadata = {
  title: "Staffing Schedule",
};

export default async function StaffingSchedulePage() {
  const { festivalDays, shifts } = await getStaffingScheduleData();

  return (
    <DailyStaffSchedule
      days={festivalDays}
      shifts={shifts}
      isAdmin={false}
    />
  );
}