"use client";

import { useRouter } from "next/navigation";
import { Fragment, useMemo, useEffect, useState } from "react";
// import { addCircleButtonClassName } from "@/components/volunteers/buttonClassNames";
import { getAddCircleButtonClassName } from "@/components/volunteers/buttonClassNames";
import type { StaffAssignment, StaffRole } from "@/types/volunteers";
import { STAFF_POSITION_OPTIONS } from "@/lib/staffPositions";

const STAFF_ROLE_ORDER = ["FOH", "Production"];

const PRODUCTION_POSITION_ORDER = [
  "Production Lead",
  "Lighting",
  "Sound",
  "Stagehand",
];

function getRoleSortValue(role: string): number {
  const index = STAFF_ROLE_ORDER.indexOf(role);

  return index === -1 ? STAFF_ROLE_ORDER.length : index;
}

function getProductionPositionSortValue(position?: string): number {
  if (!position) {
    return PRODUCTION_POSITION_ORDER.length;
  }

  const index = PRODUCTION_POSITION_ORDER.indexOf(position);

  return index === -1 ? PRODUCTION_POSITION_ORDER.length : index;
}

type StaffTableProps = {
  staff: StaffAssignment[];
  staffScheduleId?: string;
  staffNotes?: string;
  onAddStaff?: () => void;
  onStaffRemoved?: (staffAssignmentId: string) => void;
  isAdmin?: boolean;
};

