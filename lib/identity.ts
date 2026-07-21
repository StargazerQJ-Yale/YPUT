import type { UserRole } from "@/lib/generated/prisma/client";

export type IdentitySubject = {
  id: string;
  fullName: string | null;
  email: string;
  avatarUrl?: string | null;
  role: UserRole;
  isTestAccount: boolean;
};

export type PublicIdentity = {
  fullName: string | null;
  email: string;
  avatarUrl?: string | null;
  isRedacted: boolean;
};

const TEST_ACCOUNT_LABEL = "Test Admin (anonymous)";
const SUPER_ADMIN_LABEL = "Super Admin";

/** Hides a user's real name/email/avatar from everyone except themselves and
 * the Super Admin — covers two cases: temporary/trial admin accounts (their
 * identity stays anonymous to other admins while they try things out) and
 * the Super Admin's own account (kept private from Admin/Treasurer/Member
 * views). Must be applied server-side, before the data is passed into a
 * Client Component prop, so real values never reach the browser. */
export function getPublicIdentity(
  subject: IdentitySubject,
  viewer: { id: string; role: UserRole },
): PublicIdentity {
  if (subject.id === viewer.id || viewer.role === "SUPER_ADMIN") {
    return {
      fullName: subject.fullName,
      email: subject.email,
      avatarUrl: subject.avatarUrl ?? null,
      isRedacted: false,
    };
  }
  if (subject.isTestAccount) {
    return { fullName: TEST_ACCOUNT_LABEL, email: "", avatarUrl: null, isRedacted: true };
  }
  if (subject.role === "SUPER_ADMIN") {
    return { fullName: SUPER_ADMIN_LABEL, email: "", avatarUrl: null, isRedacted: true };
  }
  return {
    fullName: subject.fullName,
    email: subject.email,
    avatarUrl: subject.avatarUrl ?? null,
    isRedacted: false,
  };
}
