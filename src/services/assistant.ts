import * as arguebuf from "arguebuf";
import { produce } from "immer";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import * as model from "../model";
import { getSessionStorage } from "../storage";
import type { AssistantConfig, State } from "../store";
import { getState, setState } from "../store";

const ExtractedAdu = z.object({
  text: z.string().describe("The text of the ADU"),
  explanation: z
    .string()
    .describe("A reason why this text was chosen as an ADU"),
});

const ExtractedAdus = z.object({
  adus: z
    .array(ExtractedAdu)
    .describe(
      "An array of extracted argumentative discourse units from a resource",
    ),
});

const IdentifiedMajorClaim = z.object({
  id: z
    .string()
    .describe(
      "The ID of the argumentative discourse unit (ADU) that you consider to be the major claim / conclusion of the argument",
    ),
  explanation: z
    .string()
    .describe("A reason why this ADU was chosen as the major claim"),
});

const PredictedRelation = z.object({
  source: z.string().describe("The ID of the source ADU"),
  target: z.string().describe("The ID of the target ADU"),
  type: z.enum(["support", "attack"]).describe("The type of the relation"),
  explanation: z.string().describe("A reason why this relation was chosen"),
});

const PredictedRelations = z.object({
  relations: z
    .array(PredictedRelation)
    .describe(
      "An array of predicted relations between argumentative discourse units (ADUs)",
    ),
});

const ExtractedAduWithId = ExtractedAdu.extend({
  id: z
    .string()
    .describe(
      "An arbitrary ID for the ADU to be used as source/target in relations",
    ),
});

const GeneratedGraph = z.object({
  adus: z.array(ExtractedAduWithId).describe("An array of extracted ADUs"),
  majorClaim: IdentifiedMajorClaim.describe("The identified major claim"),
  relations: z
    .array(PredictedRelation)
    .describe("An array of predicted relations"),
});

enum SchemeType {
  SUPPORT = "support",
  ATTACK = "attack",
}

const schemeLookup: Record<SchemeType, arguebuf.Scheme> = {
  support: { case: "support", value: arguebuf.Support.DEFAULT },
  attack: { case: "attack", value: arguebuf.Attack.DEFAULT },
};

function getResource(): arguebuf.Resource {
  const selectedResourceTab = getState().selectedResourceTab;
  const resources = getState().graph.resources;

  if (selectedResourceTab > Object.keys(resources).length) {
    throw new Error("Please create a resource first.");
  }

  return Object.values(resources)[selectedResourceTab];
}

export async function extractAdus(customPrompt: string) {
  const resource = getResource();

  const systemMessage = `
The user will provide a long text that contains a set of arguments.
Your task is to identify all argumentative discourse units (ADUs) in the text.
They will subsequently be used to construct a graph.
The user will have the chance to correct the graph, so DO NOT change any text during this step.
You shall only EXTRACT the ADUs from the text.

${customPrompt}
`.trim();

  const userMessage = JSON.stringify({
    text: resource.text,
    title: resource.title,
    source: resource.source,
  });

  const openaiConfig = getState().assistantConfig;

  const res = await fetchOpenAI(
    openaiConfig,
    systemMessage,
    userMessage,
    ExtractedAdus,
    "extracted_adus",
  );
  const extractedAdus = res.adus;

  const extractedAtomNodes = extractedAdus.map((adu) => {
    const text = adu.text?.trim().replace(/[.,]$/, "") ?? "";
    const offset = resource.text.toLowerCase().indexOf(text.toLowerCase());

    return model.initAtom({
      data: {
        text,
        reference: new arguebuf.Reference({
          text,
          resource: resource.id,
          offset: offset === -1 ? undefined : offset,
        }),
        userdata: {
          assistant: {
            config: openaiConfig,
            explanation: adu.explanation,
          },
        },
      },
    });
  });

  setState(
    produce((draft: State) => {
      draft.nodes = extractedAtomNodes;
      draft.edges = [];
      draft.shouldLayout = true;
    }),
  );
}

