import { z } from "zod";

export const PAYMENT_METHOD_OPTIONS = [
  { value: "VENMO", label: "Venmo" },
  { value: "ZELLE", label: "Zelle" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
] as const;

export const reimbursementFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(200),
  email: z.string().trim().email("Enter a valid email"),
  amount: z.coerce.number({ error: "Enter a valid amount" }).positive("Amount must be greater than 0"),
  budgetAreaId: z.string().min(1, "Select a budget area"),
  budgetItemId: z.string().min(1, "Select a budget category"),
  description: z.string().trim().min(1, "Description is required").max(2000),
  eventName: z.string().trim().max(200).optional().or(z.literal("")),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  paymentMethod: z.enum(["VENMO", "ZELLE", "BANK_TRANSFER"], {
    error: "Select a payment method",
  }),
  paymentHandle: z.string().trim().min(1, "Payment handle is required").max(200),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ReimbursementFormValues = z.infer<typeof reimbursementFormSchema>;
