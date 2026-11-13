import * as arguebuf from "arguebuf";
import { z } from "zod";
import {
  codecs,
  type Graph,
  graphTitle,
  newGraph,
  type Provenance,
  type Schema,
  shownResource,
  updateUserdata,
  withArguemapper,
} from "@/graph.js";

/**
 * Tool of the assistant, independent of the transport (AI SDK, MCP, WebMCP).
 * Thrown errors are reported to the model, so their message says how to recover.
 */
export interface AssistantTool<S extends z.ZodObject = z.ZodObject> {
  readonly description: string;
  readonly inputSchema: S;
  execute(input: z.output<S>, signal?: AbortSignal): Promise<unknown>;
}

export type AssistantTools = Readonly<Record<string, AssistantTool>>;

/** Infers the input of `execute` from the schema. */
export const defineTool = <S extends z.ZodObject>(tool: AssistantTool<S>): AssistantTool<S> => tool;

export interface GraphState {
  readonly graph: Graph;
  /** Id of the resource shown to the analyst. */
  readonly selectedResource?: string;
}

/** Access to a graph that the tools read and edit, e.g. the store of a tab or a file. */
export interface GraphSession {
  /** Id of the graph within its workspace. */
  readonly id: string;
  read(): GraphState | Promise<GraphState>;
  /** Store the edited graph, the changes name the elements that the edit created and removed. */
  write(
    graph: Graph,
    changes: Pick<arguebuf.PatchResult<Schema>, "created" | "removed">,
  ): void | Promise<void>;
}

/** The graphs that the tools read and edit, e.g. the tabs of an editor or the files of a folder. */
export interface GraphWorkspace {
  /** The open graphs. */
  list(): readonly GraphSession[] | Promise<readonly GraphSession[]>;
  /** The graph with the id, the default graph if it is omitted. Throws if there is none. */
  get(id?: string): GraphSession | Promise<GraphSession>;
  /** Add the graph and return its session, absent if the workspace cannot hold more graphs. */
  readonly add?: (graph: Graph) => GraphSession | Promise<GraphSession>;
}

const graphId = z
  .string()
  .optional()
  .describe("Id of the graph from listGraphs, the graph the analyst works on if omitted.");

/** The patch of arguebuf with the explanations of the assistant. */
const graphEditSchema = arguebuf.patchSchema.extend({
  graph: graphId,
  explanations: z
    .record(z.string(), z.string())
    .default({})
    .describe("Short reasons for the atoms and schemes of this edit, keyed by their id."),
});

/** Issues as compact lines, the ids of the elements are part of the message. */
const report = (issues: readonly arguebuf.Issue[]): string[] =>
  issues.map(
    (issue) =>
      `${issue.severity} ${issue.code}${issue.path === undefined ? "" : ` at ${issue.path.join(".")}`}: ${arguebuf.describeIssue(issue)}`,
  );

const failure = (issues: readonly arguebuf.Issue[]): Error =>
  new Error(`The graph was not changed:\n${report(issues).join("\n")}`);

const count = (graph: Graph, type: "atom" | "scheme"): number =>
  Object.values(graph.nodes).filter((node) => node.type === type).length;

/** Tools that read and edit the graphs of the workspace, edited nodes record the provenance. */
export function graphTools(workspace: GraphWorkspace, provenance: Provenance): AssistantTools {
  const { add } = workspace;
  const tools: AssistantTools = {
    listGraphs: defineTool({
      description:
        "List the open argument graphs with their ids and sizes. Only needed to work on another graph than the one of the analyst.",
      inputSchema: z.object({}),
      execute: async () => {
        const fallback = await Promise.resolve(workspace.get()).then(
          (session) => session.id,
          () => undefined,
        );

        return Promise.all(
          (await workspace.list()).map(async (session) => {
            const { graph } = await session.read();

            return {
              id: session.id,
              title: graphTitle(graph),
              analystWorksOnIt: session.id === fallback,
              resources: Object.keys(graph.resources).length,
              atoms: count(graph, "atom"),
              schemes: count(graph, "scheme"),
            };
          }),
        );
      },
    }),

    readResource: defineTool({
      description: "Read the full text of a single resource by id.",
      inputSchema: z.object({
        id: z.string().describe("The id of the resource to read"),
        graph: graphId,
      }),
      execute: async ({ id, graph }) => {
        const resource = (await (await workspace.get(graph)).read()).graph.resources[id];

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

    readGraph: defineTool({
      description:
        "Read an argument graph: resources (without text), the resource selected by the analyst, participants, atoms, schemes, the major claim, and the issues of the graph. Call this before editing the graph.",
      inputSchema: z.object({ graph: graphId }),
      execute: async ({ graph: target }) => {
        const session = await workspace.get(target);
        const { graph, selectedResource } = await session.read();

        return {
          graph: session.id,
          ...arguebuf.outline(graph),
          selectedResource: shownResource(graph, selectedResource),
          issues: report(arguebuf.check(graph)),
        };
      },
    }),

    editGraph: defineTool({
      description:
        "Change a graph in one call. If it fails, nothing was changed: fix the items its errors name and call it again. Warnings and the remaining issues of the graph are returned on success.",
      inputSchema: graphEditSchema,
      execute: async ({ graph: target, explanations, ...patch }) => {
        const session = await workspace.get(target);
        const { graph } = await session.read();
        const result = arguebuf.applyPatch(graph, patch, { codecs });

        if (arguebuf.hasErrors(result.issues)) {
          throw failure(result.issues);
        }

        const next = result.graph.edit((draft) => {
          for (const id of [...result.created, ...result.updated]) {
            if (Object.hasOwn(draft.nodes, id)) {
              const node = draft.nodes[id];
              const assistant = node.userdata.arguemapper?.assistant;
              updateUserdata(
                draft,
                id,
                withArguemapper(node, {
                  assistant: {
                    ...assistant,
                    config: { ...provenance },
                    explanation: explanations[id] ?? assistant?.explanation,
                  },
                }),
              );
            }
          }
        });
        await session.write(next, result);

        return { graph: session.id, issues: report([...result.issues, ...arguebuf.check(next)]) };
      },
    }),
  };

  if (add === undefined) {
    return tools;
  }

  return {
    ...tools,
    createGraph: defineTool({
      description:
        "Create an empty graph, which the analyst then sees, and return its id to fill it with editGraph. Only create graphs when the analyst asks for a new one.",
      inputSchema: z.object({ name: z.string().describe("Short name of the graph") }),
      execute: async ({ name }) => ({ graph: (await add(newGraph(name))).id }),
    }),
  };
}
