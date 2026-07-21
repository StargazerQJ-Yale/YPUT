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
import { requireSuperAdmin } from "@/lib/auth";
import { getDefaultOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export default async function UsersPage() {
  const currentUser = await requireSuperAdmin();
  const org = await getDefaultOrg();

  const users = await prisma.user.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Anyone who signs in becomes a Member automatically. Promote trusted members to Treasurer or
          Super Admin here.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const initials = (user.fullName || user.email)
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <TableRow key={user.id}>
                  <TableCell className="whitespace-normal">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarImage src={user.avatarUrl ?? undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{user.fullName ?? "—"}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <RoleSelect userId={user.id} role={user.role} disabled={user.id === currentUser.id} />
                  </TableCell>
                  <TableCell>
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
