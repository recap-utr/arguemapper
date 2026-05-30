import { tool, type ToolSet } from "ai";
import * as arguebuf from "arguebuf";
import { produce } from "immer";
import { z } from "zod";
import * as model from "../../model.js";
import * as convert from "../convert.js";
import type { ArgueStore, AssistantConfig, State } from "../../store.js";

const schemeType = z.enum(model.schemeCases);

/** Editable profile fields of a participant, shared by the write and edit tools. */
const participantFields = {
  name: z.string().optional().describe("Display name of the participant"),
  username: z.string().optional(),
  email: z.string().optional(),
  url: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
};

/** Build the assistant tool set bound to a specific instance's store. */
export function createTools(store: ArgueStore): ToolSet {
  const { getState, setState } = store;

/** Result envelope shared by every tool so the agent can self-correct on failure. */
type Ok<T> = { ok: true } & T;
type Err = { ok: false; error: string };
const err = (error: string): Err => ({ ok: false, error });

function assistantConfig(): AssistantConfig {
  return getState().assistantConfig;
}

/** Deep-drop `undefined`, which arguebuf serializes userdata to a protobuf Struct that cannot hold. */
function pruned<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Assistant provenance for a node's userdata, free of the undefined values protobuf rejects. */
function assistantUserdata(extra: Record<string, unknown>): { assistant: Record<string, unknown> } {
  return { assistant: pruned({ config: assistantConfig(), ...extra }) };
}

/**
 * Apply a graph mutation only if the result can be serialized. Persistence and the host export path
 * serialize the graph to protobuf, which throws on data it cannot represent (e.g. a malformed value);
 * committing such a graph would crash the app. On failure nothing is applied and an error is returned
 * so the agent can correct its input and try again.
 */
function commit(recipe: (draft: State) => void): Err | undefined {
  const next = produce(getState(), recipe);
  try {
    convert.exportGraph(
      { nodes: next.nodes, edges: next.edges, graph: next.graph },
      "arguebuf",
      next.analyst,
    );
  } catch (error) {
    return err(
      `The change was not applied because it produces an invalid graph: ${
        error instanceof Error ? error.message : String(error)
      }. Adjust the data and try again.`,
    );
  }
  setState(next);
  return undefined;
}

/** Resolve the resource for a reference, defaulting to the currently selected tab. */
function resolveResource(resourceId?: string): arguebuf.Resource | undefined {
  const resources = getState().graph.resources;
  if (resourceId !== undefined) {
    return resources[resourceId];
  }
  return Object.values(resources)[getState().selectedResourceTab];
}

/** Whether `text` occurs verbatim (case-insensitively) in the resource's text. */
function textOccursIn(text: string, resource: arguebuf.Resource | undefined): boolean {
  return resource !== undefined && resource.text.toLowerCase().includes(text.toLowerCase());
}

function buildReference(text: string, resourceId?: string): arguebuf.Reference | undefined {
  const resource = resolveResource(resourceId);
  if (resource === undefined) {
    return undefined;
  }
  const offset = resource.text.toLowerCase().indexOf(text.toLowerCase());
  // A reference must point at real source text: only record one when the text appears verbatim,
  // otherwise the atom carries no reference rather than a dangling one.
  if (offset === -1) {
    return undefined;
  }
  return new arguebuf.Reference({
    text,
    resource: resource.id,
    offset,
  });
}

const atomData = (node: model.Node | undefined): model.AtomNodeData | undefined =>
  node?.data.type === "atom" ? (node.data as model.AtomNodeData) : undefined;

const schemeData = (node: model.Node | undefined): model.SchemeNodeData | undefined =>
  node?.data.type === "scheme" ? (node.data as model.SchemeNodeData) : undefined;

const nodeById = (id: string): model.Node | undefined =>
  getState().nodes.find((node) => node.id === id);

const participantExists = (id: string): boolean =>
  getState().graph.participants[id] !== undefined;

const resourceExists = (id: string): boolean =>
  getState().graph.resources[id] !== undefined;

type SchemeRoles = { premises: string[]; conclusion?: string };

/** Roles of a scheme node with no incident edges; shared read-only fallback. */
const noRoles: SchemeRoles = { premises: [] };

/** Premise node ids (incoming) and the conclusion node id (outgoing) of a single scheme node. */
function schemeRoles(schemeId: string, edges: model.Edge[]): SchemeRoles {
  return {
    premises: edges.filter((e) => e.target === schemeId).map((e) => e.source),
    conclusion: edges.find((e) => e.source === schemeId)?.target,
  };
}

/**
 * Roles for every scheme node, built in a single O(edges) pass. Prefer this over calling
 * schemeRoles in a loop, which rescans the whole edge list once per scheme (O(schemes × edges)).
 */
function rolesByScheme(edges: model.Edge[]): Map<string, SchemeRoles> {
  const roles = new Map<string, SchemeRoles>();
  const entry = (id: string): SchemeRoles => {
    const existing = roles.get(id);
    if (existing !== undefined) return existing;
    const created: SchemeRoles = { premises: [] };
    roles.set(id, created);
    return created;
  };
  for (const edge of edges) {
    entry(edge.target).premises.push(edge.source);
    entry(edge.source).conclusion = edge.target;
  }
  return roles;
}

/** (Re)build the edges of a scheme node so they reflect the given premises and conclusion. */
function wireScheme(draft: State, schemeId: string, premises: string[], conclusion: string) {
  draft.edges = draft.edges.filter((e) => e.source !== schemeId && e.target !== schemeId);
  for (const premise of premises) {
    draft.edges.push(model.initEdge({ source: premise, target: schemeId, data: {} }));
  }
  draft.edges.push(model.initEdge({ source: schemeId, target: conclusion, data: {} }));
}

/** Remove the given nodes and every edge incident to them, clearing a deleted major claim. */
function removeNodes(draft: State, ids: Set<string>) {
  draft.nodes = draft.nodes.filter((node) => !ids.has(node.id));
  draft.edges = draft.edges.filter((edge) => !ids.has(edge.source) && !ids.has(edge.target));
  if (draft.graph.majorClaim !== undefined && ids.has(draft.graph.majorClaim)) {
    draft.graph.majorClaim = undefined;
  }
}

/** Remove scheme nodes left without any premise or without a conclusion, until stable. */
function pruneDanglingSchemes(draft: State) {
  let changed = true;
  while (changed) {
    changed = false;
    const roles = rolesByScheme(draft.edges);
    const dangling = draft.nodes.filter((node) => {
      if (node.data.type !== "scheme") return false;
      const { premises, conclusion } = roles.get(node.id) ?? noRoles;
      return premises.length === 0 || conclusion === undefined;
    });
    if (dangling.length > 0) {
      removeNodes(draft, new Set(dangling.map((node) => node.id)));
      changed = true;
    }
  }
}

function setAssistantExplanation(userdata: model.Userdata, explanation?: string) {
  userdata.assistant = pruned({ ...userdata.assistant, config: assistantConfig(), explanation });
}

function setMajorClaimExplanation(userdata: model.Userdata, explanation?: string) {
  userdata.assistant = pruned({
    ...userdata.assistant,
    mcConfig: assistantConfig(),
    mcExplanation: explanation,
  });
}

function validateRoles(
  premises: string[],
  conclusion: string,
  exists: (id: string) => boolean,
): Err | undefined {
  if (premises.length === 0) {
    return err("A scheme needs at least one premise.");
  }
  for (const premise of premises) {
    if (!exists(premise)) return err(`Premise "${premise}" does not exist.`);
  }
  if (!exists(conclusion)) {
    return err(`Conclusion "${conclusion}" does not exist.`);
  }
  if (premises.includes(conclusion)) {
    return err("A scheme cannot use its conclusion as a premise.");
  }
  return undefined;
}

/** Number of connected components in an undirected graph given as an adjacency map. */
function countComponents(adjacency: Map<string, string[]>): number {
  const seen = new Set<string>();
  let components = 0;
  for (const start of adjacency.keys()) {
    if (seen.has(start)) continue;
    components++;
    const stack = [start];
    while (stack.length > 0) {
      const current = stack.pop() as string;
      if (seen.has(current)) continue;
      seen.add(current);
      stack.push(...(adjacency.get(current) ?? []));
    }
  }
  return components;
}

/** Lightweight structural checks mirroring the goals of the original assistant prompts. */
function graphWarnings(
  nodes: model.Node[],
  graph: model.Graph,
  roles: Map<string, SchemeRoles>,
): string[] {
  const atoms = nodes.filter((node) => node.data.type === "atom");
  const warnings: string[] = [];

  // node -> nodes it points at (premise -> conclusion), used for major-claim reachability.
  const parents = new Map<string, string[]>();
  const connected = new Set<string>();
  // Undirected adjacency over atoms and scheme nodes, used to detect disconnected subgraphs.
  const adjacency = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    adjacency.set(a, [...(adjacency.get(a) ?? []), b]);
    adjacency.set(b, [...(adjacency.get(b) ?? []), a]);
  };
  for (const scheme of nodes.filter((node) => node.data.type === "scheme")) {
    const { premises, conclusion } = roles.get(scheme.id) ?? noRoles;
    if (premises.length === 0) warnings.push(`Scheme ${scheme.id} has no premises.`);
    if (conclusion === undefined) warnings.push(`Scheme ${scheme.id} has no conclusion.`);
    for (const premise of premises) {
      connected.add(premise);
      link(scheme.id, premise);
      if (conclusion !== undefined) {
        parents.set(premise, [...(parents.get(premise) ?? []), conclusion]);
      }
    }
    if (conclusion !== undefined) {
      connected.add(conclusion);
      link(scheme.id, conclusion);
    }
  }

  for (const atom of atoms) {
    if (!connected.has(atom.id)) {
      warnings.push(`Atom ${atom.id} is orphaned (no relations).`);
    }
    const reference = atomData(atom)?.reference;
    if (reference?.resource !== undefined) {
      const resource = graph.resources[reference.resource];
      if (resource !== undefined && !textOccursIn(reference.text, resource)) {
        warnings.push(
          `Atom ${atom.id}: its source text does not appear in the linked resource; extract ADUs verbatim.`,
        );
      }
    }
  }

  // Several relation clusters with no link between them mean the argument has fragmented. This is
  // caught even before a major claim is set, where the reachability check below cannot run yet.
  const components = countComponents(adjacency);
  if (components > 1) {
    warnings.push(
      `The graph splits into ${components} disconnected subgraphs; connect them into a single argument.`,
    );
  }

  const mc = graph.majorClaim;
  if (mc === undefined) {
    warnings.push("No major claim is set.");
  } else {
    const reachesMc = (start: string): boolean => {
      const seen = new Set<string>();
      const stack = [start];
      while (stack.length > 0) {
        const current = stack.pop() as string;
        if (current === mc) return true;
        if (seen.has(current)) continue;
        seen.add(current);
        stack.push(...(parents.get(current) ?? []));
      }
      return false;
    };
    for (const atom of atoms) {
      if (atom.id !== mc && connected.has(atom.id) && !reachesMc(atom.id)) {
        warnings.push(`Atom ${atom.id} does not connect to the major claim.`);
      }
    }
  }

  return warnings;
}

  const tools = {
    listResources: tool({
    description:
      "List the source resources (documents) in the project. Returns their ids, titles and sources.",
    inputSchema: z.object({}),
    execute: async () => {
      const resources = Object.values(getState().graph.resources);
      return {
        ok: true,
        resources: resources.map((r) => ({
          id: r.id,
          title: r.title ?? "",
          source: r.source ?? "",
        })),
      } satisfies Ok<{ resources: { id: string; title: string; source: string }[] }>;
    },
  }),

  readResource: tool({
    description: "Read the full text of a single resource by id.",
    inputSchema: z.object({ id: z.string().describe("The id of the resource to read") }),
    execute: async ({ id }) => {
      const resource = getState().graph.resources[id];
      if (resource === undefined) {
        return err(`No resource with id "${id}".`);
      }
      return {
        ok: true,
        id: resource.id,
        title: resource.title ?? "",
        source: resource.source ?? "",
        text: resource.text,
      };
    },
  }),

  writeResource: tool({
    description:
      "Create a source resource (document) the argument can be extracted from. Returns the new resource id.",
    inputSchema: z.object({
      text: z.string().describe("The full text of the resource"),
      title: z.string().optional(),
      source: z.string().optional().describe("Where the text comes from, e.g. a URL or citation"),
    }),
    execute: async ({ text, title, source }) => {
      const resource = new arguebuf.Resource({ text, title, source });
      setState(
        produce((draft: State) => {
          draft.graph.addResource(resource);
        }),
      );
      return { ok: true, id: resource.id };
    },
  }),

  editResource: tool({
    description:
      "Update the text, title and/or source of an existing resource. Omitted fields are left unchanged. Editing the text may shift the offsets of atom references into it.",
    inputSchema: z.object({
      id: z.string(),
      text: z.string().optional(),
      title: z.string().optional(),
      source: z.string().optional(),
    }),
    execute: async ({ id, text, title, source }) => {
      if (!resourceExists(id)) {
        return err(`No resource with id "${id}".`);
      }
      setState(
        produce((draft: State) => {
          const resource = draft.graph.resources[id];
          if (text !== undefined) resource.text = text;
          if (title !== undefined) resource.title = title;
          if (source !== undefined) resource.source = source;
        }),
      );
      return { ok: true, id };
    },
  }),

  deleteResource: tool({
    description:
      "Delete a resource. Any atom reference pointing to it is cleared; the atoms themselves are kept.",
    inputSchema: z.object({ id: z.string() }),
    execute: async ({ id }) => {
      if (!resourceExists(id)) {
        return err(`No resource with id "${id}".`);
      }
      setState(
        produce((draft: State) => {
          delete draft.graph.resources[id];
          for (const node of draft.nodes) {
            const data = atomData(node);
            if (data?.reference?.resource === id) {
              data.reference = undefined;
            }
          }
        }),
      );
      return { ok: true };
    },
  }),

  readGraph: tool({
    description:
      "Inspect the current argument graph: its atoms (ADUs), scheme nodes (each with its premises and conclusion), the major claim, and structural warnings. Call this before editing an existing graph.",
    inputSchema: z.object({}),
    execute: async () => {
      const { nodes, edges, graph } = getState();
      const roles = rolesByScheme(edges);
      const atoms = nodes
        .filter((node) => node.data.type === "atom")
        .map((node) => ({
          id: node.id,
          text: atomData(node)?.text ?? "",
          isMajorClaim: graph.majorClaim === node.id,
          participant: atomData(node)?.participant,
        }));
      const schemes = nodes
        .filter((node) => node.data.type === "scheme")
        .map((node) => ({
          id: node.id,
          type: schemeData(node)?.scheme?.case,
          ...(roles.get(node.id) ?? noRoles),
        }));
      return {
        ok: true,
        atoms,
        schemes,
        majorClaim: graph.majorClaim,
        warnings: graphWarnings(nodes, graph, roles),
      };
    },
  }),

  writeGraph: tool({
    description:
      "Add many atoms and scheme nodes to the graph in one call (preferred for end-to-end generation). Existing atoms and schemes are left untouched and the new nodes are appended. Provide atoms and scheme nodes with arbitrary temporary ids; a scheme references its premise and conclusion nodes by those ids, which may be temporary ids from this call or ids of existing nodes (atoms or other schemes, enabling linked and undercutting arguments). Pass replace: true only to discard the current graph and regenerate it from scratch in this same call; you never need a separate emptying step before adding.",
    inputSchema: z.object({
      atoms: z
        .array(
          z.object({
            id: z.string().describe("A temporary id used to reference this atom"),
            text: z
              .string()
              .describe(
                "The ADU text. Quote it verbatim from the source resource so it links back to the original; only paraphrase if necessary, in which case no source reference is recorded.",
              ),
            participantId: z
              .string()
              .optional()
              .describe("Id of an existing participant this atom is attributed to"),
            explanation: z.string().optional(),
          }),
        )
        .describe("The atoms (ADUs) to add"),
      schemes: z
        .array(
          z.object({
            id: z.string().describe("A temporary id used to reference this scheme"),
            type: schemeType,
            premises: z
              .array(z.string())
              .describe("Ids of the premise nodes (temporary ids from this call or existing nodes)"),
            conclusion: z
              .string()
              .describe("Id of the conclusion node (temporary id from this call or an existing node)"),
            explanation: z.string().optional(),
          }),
        )
        .describe("Scheme nodes connecting premises to a conclusion"),
      majorClaim: z
        .object({ id: z.string(), explanation: z.string().optional() })
        .optional()
        .describe("The id of the atom that is the major claim"),
      replace: z
        .boolean()
        .optional()
        .describe(
          "Discard the entire existing graph before adding these nodes (regenerate from scratch). Defaults to false, which appends to the current graph and leaves existing nodes untouched.",
        ),
    }),
    execute: async ({ atoms, schemes, majorClaim, replace }) => {
      const warnings: string[] = [];
      const idMap: Record<string, string> = {};

      const failure = commit((draft: State) => {
          draft.shouldLayout = true;
          if (replace) {
            // Wipe the graph in the same commit, so a from-scratch regeneration is one atomic call.
            draft.nodes = [];
            draft.edges = [];
            draft.graph.majorClaim = undefined;
          }
          // Snapshot the ids that exist before this call so references can be resolved in O(1).
          const existingIds = new Set(draft.nodes.map((node) => node.id));
          // Resolve a referenced id to a temp id from this call or an existing node id.
          const resolve = (id: string): string | undefined =>
            idMap[id] ?? (existingIds.has(id) ? id : undefined);

          const resource = resolveResource();
          for (const adu of atoms) {
            const text = adu.text.trim().replace(/[.,]$/, "");
            if (adu.participantId !== undefined && !participantExists(adu.participantId)) {
              warnings.push(`Atom ${adu.id}: unknown participant ${adu.participantId}.`);
            }
            if (resource !== undefined && !textOccursIn(text, resource)) {
              warnings.push(
                `Atom ${adu.id}: text does not appear in the source resource, so no reference was added; extract ADUs verbatim.`,
              );
            }
            const atom = model.initAtom({
              data: {
                text,
                reference: buildReference(text),
                participant:
                  adu.participantId !== undefined && participantExists(adu.participantId)
                    ? adu.participantId
                    : undefined,
                userdata: assistantUserdata({ explanation: adu.explanation }),
              },
            });
            idMap[adu.id] = atom.id;
            draft.nodes.push(atom);
          }

          for (const scheme of schemes) {
            const schemeNode = model.initScheme({
              data: {
                scheme: model.defaultSchemes[scheme.type],
                userdata: assistantUserdata({ explanation: scheme.explanation }),
              },
            });
            idMap[scheme.id] = schemeNode.id;
            draft.nodes.push(schemeNode);
          }

          for (const scheme of schemes) {
            const conclusion = resolve(scheme.conclusion);
            const premises = scheme.premises.map(resolve).filter((id) => id !== undefined);
            if (conclusion === undefined || premises.length === 0) {
              warnings.push(`Scheme ${scheme.id} skipped: unknown premise or conclusion id.`);
              continue;
            }
            wireScheme(draft, idMap[scheme.id], premises, conclusion);
          }

          if (majorClaim !== undefined) {
            const mcId = resolve(majorClaim.id);
            const mcNode = draft.nodes.find((node) => node.id === mcId);
            if (mcNode !== undefined && mcNode.data.type === "atom") {
              draft.graph.majorClaim = mcNode.id;
              setMajorClaimExplanation(mcNode.data.userdata as model.Userdata, majorClaim.explanation);
            } else {
              warnings.push(`Major claim id ${majorClaim.id} is not a known atom.`);
            }
          }
        });
      if (failure) return failure;

      return {
        ok: true,
        created: { atoms: atoms.length, schemes: schemes.length },
        idMap,
        warnings,
      };
    },
  }),

  writeAtom: tool({
    description:
      "Create a single atom (ADU) as a surgical addition to an existing graph; prefer writeGraph to build or regenerate a whole graph in one call. Returns the id of the new atom.",
    inputSchema: z.object({
      text: z
        .string()
        .describe(
          "The ADU text. Quote it verbatim from the source resource so it links back to the original; only paraphrase if necessary, in which case no source reference is recorded.",
        ),
      resourceId: z
        .string()
        .optional()
        .describe("Resource to link as the original reference (defaults to the selected one)"),
      participantId: z
        .string()
        .optional()
        .describe("Id of the participant this atom is attributed to"),
      explanation: z.string().optional(),
    }),
    execute: async ({ text, resourceId, participantId, explanation }) => {
      if (participantId !== undefined && !participantExists(participantId)) {
        return err(`No participant with id "${participantId}".`);
      }
      const trimmed = text.trim();
      const atom = model.initAtom({
        data: {
          text: trimmed,
          reference: buildReference(trimmed, resourceId),
          participant: participantId,
          userdata: assistantUserdata({ explanation }),
        },
      });
      const failure = commit((draft: State) => {
        draft.nodes.push(atom);
        draft.shouldLayout = true;
      });
      if (failure) return failure;
      const resource = resolveResource(resourceId);
      const warnings =
        resource !== undefined && !textOccursIn(trimmed, resource)
          ? ["Text does not appear in the source resource, so no reference was added; extract ADUs verbatim."]
          : [];
      return { ok: true, id: atom.id, warnings };
    },
  }),

  writeScheme: tool({
    description:
      "Create a scheme node linking one or more premise nodes to a single conclusion node, as a surgical addition to an existing graph; prefer writeGraph to build a whole graph in one call. Premises and the conclusion are existing node ids (atoms, or other schemes for linked/undercutting arguments). The type is support, attack, rephrase or preference. Returns the scheme id.",
    inputSchema: z.object({
      type: schemeType,
      premises: z.array(z.string()).describe("Ids of the premise nodes (atoms or schemes)"),
      conclusion: z.string().describe("Id of the conclusion node (atom or scheme)"),
      explanation: z.string().optional(),
    }),
    execute: async ({ type, premises, conclusion, explanation }) => {
      const exists = (id: string) => nodeById(id) !== undefined;
      const invalid = validateRoles(premises, conclusion, exists);
      if (invalid) return invalid;

      const schemeNode = model.initScheme({
        data: {
          scheme: model.defaultSchemes[type],
          userdata: assistantUserdata({ explanation }),
        },
      });
      const failure = commit((draft: State) => {
        draft.nodes.push(schemeNode);
        wireScheme(draft, schemeNode.id, premises, conclusion);
        draft.shouldLayout = true;
      });
      if (failure) return failure;
      return { ok: true, id: schemeNode.id };
    },
  }),

  editAtom: tool({
    description: "Update the text, participant attribution and/or explanation of an existing atom.",
    inputSchema: z.object({
      id: z.string(),
      text: z.string().optional(),
      participantId: z
        .string()
        .optional()
        .describe("Id of the participant to attribute this atom to; pass an empty string to clear it"),
      explanation: z.string().optional(),
    }),
    execute: async ({ id, text, participantId, explanation }) => {
      if (atomData(nodeById(id)) === undefined) {
        return err(`No atom with id "${id}".`);
      }
      if (participantId !== undefined && participantId !== "" && !participantExists(participantId)) {
        return err(`No participant with id "${participantId}".`);
      }
      const failure = commit((draft: State) => {
        const node = draft.nodes.find((n) => n.id === id);
        const data = atomData(node);
        if (data === undefined || node === undefined) return;
        if (text !== undefined) data.text = text.trim();
        if (participantId !== undefined) {
          data.participant = participantId === "" ? undefined : participantId;
        }
        if (explanation !== undefined) {
          setAssistantExplanation(node.data.userdata as model.Userdata, explanation);
        }
      });
      if (failure) return failure;
      return { ok: true, id };
    },
  }),

  editScheme: tool({
    description:
      "Update an existing scheme node: change its type, and/or rewire its premises and conclusion. Omitted role fields are left unchanged.",
    inputSchema: z.object({
      id: z.string(),
      type: schemeType.optional(),
      premises: z.array(z.string()).optional(),
      conclusion: z.string().optional(),
      explanation: z.string().optional(),
    }),
    execute: async ({ id, type, premises, conclusion, explanation }) => {
      if (schemeData(nodeById(id)) === undefined) {
        return err(`No scheme with id "${id}".`);
      }
      const current = schemeRoles(id, getState().edges);
      const nextPremises = premises ?? current.premises;
      const nextConclusion = conclusion ?? current.conclusion;

      if (premises !== undefined || conclusion !== undefined) {
        if (nextConclusion === undefined) {
          return err("The scheme has no conclusion; provide one.");
        }
        const exists = (nodeId: string) => nodeId !== id && nodeById(nodeId) !== undefined;
        const invalid = validateRoles(nextPremises, nextConclusion, exists);
        if (invalid) return invalid;
      }

      const failure = commit((draft: State) => {
        const node = draft.nodes.find((n) => n.id === id);
        const data = schemeData(node);
        if (data === undefined || node === undefined) return;
        if (type !== undefined) data.scheme = model.defaultSchemes[type];
        if (explanation !== undefined) {
          setAssistantExplanation(node.data.userdata as model.Userdata, explanation);
        }
        if ((premises !== undefined || conclusion !== undefined) && nextConclusion !== undefined) {
          wireScheme(draft, id, nextPremises, nextConclusion);
        }
        draft.shouldLayout = true;
      });
      if (failure) return failure;
      return { ok: true, id };
    },
  }),

  setMajorClaim: tool({
    description: "Set the graph's major claim (the single root atom of the argument) by atom id.",
    inputSchema: z.object({
      id: z.string().describe("Id of the atom to set as the major claim"),
      explanation: z.string().optional(),
    }),
    execute: async ({ id, explanation }) => {
      if (atomData(nodeById(id)) === undefined) {
        return err(`Major claim ${id} is not an existing atom.`);
      }
      const failure = commit((draft: State) => {
        draft.graph.majorClaim = id;
        const node = draft.nodes.find((n) => n.id === id);
        if (node !== undefined && explanation !== undefined) {
          setMajorClaimExplanation(node.data.userdata as model.Userdata, explanation);
        }
      });
      if (failure) return failure;
      return { ok: true, id };
    },
  }),

  clearMajorClaim: tool({
    description: "Unset the graph's major claim, leaving the argument without a designated root atom.",
    inputSchema: z.object({}),
    execute: async () => {
      setState(
        produce((draft: State) => {
          draft.graph.majorClaim = undefined;
        }),
      );
      return { ok: true };
    },
  }),

  listParticipants: tool({
    description:
      "List the participants (the people behind the argument). Returns each participant's id and profile fields.",
    inputSchema: z.object({}),
    execute: async () => {
      const participants = Object.entries(getState().graph.participants).map(([id, p]) => ({
        id,
        name: p.name ?? "",
        username: p.username ?? "",
        email: p.email ?? "",
        url: p.url ?? "",
        location: p.location ?? "",
        description: p.description ?? "",
      }));
      return { ok: true, participants };
    },
  }),

  writeParticipant: tool({
    description:
      "Create a participant (a person behind the argument, e.g. a speaker). Returns the new participant id.",
    inputSchema: z.object(participantFields),
    execute: async (fields) => {
      const participant = new arguebuf.Participant(fields);
      setState(
        produce((draft: State) => {
          draft.graph.addParticipant(participant);
        }),
      );
      return { ok: true, id: participant.id };
    },
  }),

  editParticipant: tool({
    description: "Update the profile fields of an existing participant. Omitted fields are left unchanged.",
    inputSchema: z.object({ id: z.string(), ...participantFields }),
    execute: async ({ id, name, username, email, url, location, description }) => {
      if (!participantExists(id)) {
        return err(`No participant with id "${id}".`);
      }
      setState(
        produce((draft: State) => {
          const p = draft.graph.participants[id];
          if (name !== undefined) p.name = name;
          if (username !== undefined) p.username = username;
          if (email !== undefined) p.email = email;
          if (url !== undefined) p.url = url;
          if (location !== undefined) p.location = location;
          if (description !== undefined) p.description = description;
        }),
      );
      return { ok: true, id };
    },
  }),

  deleteParticipant: tool({
    description:
      "Delete a participant. Any atom attributed to it has that attribution cleared.",
    inputSchema: z.object({ id: z.string() }),
    execute: async ({ id }) => {
      if (!participantExists(id)) {
        return err(`No participant with id "${id}".`);
      }
      setState(
        produce((draft: State) => {
          delete draft.graph.participants[id];
          for (const node of draft.nodes) {
            const data = atomData(node);
            if (data?.participant === id) {
              data.participant = undefined;
            }
          }
        }),
      );
      return { ok: true };
    },
  }),

  deleteAtom: tool({
    description:
      "Delete an atom. It is detached from any scheme node that used it as a premise or conclusion, and any scheme node left without a premise or conclusion is removed as well.",
    inputSchema: z.object({ id: z.string() }),
    execute: async ({ id }) => {
      if (atomData(nodeById(id)) === undefined) {
        return err(`No atom with id "${id}".`);
      }
      setState(
        produce((draft: State) => {
          removeNodes(draft, new Set([id]));
          pruneDanglingSchemes(draft);
          draft.shouldLayout = true;
        }),
      );
      return { ok: true };
    },
  }),

  deleteScheme: tool({
    description: "Delete a scheme node, detaching its premises and conclusion.",
    inputSchema: z.object({ id: z.string() }),
    execute: async ({ id }) => {
      if (schemeData(nodeById(id)) === undefined) {
        return err(`No scheme with id "${id}".`);
      }
      setState(
        produce((draft: State) => {
          removeNodes(draft, new Set([id]));
          draft.shouldLayout = true;
        }),
      );
      return { ok: true };
    },
  }),

  deleteGraph: tool({
    description:
      "Remove all atoms and scheme nodes, leaving an empty graph. Use this only when the analyst explicitly asks to start over with nothing. writeGraph is additive by default, so you never need to empty the graph before adding to it; to rebuild from scratch in a single call, use writeGraph with replace: true instead.",
    inputSchema: z.object({}),
    execute: async () => {
      setState(
        produce((draft: State) => {
          draft.nodes = [];
          draft.edges = [];
          draft.graph.majorClaim = undefined;
        }),
      );
      return { ok: true };
    },
  }),
  } satisfies ToolSet;

  return tools;
}
