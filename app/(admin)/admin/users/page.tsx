import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleSelect } from "@/components/admin/role-select";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import { ResetPinButton } from "@/components/admin/reset-pin-button";
import { TestAccountToggle } from "@/components/admin/test-account-toggle";
import { requireRoleManager } from "@/lib/auth";
import { getDefaultOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { ROLE_PERMISSIONS } from "@/lib/role-permissions";
import { getPublicIdentity } from "@/lib/identity";

export default async function UsersPage() {
  const currentUser = await requireRoleManager();
  const org = await getDefaultOrg();
  const permissions = ROLE_PERMISSIONS[currentUser.role] ?? {
    assignableRoles: [],
    manageableCurrentRoles: [],
  };
  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  const users = await prisma.user.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Anyone who signs in becomes a Member automatically. Promote trusted members from here.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Role</TableHead>
              {isSuperAdmin && <TableHead>Test Account</TableHead>}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const identity = getPublicIdentity(user, currentUser);
              const initials = (identity.fullName || identity.email || "?")
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const canManageThisUser =
                user.id !== currentUser.id && permissions.manageableCurrentRoles.includes(user.role);

              return (
                <TableRow key={user.id}>
                  <TableCell className="whitespace-normal">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarImage src={identity.avatarUrl ?? undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{identity.fullName ?? "—"}</p>
                        {identity.email && (
                          <p className="truncate text-xs text-muted-foreground">{identity.email}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <RoleSelect
                      userId={user.id}
                      role={user.role}
                      assignableRoles={permissions.assignableRoles}
                      disabled={!canManageThisUser}
                    />
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      {user.id !== currentUser.id && (
                        <TestAccountToggle userId={user.id} initialValue={user.isTestAccount} />
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    {isSuperAdmin && (
                      <div className="flex items-center gap-1">
                        <EditUserDialog
                          userId={user.id}
                          currentFullName={user.fullName}
                          currentEmail={user.email}
                        />
                        {user.role !== "MEMBER" && (
                          <ResetPinButton userId={user.id} name={user.fullName ?? user.email} />
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
