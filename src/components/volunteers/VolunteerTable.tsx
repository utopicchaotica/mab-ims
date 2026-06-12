"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
import type { RoleAssignmentOption, VolunteerAssignment } from "@/types/volunteers";
// import { addCircleButtonClassName } from "@/components/volunteers/buttonClassNames";
import { getAddCircleButtonClassName } from "@/components/volunteers/buttonClassNames";

type VolunteerSortKey = "volunteerName" | "role" | "confirmed" | "notes";

type VolunteerTableProps = {
  volunteers: VolunteerAssignment[];
  roleAssignments: RoleAssignmentOption[];
  onAddVolunteer?: () => void;
  interactiveOptions?: {
    usePointerCursor?: boolean;
  };
  isAdmin?: boolean;
};

export function VolunteerTable({
  volunteers,
  roleAssignments,
  onAddVolunteer,
  interactiveOptions = {
    usePointerCursor: true,
  },
  isAdmin = false,
}: VolunteerTableProps) {
  const router = useRouter();

  const [sortKey, setSortKey] = useState<VolunteerSortKey>("volunteerName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [localVolunteers, setLocalVolunteers] = useState(volunteers);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalVolunteers(volunteers);
  }, [volunteers]);

  const interactiveStateClassName = [
    interactiveOptions.usePointerCursor ? "cursor-pointer" : "",
    "disabled:cursor-not-allowed disabled:opacity-60",
  ].join(" ");
  const roleSelectClassName = [
    "w-full min-w-[140px] rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs text-neutral-100",
    interactiveStateClassName,
  ].join(" ");

  function handleSort(nextKey: VolunteerSortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  }

    async function handleRemoveVolunteer(volunteer: VolunteerAssignment) {
      setError("");

      const shouldRemove = window.confirm(
        `Remove ${volunteer.volunteerName} from ${volunteer.role}?`
      );

      if (!shouldRemove) {
        return;
      }

      const previousVolunteers = localVolunteers;

      setLocalVolunteers((currentVolunteers) =>
        currentVolunteers.filter(
          (currentVolunteer) => currentVolunteer.id !== volunteer.id
        )
      );

      startTransition(async () => {
        const response = await fetch(
          "/api/volunteer-assignments/remove-volunteer",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              assignmentId: volunteer.assignmentId,
              volunteerId: volunteer.volunteerId,
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);

          setLocalVolunteers(previousVolunteers);
          setError(data?.error ?? "Could not remove volunteer.");
          return;
        }

        router.refresh();
      });
    } //handleRemoveVolunteer

    async function handleChangeRole(
      volunteer: VolunteerAssignment,
      newAssignmentId: string
    ) {
      setError("");

      if (newAssignmentId === volunteer.assignmentId) {
        return;
      }

      const newRole = roleAssignments.find(
        (assignment) => assignment.id === newAssignmentId
      );

      if (!newRole) {
        setError("Could not find selected role.");
        return;
      }

      const previousVolunteers = localVolunteers;

      setLocalVolunteers((currentVolunteers) =>
        currentVolunteers.map((currentVolunteer) =>
          currentVolunteer.id === volunteer.id
            ? {
                ...currentVolunteer,
                id: `${newAssignmentId}-${volunteer.volunteerId}-${
                  volunteer.confirmed ? "confirmed" : "pending"
                }`,
                assignmentId: newAssignmentId,
                role: newRole.role,
              }
            : currentVolunteer
        )
      );

      startTransition(async () => {
        const response = await fetch(
          "/api/volunteer-assignments/move-volunteer-role",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              oldAssignmentId: volunteer.assignmentId,
              newAssignmentId,
              volunteerId: volunteer.volunteerId,
              confirmed: volunteer.confirmed,
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);

          setLocalVolunteers(previousVolunteers);
          setError(data?.error ?? "Could not update role.");
          return;
        }

        router.refresh();
      });
    } //handleChangeRole

    async function handleToggleConfirmed(
      volunteer: VolunteerAssignment,
      nextConfirmed: boolean
    ) {
      setError("");

      setLocalVolunteers((currentVolunteers) =>
        currentVolunteers.map((currentVolunteer) =>
          currentVolunteer.id === volunteer.id
            ? {
                ...currentVolunteer,
                confirmed: nextConfirmed,
              }
            : currentVolunteer
        )
      );

      startTransition(async () => {
        const response = await fetch(
          "/api/volunteer-assignments/toggle-confirmed",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              assignmentId: volunteer.assignmentId,
              volunteerId: volunteer.volunteerId,
              confirmed: nextConfirmed,
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);

          setLocalVolunteers((currentVolunteers) =>
            currentVolunteers.map((currentVolunteer) =>
              currentVolunteer.id === volunteer.id
                ? {
                    ...currentVolunteer,
                    confirmed: volunteer.confirmed,
                  }
                : currentVolunteer
            )
          );

          setError(data?.error ?? "Could not update confirmation.");
          return;
        }

        router.refresh();
      });
    } //handleToggleConfirmed

  const sortedVolunteers = useMemo(() => {
    // return [...volunteers].sort((a, b) => {
    return [...localVolunteers].sort((a, b) => {
      const aValue = String(a[sortKey] ?? "");
      const bValue = String(b[sortKey] ?? "");

      const result = aValue.localeCompare(bValue);

      return sortDirection === "asc" ? result : -result;
    });
  }, [localVolunteers, sortKey, sortDirection]);

  const groupedVolunteers = useMemo(() => {
    const groups = new Map<string, VolunteerAssignment[]>();

    for (const volunteer of sortedVolunteers) {
      const existingGroup = groups.get(volunteer.role) ?? [];
      existingGroup.push(volunteer);
      groups.set(volunteer.role, existingGroup);
    }

    return [...groups.entries()]
      .sort(([roleA], [roleB]) => roleA.localeCompare(roleB))
      .map(([role, volunteersInRole]) => ({
        role,
        volunteers: volunteersInRole.sort((a, b) =>
          a.volunteerName.localeCompare(b.volunteerName)
        ),
      }));
  }, [sortedVolunteers]);

  if (roleAssignments.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950 p-3 text-center text-sm text-neutral-500">
          No volunteers required.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-neutral-800">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-neutral-950 text-sm uppercase text-neutral-400">
            <tr>
              <SortableHeader
                label="Volunteer"
                sortKey="volunteerName"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
                className="w-[28%]"
              />
              <SortableHeader
                label="Role"
                sortKey="role"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
                className="w-[28%]"
              />
              <SortableHeader
                label="✅"
                sortKey="confirmed"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
                className="w-[8%]"
                align="center"
                labelClassName="text-base"
              />
              <SortableHeader
                label="Notes"
                sortKey="notes"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
                className="w-[28%]"
              />
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
            {groupedVolunteers.map((group) => (
              <Fragment key={group.role}>
                <tr key={`${group.role}-heading`} className="bg-neutral-950/80">
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-400"
                  >
                    {group.role}
                  </td>
                </tr>

                {group.volunteers.map((volunteer) => (
                  <tr key={volunteer.id}>
                    <td className="px-3 py-2">{volunteer.volunteerName}</td>

                    <td className="px-3 py-2 text-neutral-300">
                    {isAdmin ? (
                      <select
                        value={volunteer.assignmentId}
                        onChange={(event) =>
                          handleChangeRole(volunteer, event.target.value)
                        }
                        disabled={isPending}
                        // className="w-full min-w-[140px] rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                        className={roleSelectClassName}
                      >
                        {roleAssignments.map((assignment) => (
                          <option key={assignment.id} value={assignment.id}>
                            {assignment.role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-neutral-300">{volunteer.role}</span>
                    )}
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex justify-center">
                      {isAdmin ? (
                        <input
                          type="checkbox"
                          checked={volunteer.confirmed}
                          disabled={isPending}
                          onChange={(event) =>
                            handleToggleConfirmed(volunteer, event.currentTarget.checked)
                          }
                          // className="h-4 w-4 rounded border-neutral-600 bg-neutral-950 accent-emerald-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                          className={[
                            "h-4 w-4 rounded border-neutral-600 bg-neutral-950 accent-green-600",
                            interactiveStateClassName,
                          ].join(" ")}
                          aria-label={`${volunteer.volunteerName} confirmed status`}
                        />
                      ) : (
                        <span aria-label={volunteer.confirmed ? "Confirmed" : "Not confirmed"}>
                          {volunteer.confirmed ? "✅" : "—"}
                        </span>
                      )}
                      </div>
                    </td>

                    <td className="whitespace-normal break-words px-3 py-2 text-neutral-400">
                      {volunteer.notes || "—"}
                    </td>
                  {isAdmin && (
                    <td className="px-3 py-2">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveVolunteer(volunteer)}
                          disabled={isPending}
                          // className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-700 text-lg font-semibold leading-none text-white shadow-sm transition hover:bg-red-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
                          className={[
                            "inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-700 text-lg font-semibold leading-none text-white shadow-sm transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-neutral-900",
                            interactiveStateClassName,
                          ].join(" ")}
                          aria-label={`Remove ${volunteer.volunteerName}`}
                          title={`Remove ${volunteer.volunteerName}`}
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

      {error && (
        <p className="rounded-xl bg-red-950/60 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {isAdmin && (
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onAddVolunteer}
          // className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xl font-semibold leading-none text-white shadow-sm transition hover:bg-green-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-neutral-900"
          /* className={[
            "flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xl font-semibold leading-none text-white shadow-sm transition hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-neutral-900",
            interactiveStateClassName,
          ].join(" ")} */
          className={getAddCircleButtonClassName(interactiveOptions)}
          aria-label="Add volunteer"
          title="Add volunteer"
        >
          +
        </button>
      </div>
      )}
    </div>
  );
}

type HeaderAlign = "left" | "center" | "right";

type SortableHeaderProps = {
  label: string;
  sortKey: VolunteerSortKey;
  activeSortKey: VolunteerSortKey;
  sortDirection: "asc" | "desc";
  onSort: (sortKey: VolunteerSortKey) => void;
  className?: string;
  buttonClassName?: string;
  labelClassName?: string;
  align?: HeaderAlign;
  showSortIndicator?: boolean;
};

function SortableHeader({
  label,
  sortKey,
  activeSortKey,
  sortDirection,
  onSort,
  className = "",
  buttonClassName = "",
  labelClassName = "",
  align = "left",
  showSortIndicator = true,
}: SortableHeaderProps) {
  const isActive = sortKey === activeSortKey;

  const alignmentClassByValue: Record<HeaderAlign, string> = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right",
  };

  return (
    <th className={`px-3 py-2 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        // className="flex items-center gap-1 hover:text-neutral-100"
        className={[
          "flex w-full items-center gap-1 hover:text-neutral-100",
          alignmentClassByValue[align],
          buttonClassName,
        ].join(" ")}
      >
        <span className={labelClassName}>{label}</span>

        {showSortIndicator && isActive && (
          <span aria-hidden="true">
            {sortDirection === "asc" ? "↑" : "↓"}
          </span>
        )}
      </button>
    </th>
  );
}