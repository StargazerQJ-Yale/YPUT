"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserRole } from "@/lib/actions/users";
import { ROLE_LABELS } from "@/lib/role-permissions";
import type { UserRole } from "@/lib/generated/prisma/client";

export function RoleSelect({
  userId,
  role,
  assignableRoles,
  disabled,
}: {
  userId: string;
  role: UserRole;
  assignableRoles: UserRole[];
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  // The current role might not be one the viewer is allowed to assign (e.g. a
  // Super Admin row shown to an Admin viewer) — still show it as the current
  // value, just don't let it be picked from the dropdown's own option list.
  const options = assignableRoles.includes(role)
    ? assignableRoles
    : [role, ...assignableRoles];

  return (
    <Select
      value={role}
      disabled={disabled || pending || assignableRoles.length === 0}
      items={options.map((value) => ({ value, label: ROLE_LABELS[value] ?? value }))}
      onValueChange={(value) =>
        startTransition(async () => {
          const result = await updateUserRole(userId, value as UserRole);
          if (result.success) toast.success("Role updated");
          else toast.error(result.error);
        })
      }
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((value) => (
          <SelectItem key={value} value={value}>
            {ROLE_LABELS[value] ?? value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
