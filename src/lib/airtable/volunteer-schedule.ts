import { listAirtableRecords } from "@/lib/airtable/client";
import { AIRTABLE_TABLES } from "@/lib/airtable/tables";
import type {
  FestivalDay,
  StaffAssignment,
  StaffOption,
  StaffScheduleOption,
  TimeBlock,
  VolunteerAssignment,
  VolunteerEventShift,
} from "@/types/volunteers";

type LinkedRecordIds = string[];

type AirtableEventFields = {
  Name?: string;
  "Official Name"?: string;
  "Event Start Datetime"?: string;
  "Event End Datetime"?: string;
  Venue?: LinkedRecordIds;
  "Full Venue Name"?: string[] | string;
  Type?: string;
  Status?: string;
};

type AirtableShiftFields = {
  "Shift Name"?: string;
  "Display Name"?: string;

  Event?: LinkedRecordIds;
  Venue?: LinkedRecordIds;
  EventCalDay?: string;
  EventName?: string;

  Assignments?: LinkedRecordIds;

  "Event Start Datetime"?: string;
  "Start Datetime"?: string;
  "End Datetime"?: string;

  "Shift Notes"?: string;
};

type AirtableAssignmentFields = {
  "Assignment Name"?: string;
  Notes?: string;

  "Confirmed Volunteers"?: LinkedRecordIds;
  "Pending Volunteers"?: LinkedRecordIds;

  Shift?: LinkedRecordIds;
  // Roles?: LinkedRecordIds | string[] | string;
  Roles?: LinkedRecordIds;

  RoleName?: string[] | string;
};

type AirtableVolunteerFields = {
  Name?: string;
  Email?: string;
  Phone?: string;
  Notes?: string;
  "Shift Interest"?: LinkedRecordIds;
};

type AirtableStaffFields = {
  Name?: string;
};

type AirtableStaffScheduleFields = {
  Event?: LinkedRecordIds;

  "FOH Staff"?: LinkedRecordIds;
  "Production Staff"?: LinkedRecordIds;

  staffPositionJSON?: string;
  "Shift Notes"?: string;

  // Placeholder for later, when staff shifts get explicit times.
  // "Start Datetime"?: string;
  // "End Datetime"?: string;
};

const FESTIVAL_START = process.env.FESTIVAL_START;
const FESTIVAL_END = process.env.FESTIVAL_END;

if (!FESTIVAL_START) {
  throw new Error("Missing FESTIVAL_START in .env.local");
}

if (!FESTIVAL_END) {
  throw new Error("Missing FESTIVAL_END in .env.local");
}

function buildFestivalEventFilterFormula() {
  return `AND(
    OR(
      {Type} = "Concert",
      {Type} = "Masterclass"
    ),
    {Status} != "Cancelled",
    OR(
      IS_SAME({Event Start Datetime}, DATETIME_PARSE("${FESTIVAL_START}")),
      IS_AFTER({Event Start Datetime}, DATETIME_PARSE("${FESTIVAL_START}"))
    ),
    OR(
      IS_SAME({Event Start Datetime}, DATETIME_PARSE("${FESTIVAL_END}")),
      IS_BEFORE({Event Start Datetime}, DATETIME_PARSE("${FESTIVAL_END}"))
    )
  )`;
}

function buildFestivalShiftFilterFormula() {
  return `AND(
    IS_AFTER({Start Datetime}, DATETIME_PARSE("${FESTIVAL_START}")),
    IS_BEFORE({Start Datetime}, DATETIME_PARSE("${FESTIVAL_END}"))
  )`;
}

function parseDateForDisplay(value: string): Date {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);

  if (isDateOnly) {
    return new Date(`${value}T12:00:00.000Z`);
  }

  return new Date(value);
}

function getLookupDisplayValue(value?: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  if (typeof value === "string") {
    return value;
  }

  return undefined;
}