export async function identifyMajorClaim(customPrompt: string) {
  const atomNodes = getState()
    .nodes.map((node) => node.data)
    .filter((node) => node.type === "atom") as model.AtomNodeData[];

  const userMessage = JSON.stringify(
    atomNodes.map((node) => ({ text: node.text, id: node.id })),
  );

  const systemMessage = `
The user will provide a list of argumentative discourse units (ADUs).
Your task is to identify the major claim / conclusion of the argument.
This node will subsequently be used as the root node of an argument graph.
Please provide the ID of the ADU that you consider to be the major claim.

${customPrompt}
`.trim();

  const openaiConfig = getState().assistantConfig;

  const mc = await fetchOpenAI(
    openaiConfig,
    systemMessage,
    userMessage,
    IdentifiedMajorClaim,
    "identified_major_claim",
  );

  if (atomNodes.find((node) => node.id === mc.id) === undefined) {
    throw new Error(
      "The model identified an invalid major claim id. Please try again or set one manually.",
    );
  }

  setState(
    produce((draft: State) => {
      const mcNode = draft.nodes.find((node) => node.data.id === mc.id);

      if (mcNode === undefined) {
        throw new Error("Major claim node not found in nodes.");
      }

      draft.graph.majorClaim = mc.id;
      const userdata = mcNode.data.userdata as model.Userdata;

      userdata.assistant = {
        ...(userdata.assistant ?? {}),
        ...{
          mcConfig: openaiConfig,
          mcExplanation: mc.explanation,
        },
      };
    }),
  );
}

export async function predictRelations(customPrompt: string) {
  const atomNodes = getState()
    .nodes.map((node) => node.data)
    .filter((node) => node.type === "atom") as model.AtomNodeData[];

  const userMessage = JSON.stringify({
    atomNodes: atomNodes.map((node) => ({ text: node.text, id: node.id })),
    majorClaimId: getState().graph.majorClaim,
  });

  const systemMessage = `
The user will provide a list of argumentative discourse units (ADUs) and the ID of the major claim.
Your task is to predict sensible relations in the form of support/attack between them.
You shall produce a valid argument graph with the major claim being the root node.
You shall create a hierarchical graph with the major claim being the root node (i.e., it should have no outgoing relations, only incoming ones).
Flat graphs (i.e., all ADUs directly connected to the major claim directly) are discouraged.
There should be no cycles in the graph and no orphaned ADUs.

${customPrompt}
`.trim();

  const openaiConfig = getState().assistantConfig;

  const res = await fetchOpenAI(
    openaiConfig,
    systemMessage,
    userMessage,
    PredictedRelations,
    "predicted_relations",
  );
  const predictedRelations = res.relations;

  setState(
    produce((draft: State) => {
      draft.shouldLayout = true;
      draft.edges = [];
      draft.nodes = draft.nodes.filter((node) => node.data.type === "atom");

      for (const relation of predictedRelations) {
        const source = draft.nodes.find(
          (node) => node.data.id === relation.source,
        );
        const target = draft.nodes.find(
          (node) => node.data.id === relation.target,
        );

        if (
          source !== undefined &&
          target !== undefined &&
          relation.type !== undefined
        ) {
          const schemeNode = model.initScheme({
            data: {
              scheme: schemeLookup[relation.type],
              userdata: {
                assistant: {
                  config: openaiConfig,
                  explanation: relation.explanation,
                },
              },
            },
          });
          draft.nodes.push(schemeNode);

          const edge1 = model.initEdge({
            source: source.id,
            target: schemeNode.id,
            data: {},
          });
          const edge2 = model.initEdge({
            source: schemeNode.id,
            target: target.id,
            data: {},
          });
          draft.edges.push(edge1, edge2);
        }
      }
    }),
  );
}

