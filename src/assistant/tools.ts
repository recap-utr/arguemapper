import * as arguebuf from "arguebuf";
import { z } from "zod";
import {
  codecs,
  describeIssue,
  type Graph,
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

/** Access to the graph that the tools read and edit, e.g. the store of an editor or a file. */
export interface GraphSession {
  read(): GraphState | Promise<GraphState>;
  /** Store the edited graph, the changes name the elements that the edit created and removed. */
  write(
    graph: Graph,
    changes: Pick<arguebuf.PatchResult<Schema>, "created" | "removed">,
  ): void | Promise<void>;
}

/** The patch of arguebuf with the explanations of the assistant. */
const graphEditSchema = arguebuf.patchSchema.extend({
  explanations: z
    .record(z.string(), z.string())
    .default({})
    .describe("Short reasons for the atoms and schemes of this edit, keyed by their id."),
});

/** Issues as compact lines, the ids of the elements are part of the message. */
const report = (issues: readonly arguebuf.Issue[]): string[] =>
  issues.map(
    (issue) =>
      `${issue.severity} ${issue.code}${issue.path === undefined ? "" : ` at ${issue.path.join(".")}`}: ${describeIssue(issue)}`,
  );

const failure = (issues: readonly arguebuf.Issue[]): Error =>
  new Error(`The graph was not changed:\n${report(issues).join("\n")}`);

/** Tools that read and edit the graph of the session, edited nodes record the provenance. */
export function graphTools(session: GraphSession, provenance: Provenance): AssistantTools {
  return {
    readResource: defineTool({
      description: "Read the full text of a single resource by id.",
      inputSchema: z.object({ id: z.string().describe("The id of the resource to read") }),
      execute: async ({ id }) => {
        const resource = (await session.read()).graph.resources[id];

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
        "Read the argument graph: resources (without text), the resource selected by the analyst, participants, atoms, schemes, the major claim, and the issues of the graph. Call this before editing the graph.",
      inputSchema: z.object({}),
      execute: async () => {
        const { graph, selectedResource } = await session.read();

        return {
          ...arguebuf.outline(graph),
          selectedResource: shownResource(graph, selectedResource),
          issues: report(arguebuf.check(graph)),
        };
      },
    }),

    editGraph: defineTool({
      description:
        "Change the graph in one call. If it fails, nothing was changed: fix the items its errors name and call it again. Warnings and the remaining issues of the graph are returned on success.",
      inputSchema: graphEditSchema,
      execute: async ({ explanations, ...patch }) => {
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

        return { issues: report([...result.issues, ...arguebuf.check(next)]) };
      },
    }),
  };
}