const interactiveStateClassName = [
  "cursor-pointer",
  "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

export function StaffTable({
  staff,
  staffScheduleId,
  staffNotes,
  onAddStaff,
  onStaffRemoved,
  isAdmin = false,
}: StaffTableProps) {
  const sortedStaff = [...staff].sort((a, b) => {
    const roleCompare = getRoleSortValue(a.role) - getRoleSortValue(b.role);

    if (roleCompare !== 0) {
      return roleCompare;
    }

    if (a.role === "Production" && b.role === "Production") {
      const positionCompare =
        getProductionPositionSortValue(a.position) -
        getProductionPositionSortValue(b.position);

      if (positionCompare !== 0) {
        return positionCompare;
      }
    }

    return a.staffName.localeCompare(b.staffName);
  });

  const groupedStaff = STAFF_ROLE_ORDER.map((role) => {
    return {
      role,
      staffMembers: sortedStaff.filter((staffMember) => staffMember.role === role),
    };
  }).filter((group) => group.staffMembers.length > 0);

  if (sortedStaff.length === 0) {
    return (
      <section className="mb-4">
        {/* <h4 className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Staff
        </h4> */}
        <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950 p-3 text-center text-sm text-neutral-500">
          No staff assigned.
        </div>
        {onAddStaff && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={onAddStaff}
            className={getAddCircleButtonClassName()}
            aria-label="Add staff"
            title="Add staff"
          >
            +
          </button>
        </div>
        )}
      </section>
    );
  }

  const router = useRouter();
  const [pendingStaffId, setPendingStaffId] = useState<string | null>(null);
  
  // Staff Notes
  const [localStaffNotes, setLocalStaffNotes] = useState(staffNotes ?? "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState("");
  useEffect(() => {
    setLocalStaffNotes(staffNotes ?? "");
  }, [staffNotes]);

  async function handleSaveStaffNotes() {
    if (!staffScheduleId) {
      setNotesError("No staff schedule is linked to this event yet.");
      return;
    }

    setIsSavingNotes(true);
    setNotesError("");

    try {
      const response = await fetch("/api/staff-assignments/update-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffScheduleId,
          notes: localStaffNotes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to save staff notes.");
      }

      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save staff notes.";

      setNotesError(message);
    } finally {
      setIsSavingNotes(false);
    }
  }

  async function handleChangeStaffRole(
    staffMember: StaffAssignment,
    newRole: StaffRole
  ) {
    if (staffMember.role === newRole) {
      return;
    }

    setPendingStaffId(staffMember.id);

    try {
      const response = await fetch("/api/staff-assignments/change-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffScheduleId: staffMember.staffScheduleId,
          staffId: staffMember.staffId,
          newRole,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "Failed to update staff role.");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setPendingStaffId(null);
    }
  }

  async function handleChangeStaffPosition(
    staffMember: StaffAssignment,
    position: string
  ) {
    if ((staffMember.position ?? "") === position) {
      return;
    }

    setPendingStaffId(staffMember.id);

    try {
      const response = await fetch("/api/staff-assignments/change-position", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffScheduleId: staffMember.staffScheduleId,
          staffId: staffMember.staffId,
          position,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to update staff position.");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setPendingStaffId(null);
    }
  }

  async function handleRemoveStaff(staffMember: StaffAssignment) {
    setPendingStaffId(staffMember.id);

    try {
      const response = await fetch("/api/staff-assignments/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffScheduleId: staffMember.staffScheduleId,
          staffId: staffMember.staffId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to remove staff.");
      }

      onStaffRemoved?.(staffMember.id);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setPendingStaffId(null);
    }
  }

  return (
    <section className="mb-4">
      {/* <h4 className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Staff
      </h4> */}
      <div className="overflow-hidden rounded-xl border border-neutral-800">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-neutral-950 text-xs uppercase text-neutral-400">
            <tr>
              <th className="w-[28%] px-3 py-2">Staff</th>
              <th className="w-[36%] px-3 py-2">Area</th>
              <th className="w-[28%] px-3 py-2">Position</th>
            {isAdmin && (
              <th className="w-[8%] px-3 py-2 text-center">
                <div className="flex justify-center">
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-700 text-lg font-semibold leading-none text-white shadow-sm"
                    aria-label="Remove"
                    title="Remove"
                  >
                    ×
                  </span>
                </div>
              </th>
            )}
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-800">
          {groupedStaff.map((group) => (
            <Fragment key={group.role}>
              <tr>
                <td
                  colSpan={isAdmin ? 4 : 3}
                  className="bg-neutral-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-400"
                >
                  {group.role}
                </td>
              </tr>

              {group.staffMembers.map((staffMember) => (
                <tr key={staffMember.id}>
                  <td className="px-3 py-2">{staffMember.staffName}</td>
                  <td className="px-3 py-2">
                {isAdmin ? (
                    <select
                      value={staffMember.role}
                      onChange={(event) =>
                        handleChangeStaffRole(
                          staffMember,
                          event.target.value as StaffRole
                        )
                      }
                      disabled={pendingStaffId === staffMember.id}
                      className={[
                        "w-full min-w-[120px] rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-100",
                        interactiveStateClassName,
                      ].join(" ")}
                    >
                      <option value="FOH">FOH</option>
                      <option value="Production">Production</option>
                    </select>   
                ) : (
                  staffMember.role
                )}
                  </td>

                  <td className="px-3 py-2">
                {isAdmin ? (
                    <select
                      value={staffMember.position ?? ""}
                      onChange={(event) =>
                        handleChangeStaffPosition(staffMember, event.target.value)
                      }
                      disabled={pendingStaffId === staffMember.id}
                      className={[
                        "w-full min-w-[140px] rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-100",
                        interactiveStateClassName,
                      ].join(" ")}
                    >
                      <option value="">—</option>

                      {STAFF_POSITION_OPTIONS.map((position) => (
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                ) : (
                  staffMember.position || "—"
                )}
                  </td>
                {isAdmin && (
                  <td className="px-3 py-2">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveStaff(staffMember)}
                        disabled={pendingStaffId === staffMember.id}
                        className={[
                          "inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-700 text-lg font-semibold leading-none text-white shadow-sm transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-neutral-900",
                          interactiveStateClassName,
                        ].join(" ")}
                        aria-label={`Remove ${staffMember.staffName}`}
                        title={`Remove ${staffMember.staffName}`}
                      >
                        ×
                      </button>
                    </div>
                  </td>
                )}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
        </table>
      </div>

      {/* Add Staff Button */}
      {onAddStaff && (
      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={onAddStaff}
          className={getAddCircleButtonClassName()}
          aria-label="Add staff"
          title="Add staff"
        >
          +
        </button>
      </div>
      )}

      {/* Staff Notes */}
      <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-400">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Staff notes
        </div>

        {isAdmin ? (
          <div className="space-y-2">
            <textarea
              value={localStaffNotes}
              onChange={(event) => setLocalStaffNotes(event.target.value)}
              disabled={isSavingNotes}
              rows={3}
              className="w-full resize-y rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Add staff notes..."
            />

            {notesError && (
              <p className="rounded-lg border border-red-900 bg-red-950/50 p-2 text-sm text-red-200">
                {notesError}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveStaffNotes}
                disabled={isSavingNotes || !staffScheduleId}
                className="cursor-pointer rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingNotes ? "Saving..." : "Save notes"}
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">
            {staffNotes?.trim() ? staffNotes : "—"}
          </p>
        )}
      </div>
    </section>
  );
}