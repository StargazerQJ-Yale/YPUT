import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Single-org lookup for Phase 1. When multi-org support lands, this becomes
 * "resolve org from subdomain/path/session" instead of a fixed env slug.
 */
export const getDefaultOrg = cache(async () => {
  const slug = process.env.DEFAULT_ORG_SLUG;
  if (!slug) {
    throw new Error("DEFAULT_ORG_SLUG is not set");
  }

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) {
    throw new Error(
      `Organization with slug "${slug}" not found. Run "npx prisma db seed" first.`,
    );
  }

  return org;
});

export const getActiveFiscalYear = cache(async () => {
  const org = await getDefaultOrg();
  const now = new Date();

  const fiscalYear = await prisma.fiscalYear.findFirst({
    where: { orgId: org.id, startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { startDate: "desc" },
  });

  if (!fiscalYear) {
    // Fall back to the most recently created fiscal year rather than hard
    // failing, so submissions still work right at a fiscal year boundary.
    return prisma.fiscalYear.findFirstOrThrow({
      where: { orgId: org.id },
      orderBy: { startDate: "desc" },
    });
  }

  return fiscalYear;
});
