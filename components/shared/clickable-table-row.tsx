"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Double-click anywhere in the row to open it, while leaving the row's own
// <Link> cell(s) as the single-click/keyboard-accessible way in — this only
// adds a convenience on top, it doesn't replace normal link navigation.
export function ClickableTableRow({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <TableRow className={cn("cursor-pointer", className)} onDoubleClick={() => router.push(href)}>
      {children}
    </TableRow>
  );
}
