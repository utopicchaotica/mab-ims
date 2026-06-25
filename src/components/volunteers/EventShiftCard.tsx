"use client";

import { useState, useEffect } from "react";
import { AddVolunteerDialog } from "@/components/volunteers/AddVolunteerDialog";
import { VolunteerTable } from "@/components/volunteers/VolunteerTable";
import type { ScheduleEvent } from "@/types/volunteers";
import { AddStaffDialog } from "@/components/volunteers/AddStaffDialog";
import { StaffTable } from "@/components/volunteers/StaffTable";

type EventShiftCardProps = {
  shift: ScheduleEvent;
  isAdmin?: boolean;
  isProdAdmin?: boolean;
  showStaffing?: boolean;
  showProdInfo?: boolean;
};

// Helpers
function formatProdKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase());
}

function formatProdValue(value: string | number | boolean | null): string {
  if (value === null) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}
// End of Helpers

export function EventShiftCard({
  shift,
  isAdmin = false,
  isProdAdmin = false,
  showStaffing = true,
  showProdInfo = false
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

        {shift.rehearsalStartTime && (
          <p className="mt-1 text-neutral-400">
            {shift.rehearsalLabel ?? "Rehearsal"}: {shift.rehearsalStartTime}
            {shift.rehearsalEndTime ? `–${shift.rehearsalEndTime}` : ""}
          </p>
        )} { /* rehearsal time */ }

        {shift.concertStartTime && (
          <p className="mt-1 text-neutral-400">
            Concert: {shift.concertStartTime}
          </p>
        )} { /* concert time */ }
      </section>
      {showProdInfo && (
        <section className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-300">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Production
            </h4>

            {isProdAdmin && (
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-neutral-700 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-900"
              >
                Edit
              </button>
            )}
          </div>

          {shift.prodInfo ? (
            <dl className="space-y-1">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Chairs</dt>
                <dd className="text-right text-neutral-200">
                  {shift.prodInfo.chairs ?? "—"}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Music stands</dt>
                <dd className="text-right text-neutral-200">
                  {shift.prodInfo.musicStands ?? "—"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-neutral-500">No production info yet.</p>
          )}
        </section>
      )} {/* showProdInfo */}
      
      {showStaffing && (
        <>
        <StaffTable
          staff={localStaff}
          staffScheduleId={shift.staffScheduleId}
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
          } //onStaffRemoved
          isAdmin={isAdmin}
        />

        <section className="pt-3 mb-3 text-center font-semibold">
          <h4 className="mb-2 text-center text-md font-semibold uppercase tracking-wide text-neutral-50">
            Volunteers
          </h4>
          {shift.hasVolunteerShift && (
            <p className="mt-1 text-sm font-semibold text-neutral-400">
              Shift: {shift.shiftStartTime}–{shift.shiftEndTime}
            </p>
          )} { /* shift.hasVolunteerShift */ }
          
        </section>
        <VolunteerTable
          volunteers={shift.volunteers}
          roleAssignments={shift.roleAssignments}
          onAddVolunteer={isAdmin ? () => setIsAddVolunteerOpen(true) : undefined}
          /* onAddVolunteer={
            isAdmin
              ? () => {
                  console.log("ADD VOLUNTEER DEBUG", {
                    eventName: shift.eventName,
                    hasVolunteerShift: shift.hasVolunteerShift,
                    volunteerShiftId: shift.volunteerShiftId,
                    availableVolunteers: shift.availableVolunteers,
                    roleAssignments: shift.roleAssignments,
                  });

                  setIsAddVolunteerOpen(true);
                }
              : undefined
          } */
          interactiveOptions={{ usePointerCursor: isAdmin }}
          isAdmin={isAdmin}
        />

        {/* {shift.shiftNotes && (
          <section className="mt-4 rounded-xl bg-neutral-950 p-3 text-sm text-neutral-300">
            <p className="mb-1 font-medium text-neutral-400">Shift notes</p>
            <p>{shift.shiftNotes}</p>
          </section>
        )} */}
        <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-400">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Volunteer notes
          </div>

          <p className="whitespace-pre-wrap">
            {shift.shiftNotes?.trim() ? shift.shiftNotes : "—"}
          </p>
        </div>

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
        //isAdmin
      )}
      {isAdmin && (
        <AddVolunteerDialog
          isOpen={isAddVolunteerOpen}
          onClose={() => setIsAddVolunteerOpen(false)}
          eventLabel={`${shift.eventName} • ${shift.shiftStartTime} - ${shift.shiftEndTime}`}
          availableVolunteers={shift.availableVolunteers}
          roleAssignments={shift.roleAssignments}
        />
        //isAdmin
      )}
      </>
      //showStaffing
    )} 
    </article>
  ); //return
} //EventShiftCard