import "server-only";

import Groq from "groq-sdk";
import { extractJsonBlock } from "@/lib/ai-json";

// Groq's current vision-capable model (accepts image_url content parts,
// OpenAI-compatible). Free tier, same key as lib/groq.ts.
const RECEIPT_SCAN_MODEL = "qwen/qwen3.6-27b";

export type ReceiptScanResult = {
  amount: number | null;
  purchaseDate: string | null;
  vendor: string | null;
  description: string | null;
};

const EMPTY_RESULT: ReceiptScanResult = {
  amount: null,
  purchaseDate: null,
  vendor: null,
  description: null,
};

/** Reads a receipt image and extracts the fields a reimbursement form needs,
 * so a member can review/adjust auto-filled values instead of typing them
 * all by hand. Returns all-null (never throws) if the model's output can't
 * be parsed, so the form just falls back to manual entry. */
export async function scanReceiptImage(
  imageBase64: string,
  mimeType: string,
): Promise<ReceiptScanResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const client = new Groq({ apiKey });

  const prompt = `You are extracting structured data from a photo or scan of a purchase receipt, for a reimbursement request form.

Look at the receipt and identify:
- The total amount paid (just the number, no currency symbol)
- The date of purchase
- The vendor/merchant name
- A short 1-sentence description of what was purchased (e.g. "Dinner for guest speaker at Example Restaurant")

If the receipt is unclear or a field isn't visible, use null for that field rather than guessing.

Respond with ONLY a fenced json code block in exactly this shape, no other text outside the block:
\`\`\`json
{
  "amount": 42.50,
  "purchaseDate": "YYYY-MM-DD",
  "vendor": "string or null",
  "description": "string or null"
}
\`\`\``;

  const completion = await client.chat.completions.create({
    model: RECEIPT_SCAN_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "";
  const parsed = extractJsonBlock(text) as Partial<ReceiptScanResult> | null;
  if (!parsed) return EMPTY_RESULT;

  return {
    amount: typeof parsed.amount === "number" ? parsed.amount : null,
    purchaseDate: typeof parsed.purchaseDate === "string" ? parsed.purchaseDate : null,
    vendor: typeof parsed.vendor === "string" ? parsed.vendor : null,
    description: typeof parsed.description === "string" ? parsed.description : null,
  };
}
