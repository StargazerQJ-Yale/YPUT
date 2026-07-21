// Kept separate from lib/groq.ts (which has `import "server-only"`) so
// client components can import these plain constants without pulling in
// server-only code.

export const GROQ_MODEL_OPTIONS = [
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (default)" },
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B (fastest, lightest)" },
  { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B (most capable)" },
] as const;

export type GroqModel = (typeof GROQ_MODEL_OPTIONS)[number]["value"];
