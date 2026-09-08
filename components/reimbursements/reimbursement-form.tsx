"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createReceiptUploadUrl } from "@/lib/actions/receipt-upload";
import { scanReceipt } from "@/lib/actions/receipt-scan";
import { createClient } from "@/lib/supabase/client";

// Downscales an image client-side before sending it to the AI scan action —
// keeps the request comfortably under Vercel's ~4.5MB function payload cap
// regardless of how large the original phone-camera photo is (Groq doesn't
// need full resolution to read receipt text either).
async function downscaleImageForScan(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

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
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitReimbursement, initialState);

  React.useEffect(() => {
    if (state.success && state.reimbursementId) {
      router.push(`/reimbursements/${state.reimbursementId}`);
    }
  }, [state, router]);
  const [selectedAreaId, setSelectedAreaId] = React.useState<string>(
    () => state.values?.budgetAreaId ?? "",
  );
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  const [scanning, startScanning] = useTransition();
  const [uploading, setUploading] = React.useState(false);
  const [confirmedNotified, setConfirmedNotified] = React.useState(false);
  // Tracked in state (rather than left as plain defaultValue inputs) so the
  // submit button's enabled state can require them directly, on top of the
  // native `required` attributes — the checkbox above must never become the
  // only thing gating submission.
  const [fullName, setFullName] = React.useState(defaultFullName);
  const [email, setEmail] = React.useState(defaultEmail);
  const [amount, setAmount] = React.useState(state.values?.amount ?? "");
  const [purchaseDate, setPurchaseDate] = React.useState(state.values?.purchaseDate ?? "");
  const [paymentMethod, setPaymentMethod] = React.useState(state.values?.paymentMethod ?? "");
  const [paymentHandle, setPaymentHandle] = React.useState(state.values?.paymentHandle ?? "");
  const eventNameRef = React.useRef<HTMLInputElement>(null);
  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);

  const selectedArea = budgetAreas.find((a) => a.id === selectedAreaId);

  const coreFieldsFilled =
    fullName.trim() !== "" &&
    email.trim() !== "" &&
    Number(amount) > 0 &&
    purchaseDate.trim() !== "" &&
    paymentMethod.trim() !== "" &&
    paymentHandle.trim() !== "";
  const canSubmit = confirmedNotified && !!receiptFile && coreFieldsFilled;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (receiptFile) {
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
    }
    formData.delete("receipt");
    formAction(formData);
  }

  function handleScanReceipt() {
    if (!receiptFile) return;
    startScanning(async () => {
      let fileToSend = receiptFile;
      if (receiptFile.type === "application/pdf") {
        if (receiptFile.size > 4 * 1024 * 1024) {
          toast.error("This PDF is too large to auto-scan — please fill in the details manually.");
          return;
        }
      } else {
        try {
          fileToSend = await downscaleImageForScan(receiptFile);
        } catch {
          // fall back to the original file if downscaling fails for any reason
        }
      }

      const formData = new FormData();
      formData.append("receipt", fileToSend);
      const result = await scanReceipt(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (!result.amount && !result.purchaseDate && !result.vendor && !result.description) {
        toast.error("Couldn't make out any details from this receipt — please fill in manually.");
        return;
      }

      if (result.amount != null) {
        setAmount(String(result.amount));
      }
      if (result.purchaseDate) {
        setPurchaseDate(result.purchaseDate);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {state.formError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.formError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1.5"
            required
          />
          <FieldError messages={state.fieldErrors?.fullName} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
            required
          />
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
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-6"
              required
            />
          </div>
          <FieldError messages={state.fieldErrors?.amount} />
        </div>
        <div>
          <Label htmlFor="purchaseDate">Date of Purchase</Label>
          <Input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="mt-1.5"
            required
          />
          <FieldError messages={state.fieldErrors?.purchaseDate} />
        </div>
      </div>

      <div>
        <Label>Receipt (required)</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          A receipt is required for every reimbursement — we use it to verify and keep a record of
          all spending. Requests without one can&apos;t be processed.
        </p>
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
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value ?? "")}
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
            value={paymentHandle}
            onChange={(e) => setPaymentHandle(e.target.value)}
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

      <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
        <Checkbox
          id="confirmedNotified"
          checked={confirmedNotified}
          onCheckedChange={(checked) => setConfirmedNotified(checked === true)}
          className="mt-0.5"
        />
        <Label htmlFor="confirmedNotified" className="text-sm font-normal leading-snug">
          I have checked with or notified the Treasurer, or President before making this
          purchase. <span className="font-medium">Unnotified purchases may not be refunded.</span>
        </Label>
      </div>

      <Button
        type="submit"
        disabled={pending || uploading || !canSubmit || state.success}
        size="lg"
        className="w-full sm:w-auto"
      >
        {(pending || uploading || state.success) && <Loader2 className="size-4 animate-spin" />}
        {uploading ? "Uploading receipt..." : state.success ? "Redirecting..." : "Submit Reimbursement"}
      </Button>
    </form>
  );
}
