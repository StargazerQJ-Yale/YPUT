"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "NEEDS_INFO", label: "Needs Info" },
  { value: "PAID", label: "Paid" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

const ALL = "__all__";

export function ReimbursementsFilterBar({
  budgetAreas,
}: {
  budgetAreas: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = React.useState(searchParams.get("q") ?? "");
  const [status, setStatus] = React.useState(searchParams.get("status") ?? ALL);
  const [budgetAreaId, setBudgetAreaId] = React.useState(searchParams.get("budgetAreaId") ?? ALL);
  const [dateFrom, setDateFrom] = React.useState(searchParams.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = React.useState(searchParams.get("dateTo") ?? "");
  const [amountMin, setAmountMin] = React.useState(searchParams.get("amountMin") ?? "");
  const [amountMax, setAmountMax] = React.useState(searchParams.get("amountMax") ?? "");

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status !== ALL) params.set("status", status);
    if (budgetAreaId !== ALL) params.set("budgetAreaId", budgetAreaId);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (amountMin) params.set("amountMin", amountMin);
    if (amountMax) params.set("amountMax", amountMax);
    router.push(`/admin/reimbursements${params.toString() ? `?${params}` : ""}`);
  }

  function reset() {
    setQ("");
    setStatus(ALL);
    setBudgetAreaId(ALL);
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    router.push("/admin/reimbursements");
  }

  return (
    <form onSubmit={apply} className="space-y-3 rounded-xl border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email"
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value ?? ALL)}
          items={[{ value: ALL, label: "All statuses" }, ...STATUS_OPTIONS]}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={budgetAreaId}
          onValueChange={(value) => setBudgetAreaId(value ?? ALL)}
          items={[
            { value: ALL, label: "All budget areas" },
            ...budgetAreas.map((area) => ({ value: area.id, label: area.name })),
          ]}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Budget area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All budget areas</SelectItem>
            {budgetAreas.map((area) => (
              <SelectItem key={area.id} value={area.id}>
                {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
          <span className="text-sm text-muted-foreground">to</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min $"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="Max $"
            value={amountMax}
            onChange={(e) => setAmountMax(e.target.value)}
            className="w-24"
          />
        </div>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            <X className="size-4" />
            Clear
          </Button>
          <Button type="submit" size="sm">
            Apply Filters
          </Button>
        </div>
      </div>
    </form>
  );
}
