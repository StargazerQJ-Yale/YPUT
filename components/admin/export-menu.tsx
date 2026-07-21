"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ExportMenu({ href, label = "Export" }: { href: string; label?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <Download className="size-3.5" />
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<a href={`${href}?format=csv`} download />}>CSV</DropdownMenuItem>
        <DropdownMenuItem render={<a href={`${href}?format=xlsx`} download />}>Excel</DropdownMenuItem>
        <DropdownMenuItem render={<a href={`${href}?format=pdf`} download />}>PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
