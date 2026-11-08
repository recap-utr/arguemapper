import { z } from "zod";
import { type AssistantTools, defineTool } from "@/assistant/tools.js";

const wikipediaLanguage = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z][a-z0-9-]{0,31}$/,
    "Use a Wikipedia language code such as en, de, simple or be-tarask.",
  );

const searchPages = z.object({
  pages: z
    .array(
      z.object({
        id: z.number().optional(),
        key: z.string().optional(),
        title: z.string().optional(),
        excerpt: z.string().optional(),
        description: z.string().optional(),
        thumbnail: z
          .object({
            mimetype: z.string().optional(),
            width: z.number().optional(),
            height: z.number().optional(),
            url: z.string().optional(),
          })
          .optional(),
      }),
    )
    .default([]),
});

const pageSource = z.object({
  id: z.number().optional(),
  key: z.string().optional(),
  title: z.string().optional(),
  latest: z.object({ id: z.number().optional(), timestamp: z.string().optional() }).optional(),
  content_model: z.string().optional(),
  license: z.object({ url: z.string().optional(), title: z.string().optional() }).optional(),
  source: z.string().optional(),
});

function articleUrl(language: string, title: string): string {
  return `https://${language}.wikipedia.org/wiki/${encodeTitle(title)}`;
}

function titleKey(title: string): string {
  return title.trim().replaceAll(" ", "_");
}

function encodeTitle(title: string): string {
  return encodeURIComponent(titleKey(title));
}

function absoluteUrl(url: string | undefined): string | undefined {
  if (url === undefined) return undefined;
  // Resolves protocol-relative URLs such as //upload.wikimedia.org/… to https.
  return URL.parse(url, "https://wikipedia.org")?.href;
}

/**
 * Tools that search and fetch Wikipedia articles through the Wikimedia API at the given URL,
 * e.g. https://api.wikimedia.org or a CORS proxy of it in browsers.
 */
export function wikipediaTools(api: string): AssistantTools {
  async function fetchJson<S extends z.ZodType>(
    schema: S,
    language: string,
    path: string,
    signal: AbortSignal | undefined,
  ): Promise<z.output<S>> {
    const response = await fetch(`${api}/core/v1/wikipedia/${language}/${path}`, {
      headers: { Accept: "application/json" },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Wikipedia request failed: ${response.statusText} (${response.status}).`);
    }

    return schema.parse(await response.json());
  }

  return {
    searchWikipedia: defineTool({
      description:
        "Search Wikipedia articles by query in any language, such as en, de, simple or be-tarask. Use the returned key with fetchWikipedia.",
      inputSchema: z.object({
        query: z.string().trim().min(1).describe("Search phrase"),
        language: wikipediaLanguage.default("en").describe("Wikipedia language code."),
        limit: z.number().int().min(1).max(20).default(5).describe("Maximum number of results."),
      }),
      execute: async ({ query, language, limit }, signal) => {
        const params = new URLSearchParams({ q: query, limit: String(limit) });
        const data = await fetchJson(searchPages, language, `search/page?${params}`, signal);

        return {
          language,
          results: data.pages.map((page) => {
            const key = page.key ?? page.title ?? "";
            return {
              id: page.id,
              key,
              title: page.title ?? key,
              description: page.description ?? "",
              excerptHtml: page.excerpt ?? "",
              url: key.length === 0 ? undefined : articleUrl(language, key),
              thumbnail: page.thumbnail && {
                ...page.thumbnail,
                url: absoluteUrl(page.thumbnail.url),
              },
            };
          }),
        };
      },
    }),

    fetchWikipedia: defineTool({
      description:
        "Fetch a Wikipedia article by title or search result key as JSON. Returns article metadata and source wikitext as provided by Wikimedia.",
      inputSchema: z.object({
        title: z
          .string()
          .trim()
          .min(1)
          .describe("Article title or key, preferably from searchWikipedia"),
        language: wikipediaLanguage.default("en").describe("Wikipedia language code."),
      }),
      execute: async ({ title, language }, signal) => {
        const data = await fetchJson(pageSource, language, `page/${encodeTitle(title)}`, signal);

        return {
          language,
          id: data.id,
          key: data.key ?? titleKey(title),
          title: data.title ?? title,
          url: articleUrl(language, data.key ?? title),
          latest: data.latest,
          license: data.license,
          contentModel: data.content_model,
          source: data.source ?? "",
        };
      },
    }),
  };
}