function parseStaffPositionJSON(value?: string): Record<string, string> {
  if (!value?.trim()) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const staffPositions: Record<string, string> = {};

    for (const [staffId, position] of Object.entries(parsed)) {
      if (typeof position === "string") {
        staffPositions[staffId] = position;
      }
    }

    return staffPositions;
  } catch {
    return {};
  }
}

export async function getVolunteerScheduleData() {
  /* const [shifts, assignments, volunteers, staffRecords, staffSchedules] =
    await Promise.all([
      listAirtableRecords<AirtableShiftFields>(AIRTABLE_TABLES.shifts!, {
        filterByFormula: buildFestivalShiftFilterFormula(),
        sort: [
          {
            field: "Start Datetime",
            direction: "asc",
          },
        ],
      }),
      listAirtableRecords<AirtableAssignmentFields>(
        AIRTABLE_TABLES.assignments!
      ),
      listAirtableRecords<AirtableVolunteerFields>(AIRTABLE_TABLES.volunteers!),
      listAirtableRecords<AirtableStaffFields>(AIRTABLE_TABLES.staff!),
      listAirtableRecords<AirtableStaffScheduleFields>(
        AIRTABLE_TABLES.staffSchedule!
      ),
    ]); */
  const [
    events,
    volunteerShifts,
    assignments,
    volunteers,
    staffRecords,
    staffSchedules,
  ] = await Promise.all([
    listAirtableRecords<AirtableEventFields>(AIRTABLE_TABLES.events!, {
      filterByFormula: buildFestivalEventFilterFormula(),
      sort: [
        {
          field: "Event Start Datetime",
          direction: "asc",
        },
      ],
    }),
    listAirtableRecords<AirtableShiftFields>(AIRTABLE_TABLES.shifts!),
    listAirtableRecords<AirtableAssignmentFields>(
      AIRTABLE_TABLES.assignments!
    ),
    listAirtableRecords<AirtableVolunteerFields>(AIRTABLE_TABLES.volunteers!),
    listAirtableRecords<AirtableStaffFields>(AIRTABLE_TABLES.staff!),
    listAirtableRecords<AirtableStaffScheduleFields>(
      AIRTABLE_TABLES.staffSchedule!
    ),
  ]);

  const volunteerById = new Map(
    volunteers.map((volunteer) => [volunteer.id, volunteer])
  );

  const volunteerShiftsByEventId = new Map<string, typeof volunteerShifts>();
  for (const volunteerShift of volunteerShifts) {
    const linkedEventIds = volunteerShift.fields.Event ?? [];

    for (const eventId of linkedEventIds) {
      const existingVolunteerShifts =
        volunteerShiftsByEventId.get(eventId) ?? [];

      existingVolunteerShifts.push(volunteerShift);
      volunteerShiftsByEventId.set(eventId, existingVolunteerShifts);
    }
  }

  const assignmentsByShiftId = new Map<string, typeof assignments>();
  for (const assignment of assignments) {
    const linkedShiftIds = assignment.fields.Shift ?? [];

    for (const shiftId of linkedShiftIds) {
      const existingAssignments = assignmentsByShiftId.get(shiftId) ?? [];

      existingAssignments.push(assignment);
      assignmentsByShiftId.set(shiftId, existingAssignments);
    }
  }

  const staffById = new Map(
    staffRecords.map((staffMember) => [staffMember.id, staffMember])
  );

  const staffSchedulesByEventId = new Map<string, typeof staffSchedules>();

  for (const staffSchedule of staffSchedules) {
    const linkedEventIds = staffSchedule.fields.Event ?? [];

    for (const eventId of linkedEventIds) {
      const existingStaffSchedules =
        staffSchedulesByEventId.get(eventId) ?? [];

      existingStaffSchedules.push(staffSchedule);
      staffSchedulesByEventId.set(eventId, existingStaffSchedules);
    }
  }

  // const volunteerEventShifts: VolunteerEventShift[] = shifts.map((shift) => {
  const volunteerEventShifts: VolunteerEventShift[] = events.map((event) => {
    // const shiftAssignments = assignmentsByShiftId.get(shift.id) ?? [];
    const eventVolunteerShifts = volunteerShiftsByEventId.get(event.id) ?? [];
    const primaryVolunteerShift = eventVolunteerShifts[0];

    const hasVolunteerShift = eventVolunteerShifts.length > 0;

    const volunteerShiftNotes = eventVolunteerShifts
      .map((volunteerShift) => volunteerShift.fields["Shift Notes"])
      .filter(Boolean)
      .join("\n\n");

    const shiftAssignments = eventVolunteerShifts.flatMap((volunteerShift) => {
      return assignmentsByShiftId.get(volunteerShift.id) ?? [];
    });

    /* console.log("SHIFT DEBUG", {
      shiftId: shift.id,
      shiftName: shift.fields["Shift Name"],
      displayName: shift.fields["Display Name"],
    }); */

    /* const availableVolunteers = volunteers
      .filter((volunteer) => {
        const interestedShiftIds = volunteer.fields["Shift Interest"] ?? [];

        return interestedShiftIds.includes(shift.id);
      })
      .map((volunteer) => {
        return {
          id: volunteer.id,
          name: volunteer.fields.Name ?? "Unnamed volunteer",
        };
      }); */
    const eventVolunteerShiftIds = new Set(
      eventVolunteerShifts.map((volunteerShift) => volunteerShift.id)
    );

    const availableVolunteers = volunteers
      .filter((volunteer) => {
        const interestedShiftIds = volunteer.fields["Shift Interest"] ?? [];

        return interestedShiftIds.some((shiftId) =>
          eventVolunteerShiftIds.has(shiftId)
        );
      })
      .map((volunteer) => {
        return {
          id: volunteer.id,
          name: volunteer.fields.Name ?? "Unnamed volunteer",
        };
      });

    /* console.log("AVAILABLE VOLUNTEERS DEBUG", {
      shiftId: shift.id,
      shiftName: shift.fields["Shift Name"],
      availableVolunteers,
      sampleVolunteerShiftInterest: volunteers.slice(0, 5).map((volunteer) => ({
        volunteerId: volunteer.id,
        name: volunteer.fields.Name,
        shiftInterest: volunteer.fields["Shift Interest"],
      })),
    }); */

    const roleAssignments = shiftAssignments.map((assignment) => {
      const role = getLinkedDisplayValue(assignment.fields.RoleName) ?? "Volunteer";

      const confirmedVolunteerIds =
        assignment.fields["Confirmed Volunteers"] ?? [];

      const pendingVolunteerIds =
        assignment.fields["Pending Volunteers"] ?? [];

      return {
        id: assignment.id,
        role,
        currentVolunteerIds: [
          ...new Set([...confirmedVolunteerIds, ...pendingVolunteerIds]),
        ],
        confirmedVolunteerIds,
        pendingVolunteerIds,
      };
    });

    const volunteersForShift: VolunteerAssignment[] = shiftAssignments.flatMap(
      (assignment) => {
        const role =
          getLinkedDisplayValue(assignment.fields.RoleName) ?? "Volunteer";

        const confirmedVolunteerIds =
          assignment.fields["Confirmed Volunteers"] ?? [];

        const pendingVolunteerIds =
          assignment.fields["Pending Volunteers"] ?? [];

        const confirmedRows: VolunteerAssignment[] = confirmedVolunteerIds.map(
          (volunteerId) => {
            const volunteer = volunteerById.get(volunteerId);

            return {
              id: `${assignment.id}-${volunteerId}-confirmed`,
              assignmentId: assignment.id,
              volunteerId,
              volunteerName: volunteer?.fields.Name ?? "Unnamed volunteer",
              role,
              confirmed: true,
              // notes: assignment.fields.Notes,
            };
          }
        );

        const pendingRows: VolunteerAssignment[] = pendingVolunteerIds.map(
          (volunteerId) => {
            const volunteer = volunteerById.get(volunteerId);

            return {
              id: `${assignment.id}-${volunteerId}-pending`,
              assignmentId: assignment.id,
              volunteerId,
              volunteerName: volunteer?.fields.Name ?? "Unnamed volunteer",
              role,
              confirmed: false,
              // notes: assignment.fields.Notes,
            };
          }
        );

        return [...confirmedRows, ...pendingRows];
      }
    );
    
    const eventName =
      event.fields["Official Name"] ??
      event.fields.Name ??
      primaryVolunteerShift?.fields.EventName ??
      primaryVolunteerShift?.fields["Display Name"] ??
      "Untitled event";
    // const eventStart = shift.fields["Event Start Datetime"];
    const eventStart = event.fields["Event Start Datetime"];
    const eventEnd = event.fields["Event End Datetime"];

    // const shiftStart = shift.fields["Start Datetime"];
    const shiftStart = primaryVolunteerShift?.fields["Start Datetime"] ?? eventStart;
    // const shiftEnd = shift.fields["End Datetime"];
    const shiftEnd = primaryVolunteerShift?.fields["End Datetime"] ?? eventEnd;

    /* const linkedEventIds = shift.fields.Event ?? [];

    const shiftStaffSchedules = linkedEventIds.flatMap((eventId) => {
      return staffSchedulesByEventId.get(eventId) ?? [];
    }); */
    const shiftStaffSchedules = staffSchedulesByEventId.get(event.id) ?? [];

    const primaryStaffSchedule = shiftStaffSchedules[0];

    const staffScheduleOptions: StaffScheduleOption[] = shiftStaffSchedules.map(
      (staffSchedule) => {
        return {
          id: staffSchedule.id,
          // label: shift.fields.EventName ?? shift.fields["Display Name"] ?? "Staff schedule",
          label: eventName,
          fohStaffIds: staffSchedule.fields["FOH Staff"] ?? [],
          productionStaffIds: staffSchedule.fields["Production Staff"] ?? [],
        };
      }
    );

    const assignedStaffIds = new Set(
      staffScheduleOptions.flatMap((staffSchedule) => [
        ...staffSchedule.fohStaffIds,
        ...staffSchedule.productionStaffIds,
      ])
    );

    const availableStaff: StaffOption[] = staffRecords
      .filter((staffMember) => !assignedStaffIds.has(staffMember.id))
      .map((staffMember) => ({
        id: staffMember.id,
        name: staffMember.fields.Name ?? "Unnamed staff",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const staffForShift: StaffAssignment[] = shiftStaffSchedules.flatMap(
      (staffSchedule) => {
        // const notes = staffSchedule.fields.Notes;

        const staffPositions = parseStaffPositionJSON(
          staffSchedule.fields.staffPositionJSON
        );

        const fohStaffRows: StaffAssignment[] = (
          staffSchedule.fields["FOH Staff"] ?? []
        ).map((staffId) => {
          const staffMember = staffById.get(staffId);

          return {
            id: `${staffSchedule.id}-${staffId}-foh`,
            staffScheduleId: staffSchedule.id,
            staffId,
            staffName: staffMember?.fields.Name ?? "Unnamed staff",
            role: "FOH",
            position: staffPositions[staffId],
            // notes,

            // Placeholder for later, when staff shifts get explicit times.
            // startTime: formatTimeLabel(staffSchedule.fields["Start Datetime"]),
            // endTime: formatTimeLabel(staffSchedule.fields["End Datetime"]),
          };
        });

        const productionStaffRows: StaffAssignment[] = (
          staffSchedule.fields["Production Staff"] ?? []
        ).map((staffId) => {
          const staffMember = staffById.get(staffId);

          return {
            id: `${staffSchedule.id}-${staffId}-production`,
            staffScheduleId: staffSchedule.id,
            staffId,
            staffName: staffMember?.fields.Name ?? "Unnamed staff",
            role: "Production",
            position: staffPositions[staffId],
            // notes,

            // Placeholder for later, when staff shifts get explicit times.
            // startTime: formatTimeLabel(staffSchedule.fields["Start Datetime"]),
            // endTime: formatTimeLabel(staffSchedule.fields["End Datetime"]),
          };
        });

        return [...fohStaffRows, ...productionStaffRows];
      }
    );

    const staffNotes = shiftStaffSchedules
      .map((staffSchedule) => staffSchedule.fields["Shift Notes"])
      .filter(Boolean)
      .join("\n\n");

    return {
      // id: shift.id,
      id: event.id,

      date: getDateKey(shiftStart),
      dayNumber: 0,

      /* eventName:
        // shift.fields.EventName ??
        event.fields["Official Title"] ??
        // shift.fields["Display Name"] ??
        event.fields.Name ??
        // shift.fields["Shift Name"] ??
        primaryVolunteerShift?.fields.EventName ??
        primaryVolunteerShift?.fields["Display Name"] ??
        "Untitled event", */
      eventName,

      venueName: 
        // getLinkedDisplayValue(shift.fields.Venue) ??
        // getLinkedDisplayValue(event.fields.Venue) ??
        getLookupDisplayValue(event.fields["Full Venue Name"]) ??
        getLinkedDisplayValue(primaryVolunteerShift?.fields.Venue) ??
        "Unknown venue",

      hasVolunteerShift,
      arrivalDate: formatDateLabel(shiftStart),
      shiftStartTime: formatTimeLabel(shiftStart),
      shiftEndTime: formatTimeLabel(shiftEnd),

      concertStartTime: formatTimeLabel(eventStart),

      // shiftNotes: shift.fields["Shift Notes"],
      // shiftNotes: primaryVolunteerShift?.fields["Shift Notes"],
      volunteerShiftId: primaryVolunteerShift?.id,
      shiftNotes: volunteerShiftNotes,

      timeBlock: inferTimeBlockFromDatetime(shiftStart),

      staffScheduleId: primaryStaffSchedule?.id,
      staff: staffForShift,
      availableStaff,
      staffNotes,
      staffScheduleOptions,

      volunteers: volunteersForShift,
      availableVolunteers,
      roleAssignments,
    };
  });

  const festivalDays = buildFestivalDays(volunteerEventShifts);

  const dayNumberByDate = new Map(
    festivalDays.map((day) => [day.date, day.dayNumber])
  );

  const shiftsWithDayNumbers = volunteerEventShifts.map((shift) => ({
    ...shift,
    dayNumber: dayNumberByDate.get(shift.date) ?? 0,
  }));

  return {
    festivalDays,
    shifts: shiftsWithDayNumbers,
  };
}

function getDateKey(value?: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Toronto",
  }).format(date);
}

function formatDateLabel(value?: string): string {
  if (!value) {
    return "Unknown date";
  }

  const date = parseDateForDisplay(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Toronto",
  })
    .format(date)
    .replace(",", ".");
}

function formatShortDateLabel(value?: string): string {
  if (!value) {
    return "Unknown date";
  }

  const date = parseDateForDisplay(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Toronto",
  })
    .format(date)
    .replace(",", ".");
}

function formatTimeLabel(value?: string): string {
  if (!value) {
    return "TBD";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Toronto",
  }).format(date);
}

function inferTimeBlockFromDatetime(value?: string): TimeBlock {
  if (!value) {
    return "afternoon";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "afternoon";
  }

  const hour = Number(
    new Intl.DateTimeFormat("en-CA", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Toronto",
    }).format(date)
  );

  return hour < 17 ? "afternoon" : "evening";
}

function buildFestivalDays(shifts: VolunteerEventShift[]): FestivalDay[] {
  const uniqueDates = [...new Set(shifts.map((shift) => shift.date))]
    .filter(Boolean)
    .sort();

  return uniqueDates.map((date, index) => {
    return {
      id: date,
      date,
      dateLabel: formatDateLabel(date),
      shortLabel: formatShortDateLabel(date),
      dayNumber: index + 1,
    };
  });
}

function getLinkedDisplayValue(value?: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  if (typeof value === "string") {
    return value;
  }

  return undefined;
}