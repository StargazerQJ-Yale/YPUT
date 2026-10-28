import "server-only";

import Groq from "groq-sdk";
import { extractJsonBlock } from "@/lib/ai-json";

// Plain text summarization, not vision — matches the default offered for
// guest research (lib/groq-models.ts).
const NOTES_MODEL = "openai/gpt-oss-120b";

export type GuestExportNotes = { notes: string; notesForSt: string };

const EMPTY_NOTES: GuestExportNotes = { notes: "", notesForSt: "" };

/** Drafts the two free-text columns a treasurer hand-writes on the guest
 * expense summary sheet (what the money covered, and a short handoff note
 * for the next treasurer). Only the wording is AI-generated — every other
 * column (name, date, amounts, total) is computed directly from the
 * database. Returns blank strings (never throws) so a slow/failed draft
 * doesn't block the export; the sheet is just left for manual fill-in. */
export async function draftGuestExportNotes(
  guestName: string,
  resolution: string | null,
  items: { label: string; amount: number; status: string }[],
): Promise<GuestExportNotes> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || items.length === 0) return EMPTY_NOTES;

  const itemList = items
    .map((i) => `- ${i.label}: $${i.amount.toFixed(2)} (${i.status})`)
    .join("\n");

  const prompt = `You are a student treasurer's assistant drafting two short notes for a guest-speaker expense summary spreadsheet, based only on the line items below. Do not invent any fact not implied by the data (no made-up logistics, opinions, or trivia about the guest).

Guest: "${guestName}"
${resolution ? `Debate resolution: "${resolution}"` : ""}
Expense line items:
${itemList}

Write:
- "notes": one short phrase (under 12 words) summarizing what the money covered, e.g. "Hotel, travel, and dinner for the visit" — infer the category from each item's label.
- "notesForSt": one short sentence (under 20 words) handing this off to the next treasurer — mention whether any item's status above is still pending/unpaid, based only on the statuses given (say "all paid" only if every item's status says so).

Respond with ONLY a fenced json code block in exactly this shape, no other text outside the block:
\`\`\`json
{
  "notes": "string",
  "notesForSt": "string"
}
\`\`\``;

  try {
    const client = new Groq({ apiKey });
    const completion = await client.chat.completions.create({
      model: NOTES_MODEL,
      messages: [{ role: "user", content: prompt }],
    });
    const text = completion.choices[0]?.message?.content ?? "";
    const parsed = extractJsonBlock(text) as Partial<GuestExportNotes> | null;
    if (!parsed) return EMPTY_NOTES;
    return {
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
      notesForSt: typeof parsed.notesForSt === "string" ? parsed.notesForSt : "",
    };
  } catch (error) {
    console.error("Guest export notes draft failed:", error);
    return EMPTY_NOTES;
  }
}
