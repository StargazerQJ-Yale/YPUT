// Shared by lib/groq.ts and lib/receipt-scan.ts: both prompt-engineer a
// fenced ```json code block out of a chat model instead of relying on
// provider-specific structured-output modes (which don't compose reliably
// with Groq's vision models). Not server-only — pure string parsing.
export function extractJsonBlock(text: string): unknown | null {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/i) ?? text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[1] ?? match[0]);
  } catch {
    return null;
  }
}
