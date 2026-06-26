"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import type {
  RoleAssignmentOption,
  VolunteerOption,
} from "@/types/volunteers";

type AddVolunteerDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  eventLabel: string;
  availableVolunteers: VolunteerOption[];
  roleAssignments: RoleAssignmentOption[];
};

export function AddVolunteerDialog({
  isOpen,
  onClose,
  eventLabel,
  availableVolunteers,
  roleAssignments,
}: AddVolunteerDialogProps) {
  const router = useRouter();
  
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(
    roleAssignments[0]?.id ?? ""
  );
  const [selectedVolunteerId, setSelectedVolunteerId] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const firstRoleAssignmentId = roleAssignments[0]?.id ?? "";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError("");
    setSelectedVolunteerId("");
    // setSelectedAssignmentId(firstRoleAssignmentId);
    setSelectedAssignmentId(
      [...roleAssignments].sort((a, b) => a.role.localeCompare(b.role))[0]?.id ?? ""
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const sortedRoleAssignments = useMemo(() => {
    return [...roleAssignments].sort((a, b) => a.role.localeCompare(b.role));
  }, [roleAssignments]);

  const selectedAssignment = useMemo(() => {
    return roleAssignments.find(
      (assignment) => assignment.id === selectedAssignmentId
    );
  }, [roleAssignments, selectedAssignmentId]);

  const sortedAvailableVolunteers = useMemo(() => {
    return [...availableVolunteers].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [availableVolunteers]);

  const eligibleVolunteers = useMemo(() => {
    if (!selectedAssignment) {
      return [];
    }

    const alreadyAssignedIds = new Set([
      ...selectedAssignment.currentVolunteerIds,
      ...selectedAssignment.confirmedVolunteerIds,
      ...selectedAssignment.pendingVolunteerIds,
    ]);

    return sortedAvailableVolunteers.filter(
      (volunteer) => !alreadyAssignedIds.has(volunteer.id)
    );
  }, [sortedAvailableVolunteers, selectedAssignment]);

  /* console.log("ADD VOLUNTEER DIALOG DEBUG", {
    shiftLabel,
    availableVolunteers,
    roleAssignments,
    selectedAssignment,
    eligibleVolunteers,
  }); */

  if (!isOpen) {
    return null;
  }

  function handleAddVolunteer() {
    setError("");

    /* console.log("SUBMIT ADD VOLUNTEER DEBUG", {
      selectedVolunteerId,
      selectedAssignmentId,
      availableVolunteers,
      roleAssignments,
    }); */

    if (!selectedAssignmentId || !selectedVolunteerId) {
      setError("Choose a role and volunteer first.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/volunteer-assignments/add-pending", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId: selectedAssignmentId,
          volunteerId: selectedVolunteerId,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Could not add volunteer.");
        return;
      }

      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-5 text-neutral-100 shadow-2xl">
        <header className="mb-5">
          <h2 className="text-xl font-semibold">Add volunteer</h2>
          <p className="mt-1 text-sm text-neutral-400">{eventLabel}</p>

          <p className="mt-2 rounded-lg bg-neutral-900 px-3 py-2 text-xs text-neutral-400">
            INFO: {sortedAvailableVolunteers.length} interested volunteers ·{" "}
            {eligibleVolunteers.length} eligible volunteers ·{" "}
            {roleAssignments.length} role assignments
          </p>
        </header>

        <div className="space-y-4">
          {/* <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-300">
              Available volunteer
            </span>
            <select
              value={selectedVolunteerId}
              onChange={(event) => setSelectedVolunteerId(event.target.value)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
            >
              <option value="">Choose volunteer...</option>

              {eligibleVolunteers.map((volunteer) => (
                <option key={volunteer.id} value={volunteer.id}>
                  {volunteer.name}
                </option>
              ))}
            </select>
            

            {eligibleVolunteers.length === 0 && (
              <p className="mt-2 text-sm text-neutral-500">
                No available volunteers left for this role.
              </p>
            )}
          </label> */}

          <select
            value={selectedVolunteerId}
            onChange={(event) => setSelectedVolunteerId(event.target.value)}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
          >
            <option value="">Choose volunteer...</option>

            {eligibleVolunteers.map((volunteer) => (
              <option key={volunteer.id} value={volunteer.id}>
                {volunteer.name}
              </option>
            ))}
          </select>

          {availableVolunteers.length === 0 && (
            <p className="mt-2 text-sm text-amber-300">
              No volunteers have marked interest in this shift.
            </p>
          )}

          {availableVolunteers.length > 0 && roleAssignments.length === 0 && (
            <p className="mt-2 text-sm text-amber-300">
              Volunteers were found, but this shift has no role assignments attached.
            </p>
          )}

          {availableVolunteers.length > 0 &&
            roleAssignments.length > 0 &&
            eligibleVolunteers.length === 0 && (
              <p className="mt-2 text-sm text-amber-300">
                Volunteers were found, but they are already pending or confirmed for this
                selected role.
              </p>
            )}

          {error && (
            <p className="rounded-xl bg-red-950/60 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-300">
              Role
            </span>
            <select
              value={selectedAssignmentId}
              onChange={(event) => {
                setSelectedAssignmentId(event.target.value);
              }}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
            >
              {sortedRoleAssignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.role}
                </option>
              ))}
            </select>
          </label>
        </div>

        <footer className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAddVolunteer}
            disabled={isPending}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Adding..." : "Add to pending"}
          </button>
        </footer>
      </div>
    </div>
  );
}