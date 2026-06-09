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

  arrivalDate: string;
  shiftStartTime: string;
  shiftEndTime: string;

  concertStartTime?: string;
  shiftNotes?: string;

  timeBlock: TimeBlock;

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