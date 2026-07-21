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
import type { UserRole } from "@/lib/generated/prisma/client";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "MEMBER", label: "Member" },
  { value: "TREASURER", label: "Treasurer" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

export function RoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: UserRole;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={role}
      disabled={disabled || pending}
      items={ROLE_OPTIONS}
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
        {ROLE_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
