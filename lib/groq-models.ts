// Kept separate from lib/groq.ts (which has `import "server-only"`) so
// client components can import these plain constants without pulling in
// server-only code.

// Llama 3.1 8B Instant was decommissioned by Groq on 2026-08-16 — replaced
// here with their recommended migration target, GPT-OSS 20B.
export const GROQ_MODEL_OPTIONS = [
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (default)" },
  { value: "openai/gpt-oss-20b", label: "GPT-OSS 20B (fastest, lightest)" },
  { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B (most capable)" },
] as const;

export type GroqModel = (typeof GROQ_MODEL_OPTIONS)[number]["value"];
