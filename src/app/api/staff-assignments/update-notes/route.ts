import { NextResponse } from "next/server";
import { updateAirtableRecord } from "@/lib/airtable/client";
import { AIRTABLE_TABLES } from "@/lib/airtable/tables";

type AirtableStaffScheduleFields = {
  Notes?: string;
};

type UpdateStaffNotesBody = {
  staffScheduleId?: string;
  notes?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UpdateStaffNotesBody;

    if (!body.staffScheduleId) {
      return NextResponse.json(
        {
          error: "Missing staffScheduleId.",
        },
        {
          status: 400,
        }
      );
    }

    const updatedStaffSchedule =
      await updateAirtableRecord<AirtableStaffScheduleFields>(
        AIRTABLE_TABLES.staffSchedule!,
        body.staffScheduleId,
        {
          Notes: body.notes ?? "",
        }
      );

    return NextResponse.json({
      ok: true,
      staffSchedule: updatedStaffSchedule,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}