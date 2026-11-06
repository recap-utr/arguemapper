import { jsonSchema, tool, type ToolSet } from "ai";
import * as arguebuf from "arguebuf";
import { z } from "zod";
import * as model from "@/model.js";
import type { ArgueStore, AssistantConfig } from "@/store.js";

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

function wikipediaApiPath(language: string, path: string, params?: Record<string, string>): string {
  const query = params === undefined ? "" : `?${new URLSearchParams(params).toString()}`;
  return `/api/wikipedia/core/v1/wikipedia/${language}/${path}${query}`;
}

function wikipediaArticleUrl(language: string, title: string): string {
  return `https://${language}.wikipedia.org/wiki/${encodeWikipediaTitle(title)}`;
}

function wikipediaKey(title: string): string {
  return title.trim().replaceAll(" ", "_");
}

function encodeWikipediaTitle(title: string): string {
  return encodeURIComponent(wikipediaKey(title));
}

function absoluteUrl(url: string | undefined): string | undefined {
  if (url === undefined) return undefined;
  // Resolves protocol-relative URLs such as //upload.wikimedia.org/… to https.
  return URL.parse(url, "https://wikipedia.org")?.href;
}

/** The patch of arguebuf with the explanations of the assistant. */
type GraphEdit = arguebuf.Patch & { readonly explanations?: Readonly<Record<string, string>> };

const graphEditSchema: arguebuf.JsonSchema = {
  ...arguebuf.patchSchema,
  properties: {
    ...arguebuf.patchSchema.properties,
    explanations: {
      type: "object",
      additionalProperties: { type: "string" },
      description: "Short reasons for the atoms and schemes of this edit, keyed by their id.",
    },
  },
};

/** Issues as compact lines for the assistant, the ids of the elements are part of the message. */
const report = (issues: readonly arguebuf.Issue[]): string[] =>
  issues.map(
    ({ code, severity, message, hint, path }) =>
      `${severity} ${code}${path === undefined ? "" : ` at ${path.join(".")}`}: ${message}${hint === undefined ? "" : ` ${hint}`}`,
  );

/** Error for the assistant listing the issues, the AI SDK passes its message to the model. */
const failure = (issues: readonly arguebuf.Issue[]): Error =>
  new Error(`The graph was not changed:\n${report(issues).join("\n")}`);

/** Fetch JSON from the Wikipedia proxy, failing with the reason of the response. */
async function fetchWikipediaJson<S extends z.ZodType>(
  schema: S,
  path: string,
  signal: AbortSignal | undefined,
): Promise<z.output<S>> {
  const response = await fetch(path, { headers: { Accept: "application/json" }, signal });

  if (!response.ok) {
    throw new Error(`Wikipedia request failed: ${response.statusText} (${response.status}).`);
  }

  return schema.parse(await response.json());
}

/**
 * Build the assistant tools bound to a specific instance's store,
 * the config is recorded as provenance of the edited nodes.
 * The return type is explicit, as the library build requires declarations without inference.
 */
export function createTools(store: ArgueStore, config: AssistantConfig): ToolSet {
  const { getState } = store;

  return {
    searchWikipedia: tool({
      description:
        "Search Wikipedia articles by query in any language, such as en, de, simple or be-tarask. Use the returned key with fetchWikipedia.",
      inputSchema: z.object({
        query: z.string().trim().min(1).describe("Search phrase"),
        language: wikipediaLanguage.default("en").describe("Wikipedia language code."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .default(5)
          .describe("Maximum number of results."),
      }),
      execute: async ({ query, language, limit }, { abortSignal }) => {
        const data = await fetchWikipediaJson(
          searchPages,
          wikipediaApiPath(language, "search/page", { q: query, limit: String(limit) }),
          abortSignal,
        );

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
              url: key.length === 0 ? undefined : wikipediaArticleUrl(language, key),
              thumbnail: page.thumbnail && {
                ...page.thumbnail,
                url: absoluteUrl(page.thumbnail.url),
              },
            };
          }),
        };
      },
    }),

    fetchWikipedia: tool({
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
      execute: async ({ title, language }, { abortSignal }) => {
        const data = await fetchWikipediaJson(
          pageSource,
          wikipediaApiPath(language, `page/${encodeWikipediaTitle(title)}`),
          abortSignal,
        );

        return {
          language,
          id: data.id,
          key: data.key ?? wikipediaKey(title),
          title: data.title ?? title,
          url: wikipediaArticleUrl(language, data.key ?? title),
          latest: data.latest,
          license: data.license,
          contentModel: data.content_model,
          source: data.source ?? "",
        };
      },
    }),

    readResource: tool({
      description: "Read the full text of a single resource by id.",
      inputSchema: z.object({ id: z.string().describe("The id of the resource to read") }),
      execute: async ({ id }) => {
        const resource = getState().graph.resources[id];

        if (resource === undefined) {
          throw new Error(`No resource with id "${id}".`);
        }

        return {
          id: resource.id,
          title: resource.title ?? "",
          source: resource.source ?? "",
          text: resource.text,
        };
      },
    }),

    readGraph: tool({
      description:
        "Read the argument graph: resources (without text), the resource selected by the analyst, participants, atoms, schemes, the major claim, and the issues of the graph. Call this before editing the graph.",
      inputSchema: z.object({}),
      execute: async () => {
        const { graph, selectedResource } = getState();

        return {
          ...arguebuf.outline(graph),
          selectedResource: model.shownResource(graph, selectedResource),
          issues: report(arguebuf.check(graph)),
        };
      },
    }),

    editGraph: tool({
      description:
        "Create, update, or remove resources, participants, atoms, schemes, and the major claim in one call. Ids are chosen by you: an item with a new id creates the element, an existing id updates the given fields. The edit is applied all or nothing, errors name the offending item, so fix them and call again. Warnings and the remaining issues of the graph are returned on success.",
      inputSchema: jsonSchema<GraphEdit>(graphEditSchema, {
        validate: (value) => {
          const { patch, issues } = arguebuf.parsePatch<GraphEdit>(value, graphEditSchema);

          return patch === undefined
            ? { success: false, error: failure(issues) }
            : { success: true, value: patch };
        },
      }),
      execute: async ({ explanations = {}, ...patch }) => {
        const state = getState();
        const result = arguebuf.applyPatch(state.graph, patch, { codecs: model.codecs });

        if (arguebuf.hasErrors(result.issues)) {
          throw failure(result.issues);
        }

        const next = result.graph.edit((draft) => {
          for (const id of [...result.created, ...result.updated]) {
            if (Object.hasOwn(draft.nodes, id)) {
              const node = draft.nodes[id];
              const assistant = node.userdata.arguemapper?.assistant;
              model.updateUserdata(
                draft,
                id,
                model.withArguemapper(node, {
                  assistant: {
                    ...assistant,
                    config: { ...config },
                    explanation: explanations[id] ?? assistant?.explanation,
                  },
                }),
              );
            }
          }
        });
        store.setState({
          graph: next,
          shouldLayout:
            state.shouldLayout || result.created.length > 0 || result.removed.length > 0,
        });

        return { issues: report([...result.issues, ...arguebuf.check(next)]) };
      },
    }),
  };
}
