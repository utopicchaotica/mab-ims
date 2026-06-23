import type { Metadata } from "next";
import { DailyEventSchedule } from "@/components/schedule/DailyEventSchedule";
import { getStaffingScheduleData } from "@/lib/airtable/staffing-schedule";

export const metadata: Metadata = {
  title: "Staffing Demo",
};

export default async function StaffingDemoPage() {
  const { festivalDays, shifts } = await getStaffingScheduleData();

  return (
    <DailyEventSchedule
      days={festivalDays}
      events={shifts}
      isAdmin={true}
      isDemoMode={true}
    />
  );
}