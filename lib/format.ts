import type { Prisma } from "@/lib/generated/prisma/client";

type Amount = Prisma.Decimal | number | string;

export function formatCurrency(amount: Amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(amount),
  );
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(date),
  );
}
