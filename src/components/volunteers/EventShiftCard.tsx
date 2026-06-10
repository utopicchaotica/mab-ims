"use client";

import { useState, useEffect } from "react";
import { AddVolunteerDialog } from "@/components/volunteers/AddVolunteerDialog";
import { VolunteerTable } from "@/components/volunteers/VolunteerTable";
import type { VolunteerEventShift } from "@/types/volunteers";
import { AddStaffDialog } from "@/components/volunteers/AddStaffDialog";
import { StaffTable } from "@/components/volunteers/StaffTable";

type EventShiftCardProps = {
  shift: VolunteerEventShift;
  isAdmin?: boolean;
};

export function EventShiftCard({
  shift,
  isAdmin = false,
}: EventShiftCardProps) {
  //Volunteer dialog state
  const [isAddVolunteerOpen, setIsAddVolunteerOpen] = useState(false);

  //Staff dialog state
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [localStaff, setLocalStaff] = useState(shift.staff);
  useEffect(() => {
    setLocalStaff(shift.staff);
  }, [shift.staff]);

  return (
    <article className="min-w-[560px] max-w-[680px] rounded-2xl border border-neutral-800 bg-neutral-900 p-4 shadow-lg">
      <header className="mb-4 border-b border-neutral-800 pb-3 text-center">
        <h3 className="text-base font-semibold text-neutral-50">
          {shift.arrivalDate}
        </h3>

        <p className="mt-1 text-sm font-semibold text-neutral-400">{shift.venueName}</p>
      </header>

      <section className="mb-4 text-sm text-center font-semibold">
        <p className="text-neutral-100">{shift.eventName}</p>

        {shift.concertStartTime && (
          <p className="mt-1 text-neutral-400">
            Concert time: {shift.concertStartTime}
          </p>
        )}
      </section>
      <StaffTable
        staff={localStaff}
        staffNotes={shift.staffNotes}
        onAddStaff={isAdmin ? () => setIsAddStaffOpen(true) : undefined}
        onStaffRemoved={
          isAdmin
            ? (staffAssignmentId) => {
                setLocalStaff((currentStaff) =>
                  currentStaff.filter(
                    (staffMember) => staffMember.id !== staffAssignmentId
                  )
                );
              }
            : undefined
        }
        isAdmin={isAdmin}
      />

      <section className="pt-3 mb-3 text-center font-semibold">
        <h4 className="mb-2 text-center text-md font-semibold uppercase tracking-wide text-neutral-50">
          Volunteers
          <p className="mt-1 text-sm font-semibold text-neutral-400">Shift time: {shift.shiftStartTime} -{" "}{shift.shiftEndTime}</p>
        </h4>
      </section>
      <VolunteerTable
        volunteers={shift.volunteers}
        roleAssignments={shift.roleAssignments}
        onAddVolunteer={isAdmin ? () => setIsAddVolunteerOpen(true) : undefined}
        interactiveOptions={{ usePointerCursor: isAdmin }}
        isAdmin={isAdmin}
      />

      {shift.shiftNotes && (
        <section className="mt-4 rounded-xl bg-neutral-950 p-3 text-sm text-neutral-300">
          <p className="mb-1 font-medium text-neutral-400">Shift notes</p>
          <p>{shift.shiftNotes}</p>
        </section>
      )}

    {isAdmin && (
      <AddStaffDialog
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        availableStaff={shift.availableStaff}
        staffScheduleOptions={shift.staffScheduleOptions}
        onStaffAdded={(addedStaff) => {
          setLocalStaff((currentStaff) => [
            ...currentStaff,
            {
              id: `${addedStaff.staffScheduleId}-${addedStaff.staffId}-${addedStaff.role.toLowerCase()}`,
              staffScheduleId: addedStaff.staffScheduleId,
              staffId: addedStaff.staffId,
              staffName: addedStaff.staffName,
              role: addedStaff.role,
              position: addedStaff.position,
            },
          ]);
        }}
      />
    )}
    {isAdmin && (
      <AddVolunteerDialog
        isOpen={isAddVolunteerOpen}
        onClose={() => setIsAddVolunteerOpen(false)}
        shiftLabel={`${shift.eventName} • ${shift.shiftStartTime} - ${shift.shiftEndTime}`}
        availableVolunteers={shift.availableVolunteers}
        roleAssignments={shift.roleAssignments}
      />
    )}
    </article>
  );
}