import { DailyEventSchedule } from "@/components/schedule/DailyEventSchedule";
import { getStaffingScheduleData } from "@/lib/airtable/staffing-schedule";

export const metadata = {
  title: "Production Admin",
};

export default async function ProductionAdminPage() {
  const { festivalDays, shifts } = await getStaffingScheduleData();

  return (
    <DailyEventSchedule
      days={festivalDays}
      events={shifts}
      showStaffing
      showProdInfo
      isProdAdmin
    />
  );
}