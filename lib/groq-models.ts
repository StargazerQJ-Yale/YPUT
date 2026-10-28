// Kept separate from lib/groq.ts (which has `import "server-only"`) so
// client components can import these plain constants without pulling in
// server-only code.

// Llama 3.1 8B Instant was decommissioned by Groq on 2026-08-16, and Llama
// 3.3 70B Versatile followed on/before 2026-10-28 — both replaced here with
// Groq's GPT-OSS lineup, which remains available.
export const GROQ_MODEL_OPTIONS = [
  { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B (default, most capable)" },
  { value: "openai/gpt-oss-20b", label: "GPT-OSS 20B (fastest, lightest)" },
] as const;

export type GroqModel = (typeof GROQ_MODEL_OPTIONS)[number]["value"];
