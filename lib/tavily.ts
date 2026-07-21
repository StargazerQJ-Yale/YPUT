import "server-only";

export type TavilySearchResult = {
  title: string;
  url: string;
  content: string;
};

/** Live web search via Tavily (free tier, no card required) — used to ground
 * the guest research feature in real, current results instead of relying
 * solely on the model's training data. Returns an empty array (rather than
 * throwing) on any failure, so callers can fall back to knowledge-only
 * research instead of failing the whole action. */
export async function searchWeb(query: string, maxResults = 5): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not set");
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: maxResults,
      include_answer: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed (${response.status})`);
  }

  const data = await response.json();
  const results = Array.isArray(data.results) ? data.results : [];

  return results.map((r: { title?: string; url?: string; content?: string }) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    content: r.content ?? "",
  }));
}
