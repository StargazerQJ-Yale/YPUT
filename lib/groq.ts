import "server-only";

import Groq from "groq-sdk";
import type { GroqModel } from "@/lib/groq-models";
import { searchWeb } from "@/lib/tavily";
import { extractJsonBlock } from "@/lib/ai-json";

export type LectureshipOption = {
  id: string;
  name: string;
  purpose: string;
};

export type GuestResearchResult = {
  summary: string;
  matchedLectureshipId: string | null;
  reasoning: string | null;
};

/** Researches a guest's public background via Groq, optionally grounded in
 * live Tavily web search results (Groq has no built-in search/grounding tool,
 * unlike Gemini — so when `useWebSearch` is on, we fetch real results
 * ourselves and hand them to the model as context), then asks it to pick the
 * best-fitting lectureship fund from the supplied list. Falls back to
 * returning the raw text as the summary (with no match) if the model's
 * output can't be parsed, rather than throwing. */
export async function researchGuestAndMatchLectureship(
  guestName: string,
  lectureships: LectureshipOption[],
  options: { model: GroqModel; useWebSearch?: boolean },
): Promise<GuestResearchResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const client = new Groq({ apiKey });

  const fundList = lectureships
    .map((fund) => `- id: ${fund.id}\n  name: ${fund.name}\n  purpose: ${fund.purpose}`)
    .join("\n");

  let searchContext = "";
  if (options.useWebSearch) {
    try {
      const results = await searchWeb(guestName);
      if (results.length > 0) {
        searchContext = `\nLive web search results for "${guestName}":\n${results
          .map((r, i) => `${i + 1}. ${r.title} (${r.url})\n   ${r.content}`)
          .join("\n")}\n`;
      }
    } catch (error) {
      console.error("Tavily search failed, falling back to knowledge-only research:", error);
    }
  }

  const researchInstruction = searchContext
    ? `Use the live web search results below (not just your own training data) to research this person, since they may include recent or obscure information you don't already know.\n${searchContext}`
    : `Based on what you already know about this person (no live web search available — say so plainly in the summary if you're not confident who they are), describe their occupation, notable work, and any connection to journalism, literature, public affairs, government, letter writing, or Harvard.`;

  const prompt = `You are helping a Yale student organization pick the right lectureship fund to request reimbursement for a guest speaker's costs (travel, dinner, etc.).

Guest name: "${guestName}"

${researchInstruction}

Describe their occupation, notable work, and any connection to journalism, literature, public affairs, government, letter writing, or Harvard.

Available lectureship funds (pick the single best fit by id):
${fundList}

Priority rule: if the guest is a current Harvard student, a former Harvard student (any degree,
graduated or not), or Harvard faculty, prefer matching them to the Harvard Lectureship over any
other fund (including catch-all funds like "any topic" that technically also apply) — Harvard is
the rarest fund to have a legitimate match for, so use it whenever it genuinely fits, rather than
defaulting to a broader fund.

Respond with ONLY a fenced json code block in exactly this shape, no other text outside the block:
\`\`\`json
{
  "summary": "2-3 sentence summary of who this person is, based on what you know",
  "matchedLectureshipId": "the id of the best-fitting fund, or null if none fit well",
  "reasoning": "1-2 sentences on why this fund fits, referencing their background"
}
\`\`\``;

  const completion = await client.chat.completions.create({
    model: options.model,
    messages: [{ role: "user", content: prompt }],
  });

  const text = completion.choices[0]?.message?.content ?? "";
  const parsed = extractJsonBlock(text) as Partial<GuestResearchResult> | null;

  if (!parsed || typeof parsed.summary !== "string") {
    return { summary: text || "No research summary was returned.", matchedLectureshipId: null, reasoning: null };
  }

  const matchedId = lectureships.some((f) => f.id === parsed.matchedLectureshipId)
    ? (parsed.matchedLectureshipId as string)
    : null;

  return {
    summary: parsed.summary,
    matchedLectureshipId: matchedId,
    reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : null,
  };
}
