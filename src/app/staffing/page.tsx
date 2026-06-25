import type { Metadata } from "next";
import { DailyEventSchedule } from "@/components/schedule/DailyEventSchedule";
import { getStaffingScheduleData } from "@/lib/airtable/staffing-schedule";

export const metadata: Metadata = {
  title: "Staffing Schedule",
};

export default async function StaffingSchedulePage() {
  const { festivalDays, shifts } = await getStaffingScheduleData();

  return (
    <DailyEventSchedule
      days={festivalDays}
      events={shifts}
      showProdInfo={false}
      isAdmin={false}
    />
  );
}