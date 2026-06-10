"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { STAFF_POSITION_OPTIONS } from "@/lib/staffPositions";
import type {
  StaffOption,
  StaffRole,
  StaffScheduleOption,
} from "@/types/volunteers";

type AddStaffDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  availableStaff: StaffOption[];
  staffScheduleOptions: StaffScheduleOption[];
  onStaffAdded?: (data: {
    staffScheduleId: string;
    staffId: string;
    staffName: string;
    role: StaffRole;
    position?: string;
  }) => void;
};

export function AddStaffDialog({
  isOpen,
  onClose,
  availableStaff,
  staffScheduleOptions,
  onStaffAdded,
}: AddStaffDialogProps) {
  const router = useRouter();

  const [selectedStaffScheduleId, setSelectedStaffScheduleId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedRole, setSelectedRole] = useState<StaffRole>("FOH");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedStaffScheduleId(staffScheduleOptions[0]?.id ?? "");
    setSelectedStaffId("");
    setSelectedRole("FOH");
    setSelectedPosition("");
    setError("");
  }, [isOpen, staffScheduleOptions]);

  const sortedAvailableStaff = useMemo(() => {
    return [...availableStaff].sort((a, b) => a.name.localeCompare(b.name));
  }, [availableStaff]);

  /* console.log("ADD STAFF DEBUG", {
    availableStaff,
    staffScheduleOptions,
    selectedStaffScheduleId,
    selectedStaffId,
    selectedRole,
  }); */

  if (!isOpen) { return null; }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedStaffScheduleId) {
      setError("No staff schedule is linked to this event yet.");
      return;
    }

    if (!selectedStaffId) {
      setError("Please choose a staff member.");
      return;
    }

    if (!selectedRole) {
      setError("Please choose a role.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/staff-assignments/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffScheduleId: selectedStaffScheduleId,
          staffId: selectedStaffId,
          role: selectedRole,
          position: selectedPosition,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to add staff.");
      }

      const selectedStaffMember = availableStaff.find(
        (staffMember) => staffMember.id === selectedStaffId
      );

      onStaffAdded?.({
        staffScheduleId: selectedStaffScheduleId,
        staffId: selectedStaffId,
        staffName: selectedStaffMember?.name ?? "Unnamed staff",
        role: selectedRole,
        position: selectedPosition || undefined,
      });

      onClose();
      router.refresh();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to add staff.";

      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-neutral-100">
            Add staff
          </h3>

          <p className="mt-1 text-sm text-neutral-400">
            Add a staff member as FOH or Production.
          </p>
        </div>

        <div className="mb-3 rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-xs text-neutral-400">
          <div>Staff schedules: {staffScheduleOptions.length}</div>
          <div>Available staff: {availableStaff.length}</div>
          <div>Selected schedule: {selectedStaffScheduleId || "none"}</div>
          <div>Selected staff: {selectedStaffId || "none"}</div>
          <div>Selected role: {selectedRole || "none"}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {staffScheduleOptions.length > 1 && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-300">
                Staff schedule
              </span>

              <select
                value={selectedStaffScheduleId}
                onChange={(event) =>
                  setSelectedStaffScheduleId(event.target.value)
                }
                className="w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
              >
                {staffScheduleOptions.map((staffSchedule) => (
                  <option key={staffSchedule.id} value={staffSchedule.id}>
                    {staffSchedule.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-300">
              Staff
            </span>

            <select
              value={selectedStaffId}
              onChange={(event) => setSelectedStaffId(event.target.value)}
              className="w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
            >
              <option value="">Choose staff...</option>

              {sortedAvailableStaff.map((staffMember) => (
                <option key={staffMember.id} value={staffMember.id}>
                  {staffMember.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-300">
              Role
            </span>

            <select
              value={selectedRole}
              onChange={(event) =>
                setSelectedRole(event.target.value as StaffRole)
              }
              className="w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
            >
              <option value="FOH">FOH</option>
              <option value="Production">Production</option>
            </select>
          </label>

          {error && (
            <p className="rounded-lg border border-red-900 bg-red-950/50 p-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-300">
              Position
            </span>

            <select
              value={selectedPosition}
              onChange={(event) => setSelectedPosition(event.target.value)}
              className="w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
            >
              <option value="">—</option>

              {STAFF_POSITION_OPTIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="cursor-pointer rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || !selectedStaffScheduleId || !selectedStaffId}
              className="cursor-pointer rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Adding..." : "Add staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}