export type VolunteerAssignment = {
  id: string;
  assignmentId: string;
  volunteerId: string;
  volunteerName: string;
  role: string;
  confirmed: boolean;
  notes?: string;
};

export type TimeBlock = "afternoon" | "evening";

export type VolunteerEventShift = {
  id: string;

  date: string;
  dayNumber: number;

  eventName: string;
  venueName: string;

  hasVolunteerShift: boolean;
  arrivalDate: string;
  shiftStartTime: string;
  shiftEndTime: string;

  concertStartTime?: string;
  volunteerShiftId?: string;
  shiftNotes?: string;
  rehearsalLabel?: string;
  rehearsalStartTime?: string;
  rehearsalEndTime?: string;

  timeBlock: TimeBlock;

  staff: StaffAssignment[];
  staffNotes?: string;
  availableStaff: StaffOption[];
  staffScheduleOptions: StaffScheduleOption[];
  staffScheduleId?: string;

  volunteers: VolunteerAssignment[];

  availableVolunteers: VolunteerOption[];
  roleAssignments: RoleAssignmentOption[];
};

export type VolunteerOption = {
  id: string;
  name: string;
};

export type RoleAssignmentOption = {
  id: string;
  role: string;
  currentVolunteerIds: string[];
  confirmedVolunteerIds: string[];
  pendingVolunteerIds: string[];
};

export type FestivalDay = {
  id: string;
  date: string;
  dateLabel: string;
  shortLabel: string;
  dayNumber: number;
};

export type StaffRole = "FOH" | "Production";

export type StaffOption = {
  id: string;
  name: string;
};

export type StaffScheduleOption = {
  id: string;
  label: string;
  fohStaffIds: string[];
  productionStaffIds: string[];
};

export type StaffAssignment = {
  id: string;
  staffScheduleId: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  position?: string;

  // Placeholder for later, when staff shifts get explicit times.
  // startTime?: string;
  // endTime?: string;
};

export type ScheduleEvent = VolunteerEventShift;