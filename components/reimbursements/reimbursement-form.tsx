"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDropzone } from "@/components/shared/file-dropzone";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/validations/reimbursement";
import { submitReimbursement, type SubmitReimbursementState } from "@/lib/actions/reimbursements";
import { scanReceipt } from "@/lib/actions/receipt-scan";

type BudgetArea = {
  id: string;
  name: string;
  budgetItems: { id: string; name: string }[];
};

const initialState: SubmitReimbursementState = {};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1.5 text-sm text-destructive">{messages[0]}</p>;
}

export function ReimbursementForm({
  budgetAreas,
  defaultFullName,
  defaultEmail,
}: {
  budgetAreas: BudgetArea[];
  defaultFullName: string;
  defaultEmail: string;
}) {
  const [state, formAction, pending] = useActionState(submitReimbursement, initialState);
  const [selectedAreaId, setSelectedAreaId] = React.useState<string>(
    () => state.values?.budgetAreaId ?? "",
  );
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  const [scanning, startScanning] = useTransition();
  const amountRef = React.useRef<HTMLInputElement>(null);
  const purchaseDateRef = React.useRef<HTMLInputElement>(null);
  const eventNameRef = React.useRef<HTMLInputElement>(null);
  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);

  const selectedArea = budgetAreas.find((a) => a.id === selectedAreaId);

  function handleScanReceipt() {
    if (!receiptFile) return;
    startScanning(async () => {
      const formData = new FormData();
      formData.append("receipt", receiptFile);
      const result = await scanReceipt(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (!result.amount && !result.purchaseDate && !result.vendor && !result.description) {
        toast.error("Couldn't make out any details from this receipt — please fill in manually.");
        return;
      }

      if (result.amount != null && amountRef.current) {
        amountRef.current.value = String(result.amount);
      }
      if (result.purchaseDate && purchaseDateRef.current) {
        purchaseDateRef.current.value = result.purchaseDate;
      }
      if (result.vendor && eventNameRef.current && !eventNameRef.current.value) {
        eventNameRef.current.value = result.vendor;
      }
      if (result.description && descriptionRef.current && !descriptionRef.current.value) {
        descriptionRef.current.value = result.description;
      }
      toast.success("Auto-filled from the receipt — please double-check before submitting");
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.formError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.formError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" name="fullName" defaultValue={defaultFullName} className="mt-1.5" required />
          <FieldError messages={state.fieldErrors?.fullName} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultEmail} className="mt-1.5" required />
          <FieldError messages={state.fieldErrors?.email} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              ref={amountRef}
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={state.values?.amount ?? ""}
              className="pl-6"
              required
            />
          </div>
          <FieldError messages={state.fieldErrors?.amount} />
        </div>
        <div>
          <Label htmlFor="purchaseDate">Date of Purchase</Label>
          <Input
            ref={purchaseDateRef}
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            defaultValue={state.values?.purchaseDate ?? ""}
            className="mt-1.5"
            required
          />
          <FieldError messages={state.fieldErrors?.purchaseDate} />
        </div>
      </div>

      <div>
        <Label>Receipt</Label>
        <div className="mt-1.5 space-y-2">
          <FileDropzone
            name="receipt"
            error={state.fieldErrors?.receipt?.[0]}
            onFileChange={setReceiptFile}
          />
          {receiptFile && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={scanning}
              onClick={handleScanReceipt}
            >
              {scanning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Scan Receipt with AI
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Optional — reads the amount, date, and description off your receipt so you don&apos;t
            have to type them. Always double-check before submitting.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="budgetAreaId">Budget Area</Label>
          <Select
            name="budgetAreaId"
            value={selectedAreaId}
            onValueChange={(value) => setSelectedAreaId(value ?? "")}
            items={budgetAreas.map((area) => ({ value: area.id, label: area.name }))}
          >
            <SelectTrigger id="budgetAreaId" className="mt-1.5 w-full">
              <SelectValue placeholder="Select a budget area" />
            </SelectTrigger>
            <SelectContent>
              {budgetAreas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError messages={state.fieldErrors?.budgetAreaId} />
        </div>
        <div>
          <Label htmlFor="budgetItemId">Specific Budget Category</Label>
          <Select
            name="budgetItemId"
            disabled={!selectedArea}
            key={selectedAreaId}
            defaultValue={state.values?.budgetItemId}
            items={selectedArea?.budgetItems.map((item) => ({ value: item.id, label: item.name })) ?? []}
          >
            <SelectTrigger id="budgetItemId" className="mt-1.5 w-full">
              <SelectValue placeholder={selectedArea ? "Select a category" : "Select a budget area first"} />
            </SelectTrigger>
            <SelectContent>
              {selectedArea?.budgetItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError messages={state.fieldErrors?.budgetItemId} />
        </div>
      </div>

      <div>
        <Label htmlFor="eventName">Event Name (optional)</Label>
        <Input
          ref={eventNameRef}
          id="eventName"
          name="eventName"
          defaultValue={state.values?.eventName ?? ""}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          ref={descriptionRef}
          id="description"
          name="description"
          defaultValue={state.values?.description ?? ""}
          className="mt-1.5"
          rows={3}
          required
        />
        <FieldError messages={state.fieldErrors?.description} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select
            name="paymentMethod"
            defaultValue={state.values?.paymentMethod}
            items={PAYMENT_METHOD_OPTIONS}
          >
            <SelectTrigger id="paymentMethod" className="mt-1.5 w-full">
              <SelectValue placeholder="Select a payment method" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError messages={state.fieldErrors?.paymentMethod} />
        </div>
        <div>
          <Label htmlFor="paymentHandle">Payment Handle</Label>
          <Input
            id="paymentHandle"
            name="paymentHandle"
            placeholder="@venmo-handle, phone, or account info"
            defaultValue={state.values?.paymentHandle ?? ""}
            className="mt-1.5"
            required
          />
          <FieldError messages={state.fieldErrors?.paymentHandle} />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Additional Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={state.values?.notes ?? ""}
          className="mt-1.5"
          rows={2}
        />
      </div>

      <Button type="submit" disabled={pending} size="lg" className="w-full sm:w-auto">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Submit Reimbursement
      </Button>
    </form>
  );
}
