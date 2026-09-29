"use client";

import * as React from "react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
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
import { addGuestExpense, type ActionResult } from "@/lib/actions/guests";
import { createReceiptUploadUrl } from "@/lib/actions/receipt-upload";
import { createClient } from "@/lib/supabase/client";

type BudgetArea = {
  id: string;
  name: string;
  budgetItems: { id: string; name: string }[];
};

export function GuestExpenseForm({
  guestId,
  budgetAreas,
}: {
  guestId: string;
  budgetAreas: BudgetArea[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    addGuestExpense.bind(null, guestId),
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedAreaId, setSelectedAreaId] = React.useState("");
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state?.success) {
      toast.success("Expense added");
      formRef.current?.reset();
      setSelectedAreaId("");
      setReceiptFile(null);
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state]);

  const selectedArea = budgetAreas.find((a) => a.id === selectedAreaId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!receiptFile) {
      toast.error("Upload a receipt image or PDF.");
      return;
    }

    setUploading(true);
    const uploadUrlResult = await createReceiptUploadUrl(receiptFile.name);
    if (!uploadUrlResult.success) {
      toast.error(uploadUrlResult.error);
      setUploading(false);
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.storage
      .from(uploadUrlResult.bucket)
      .uploadToSignedUrl(uploadUrlResult.path, uploadUrlResult.token, receiptFile, {
        contentType: receiptFile.type,
      });
    setUploading(false);
    if (error) {
      toast.error("Failed to upload the receipt. Please try again.");
      return;
    }
    formData.set("receiptPath", uploadUrlResult.path);
    formData.set("receiptName", receiptFile.name);
    formData.delete("receipt");
    formAction(formData);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">
        For a cost already covered — a receipt handed over after the fact. Records it as paid
        immediately, same as marking any other reimbursement paid.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="guest-expense-fullName">Payee Name</Label>
          <Input id="guest-expense-fullName" name="fullName" className="mt-1.5" required />
        </div>
        <div>
          <Label htmlFor="guest-expense-email">Payee Email</Label>
          <Input id="guest-expense-email" name="email" type="email" className="mt-1.5" required />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="guest-expense-amount">Amount</Label>
          <Input
            id="guest-expense-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            className="mt-1.5"
            required
          />
        </div>
        <div>
          <Label htmlFor="guest-expense-purchaseDate">Date of Purchase</Label>
          <Input
            id="guest-expense-purchaseDate"
            name="purchaseDate"
            type="date"
            defaultValue={today}
            className="mt-1.5"
            required
          />
        </div>
      </div>

      <div>
        <Label>Receipt / Photo (required)</Label>
        <div className="mt-1.5">
          <FileDropzone name="receipt" onFileChange={setReceiptFile} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="guest-expense-budgetArea">Budget Area</Label>
          <Select
            value={selectedAreaId}
            onValueChange={(value) => setSelectedAreaId(value ?? "")}
            items={budgetAreas.map((area) => ({ value: area.id, label: area.name }))}
          >
            <SelectTrigger id="guest-expense-budgetArea" className="mt-1.5 w-full">
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
        </div>
        <div>
          <Label htmlFor="guest-expense-budgetItem">Specific Budget Category</Label>
          <Select
            name="budgetItemId"
            disabled={!selectedArea}
            key={selectedAreaId}
            items={selectedArea?.budgetItems.map((item) => ({ value: item.id, label: item.name })) ?? []}
          >
            <SelectTrigger id="guest-expense-budgetItem" className="mt-1.5 w-full">
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
        </div>
      </div>

      <div>
        <Label htmlFor="guest-expense-eventName">Event Name (optional — defaults to the guest&apos;s name)</Label>
        <Input id="guest-expense-eventName" name="eventName" className="mt-1.5" />
      </div>

      <div>
        <Label htmlFor="guest-expense-description">Description</Label>
        <Textarea id="guest-expense-description" name="description" className="mt-1.5" rows={2} required />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="guest-expense-paymentMethod">Payment Method</Label>
          <Select name="paymentMethod" items={PAYMENT_METHOD_OPTIONS}>
            <SelectTrigger id="guest-expense-paymentMethod" className="mt-1.5 w-full">
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
        </div>
        <div>
          <Label htmlFor="guest-expense-paymentHandle">Payment Handle</Label>
          <Input
            id="guest-expense-paymentHandle"
            name="paymentHandle"
            placeholder="@venmo-handle, phone, or account info"
            className="mt-1.5"
            required
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="guest-expense-paidDate">Date Paid</Label>
          <Input
            id="guest-expense-paidDate"
            name="paidDate"
            type="date"
            defaultValue={today}
            className="mt-1.5"
            required
          />
        </div>
        <div>
          <Label htmlFor="guest-expense-transactionId">Transaction ID</Label>
          <Input id="guest-expense-transactionId" name="transactionId" className="mt-1.5" required />
        </div>
      </div>

      <Button type="submit" disabled={pending || uploading}>
        {pending || uploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        {uploading ? "Uploading receipt..." : "Add Expense"}
      </Button>
    </form>
  );
}