export async function generateGraph(customPrompt: string) {
  const resource = getResource();

  const systemMessage = `
The user will provide a long text that contains a set of arguments.
Your task is to generate a complete argument graph containing all ADUs, the major claim, and the relations between the ADUs.
ADUs shall only be EXTRACTED from the text, not changed.
Relations can either be of type support or attack.
You shall create a hierarchical graph with the major claim being the root node (i.e., it should have no outgoing relations, only incoming ones).
Flat graphs (i.e., all ADUs directly connected to the major claim directly) are discouraged.
There should be no cycles in the graph and no orphaned ADUs.

${customPrompt}
`.trim();

  const userMessage = JSON.stringify({
    text: resource.text,
    title: resource.title,
    source: resource.source,
  });

  const openaiConfig = getState().assistantConfig;

  const generatedGraph = await fetchOpenAI(
    openaiConfig,
    systemMessage,
    userMessage,
    GeneratedGraph,
    "generated_graph",
  );

  setState(
    produce((draft: State) => {
      draft.shouldLayout = true;
      draft.nodes = [];
      draft.edges = [];

      const generatedAtomNodes = Object.fromEntries(
        generatedGraph.adus.map((adu) => {
          const text = adu.text?.trim().replace(/[.,]$/, "") ?? "";
          const offset = resource.text
            .toLowerCase()
            .indexOf(text.toLowerCase());

          const atomNode = model.initAtom({
            data: {
              text,
              reference: new arguebuf.Reference({
                text,
                resource: resource.id,
                offset: offset === -1 ? undefined : offset,
              }),
              userdata: {
                assistant: {
                  config: openaiConfig,
                  explanation: adu.explanation,
                },
              },
            },
          });

          return [adu.id, atomNode];
        }),
      );

      for (const relation of generatedGraph.relations) {
        if (
          relation.source !== undefined &&
          relation.source in generatedAtomNodes &&
          relation.target !== undefined &&
          relation.target in generatedAtomNodes &&
          relation.type !== undefined
        ) {
          const sourceNode = generatedAtomNodes[relation.source];
          const targetNode = generatedAtomNodes[relation.target];

          if (
            draft.nodes.find((node) => node.data.id === sourceNode.data.id) ===
            undefined
          ) {
            draft.nodes.push(sourceNode);
          }
          if (
            draft.nodes.find((node) => node.data.id === targetNode.data.id) ===
            undefined
          ) {
            draft.nodes.push(targetNode);
          }

          const schemeNode = model.initScheme({
            data: {
              scheme: schemeLookup[relation.type],
              userdata: {
                assistant: {
                  config: openaiConfig,
                  explanation: relation.explanation,
                },
              },
            },
          });
          draft.nodes.push(schemeNode);

          const edge1 = model.initEdge({
            source: sourceNode.id,
            target: schemeNode.id,
            data: {},
          });
          const edge2 = model.initEdge({
            source: schemeNode.id,
            target: targetNode.id,
            data: {},
          });
          draft.edges.push(edge1, edge2);
        }
      }

      const mc = generatedGraph.majorClaim;

      // first check if the major claim ID is in the generated ADUs
      if (mc.id !== undefined && mc.id in generatedAtomNodes) {
        const generatedMcNode = generatedAtomNodes[mc.id];
        const mcNode = draft.nodes.find(
          (node) => node.data.id === generatedMcNode.data.id,
        );

        // now check if the major claim is part of the graph
        if (mcNode !== undefined) {
          draft.graph.majorClaim = mcNode.data.id;
          const mcUserdata = mcNode.data.userdata as model.Userdata;

          mcUserdata.assistant = {
            ...(mcUserdata.assistant ?? {}),
            ...{
              mcConfig: openaiConfig,
              mcExplanation: mc.explanation,
            },
          };
        }
      }
    }),
  );
}

async function fetchOpenAI<T extends z.ZodTypeAny>(
  config: AssistantConfig,
  systemMessage: string,
  userMessage: string,
  schema: T,
  schemaName: string,
): Promise<z.infer<T>> {
  const {
    model,
    baseURL,
    temperature,
    topP,
    frequencyPenalty,
    presencePenalty,
    seed,
  } = config;
  const apiKey = getSessionStorage<string>("assistantKey", "");

  if (apiKey === "") {
    throw new Error(
      "Cannot perform LLM request because an API Key is missing. Please open the inspector and set it in the field 'Assistant Config'.",
    );
  }

  const client = new OpenAI({ baseURL, apiKey, dangerouslyAllowBrowser: true });

  try {
    const completion = await client.chat.completions.parse({
      model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      response_format: zodResponseFormat(schema, schemaName),
      temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      seed,
    });

    const res = completion.choices[0].message;

    if (res.parsed) {
      return res.parsed;
    }

    throw new Error(
      `Got an unexpected response from the LLM, please try again: ${res.refusal}`,
    );
  } catch (e: unknown) {
    throw new Error(
      `Got an unexpected response from the LLM, please try again: ${
        (e as Error).message
      }`,
    );
  }
}
