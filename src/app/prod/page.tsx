import { DailyEventSchedule } from "@/components/schedule/DailyEventSchedule";
import { getStaffingScheduleData } from "@/lib/airtable/staffing-schedule";

export const metadata = {
  title: "Production Schedule",
};

export default async function ProductionSchedulePage() {
  const { festivalDays, shifts } = await getStaffingScheduleData();

  return (
    <DailyEventSchedule
      days={festivalDays}
      events={shifts}
      showStaffing={true}
      showProdInfo={true}
    />
  );
}