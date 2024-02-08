import * as arguebuf from "arguebuf";
import { produce } from "immer";
import OpenAI from "openai";
import * as model from "../model";
import { getSessionStorage } from "../storage";
import { OpenAIConfig, State, getState, setState } from "../store";

export type Mapping<U> = {
  [key in string]: U;
};

const extractedAduSchema = {
  type: "object",
  required: ["text", "explanation"],
  properties: {
    text: {
      type: "string",
      description: "The text of the ADU",
    },
    explanation: {
      type: "string",
      description: "A reason why this text was chosen as an ADU",
    },
  },
};

interface ExtractedAdu {
  text?: string;
  explanation?: string;
}

interface ExtractAdusArgs {
  adus: Array<ExtractedAdu>;
}

const identifiedMajorClaimSchema = {
  type: "object",
  required: ["id", "explanation"],
  properties: {
    id: {
      type: "string",
      description: "The ID of the ADU that you consider to be the major claim",
    },
    explanation: {
      type: "string",
      description: "A reason why this ADU was chosen as the major claim",
    },
  },
};

interface IdentifyMajorClaimArgs {
  id?: string;
  explanation?: string;
}

const predictedRelationSchema = {
  type: "object",
  required: ["source", "target", "type", "explanation"],
  properties: {
    source: {
      type: "string",
      description: "The ID of the source ADU",
    },
    target: {
      type: "string",
      description: "The ID of the target ADU",
    },
    type: {
      type: "string",
      description: "The type of the relation",
      enum: ["support", "attack"],
    },
    explanation: {
      type: "string",
      description: "A reason why this relation was chosen",
    },
  },
};

interface PredictedRelation {
  source?: string;
  target?: string;
  type?: "support" | "attack";
  explanation?: string;
}

interface PredictRelationsArgs {
  relations: Array<PredictedRelation>;
}

interface ExtractedAduWithId extends ExtractedAdu {
  id: string;
}

interface GenerateGraphArgs {
  adus: Array<ExtractedAduWithId>;
  majorClaim: IdentifyMajorClaimArgs;
  relations: Array<PredictedRelation>;
}

enum SchemeType {
  SUPPORT = "support",
  ATTACK = "attack",
}

const schemeLookup: {
  [key in SchemeType]: arguebuf.Scheme;
} = {
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

export async function extractAdus() {
  const resource = getResource();

  const systemMessage = `
The user will provide a long text that contains a set of arguments.
Your task is to identify all argumentative discourse units (ADUs) in the text.
They will subsequently be used to construct a graph.
The user will have the chance to correct the graph, so DO NOT change any text during this step.
You shall only EXTRACT the ADUs from the text.
`;

  const openaiConfig = getState().openaiConfig;

  const res = await fetchOpenAI(openaiConfig, systemMessage, resource.text, {
    name: "extract_adus",
    description:
      "Extract a set of argumentative discourse units (ADUs) from a resource",
    parameters: {
      title: "ADU extraction",
      description:
        "Extract a set of argumentative discourse units (ADUs) from a resource",
      type: "object",
      required: ["adus"],
      properties: {
        adus: {
          type: "array",
          items: extractedAduSchema,
        },
      },
    },
  });

  const functionArgs: ExtractAdusArgs = JSON.parse(res.arguments);
  const extractedAdus = functionArgs.adus;

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
    })
  );
}

export async function identifyMajorClaim() {
  const atomNodes = getState()
    .nodes.map((node) => node.data)
    .filter((node) => node.type === "atom") as Array<model.AtomNodeData>;

  const userMessage = JSON.stringify(
    atomNodes.map((node) => ({ text: node.text, id: node.id }))
  );

  const systemMessage = `
The user will provide a list of argumentative discourse units (ADUs).
Your task is to identify the major claim / conclusion of the argument.
This node will subsequently be used as the root node of an argument graph.
Please provide the ID of the ADU that you consider to be the major claim.
`;

  const openaiConfig = getState().openaiConfig;

  const res = await fetchOpenAI(openaiConfig, systemMessage, userMessage, {
    name: "identify_major_claim",
    description: "Identify the major claim / conclusion of an argument",
    parameters: {
      ...identifiedMajorClaimSchema,
      title: "Major Claim Identification",
      description: "Identify the major claim / conclusion of an argument",
    },
  });

  const mc: IdentifyMajorClaimArgs = JSON.parse(res.arguments);

  if (atomNodes.find((node) => node.id === mc.id) === undefined) {
    throw new Error(
      "The model identified an invalid major claim id. Please try again or set one manually."
    );
  }

  setState(
    produce((draft: State) => {
      draft.graph.majorClaim = mc.id;
      const mcUserdata = draft.nodes.find((node) => node.data.id === mc.id)!
        .data.userdata;
      mcUserdata.assistant = mcUserdata.assistant || {};
      mcUserdata.assistant.mcConfig = openaiConfig;
      mcUserdata.assistant.mcExplanation = mc.explanation;
    })
  );
}

export async function predictRelations() {
  const atomNodes = getState()
    .nodes.map((node) => node.data)
    .filter((node) => node.type === "atom") as Array<model.AtomNodeData>;

  const userMessage = JSON.stringify({
    atomNodes: atomNodes.map((node) => ({ text: node.text, id: node.id })),
    majorClaimId: getState().graph.majorClaim,
  });

  const systemMessage = `
The user will provide a list of argumentative discourse units (ADUs) and the ID of the major claim.
Your task is to predict sensible relations in the form of support/attack between them.
You shall produce a valid argument graph with the major claim being the root node.
You shall not connect all ADUs to the major claim, but only those that are directly related to it.
The other ADUs should be connected to each other in a hierarchical manner.
`;

  const openaiConfig = getState().openaiConfig;

  const res = await fetchOpenAI(openaiConfig, systemMessage, userMessage, {
    name: "predict_relations",
    description: "Predict relations between argumentative discourse units",
    parameters: {
      title: "Relation Generation",
      description: "Predict relations between argumentative discourse units",
      type: "object",
      required: ["relations"],
      properties: {
        relations: {
          type: "array",
          items: predictedRelationSchema,
        },
      },
    },
  });

  const functionArgs: PredictRelationsArgs = JSON.parse(res.arguments);
  const predictedRelations = functionArgs.relations;

  setState(
    produce((draft: State) => {
      draft.shouldLayout = true;
      draft.edges = [];
      draft.nodes = draft.nodes.filter((node) => node.data.type === "atom");

      predictedRelations.forEach((relation) => {
        const source = draft.nodes.find(
          (node) => node.data.id === relation.source
        );
        const target = draft.nodes.find(
          (node) => node.data.id === relation.target
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
      });
    })
  );
}

export async function generateGraph() {
  const resource = getResource();

  const systemMessage = `
The user will provide a long text that contains a set of arguments.
Your task is to generate a complete argument graph containing all ADUs, the major claim, and the relations between the ADUs.
ADUs shall only be EXTRACTED from the text, not changed.
The major claim will be the root node of the graph.
Relations can either be of type support or attack.
You shall not connect all ADUs to the major claim, but only those that are directly related to it.
The other ADUs should be connected to each other in a hierarchical manner.
`;

  const openaiConfig = getState().openaiConfig;

  const res = await fetchOpenAI(openaiConfig, systemMessage, resource.text, {
    name: "generate_argument_graph",
    description: "Generate a complete argument graph from a plain text",
    parameters: {
      title: "Argument Graph Generation",
      description: "Generate a complete argument graph from a plain text",
      type: "object",
      required: ["adus", "majorClaim", "relations"],
      properties: {
        adus: {
          type: "array",
          items: {
            type: "object",
            required: [...extractedAduSchema.required, "id"],
            properties: {
              ...extractedAduSchema.properties,
              id: {
                type: "string",
                description:
                  "An arbitrary ID for the ADU to be used as source/target in relations",
              },
            },
          },
        },
        majorClaim: identifiedMajorClaimSchema,
        relations: {
          type: "array",
          items: predictedRelationSchema,
        },
      },
    },
  });

  const generatedGraph: GenerateGraphArgs = JSON.parse(res.arguments);

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
        })
      );

      generatedGraph.relations.forEach((relation) => {
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
      });

      const mc = generatedGraph.majorClaim;
      if (
        Object.values(generatedAtomNodes).find((node) => node.id === mc.id) !==
        undefined
      ) {
        draft.graph.majorClaim = mc.id;
        const mcUserdata = draft.nodes.find((node) => node.data.id === mc.id)!
          .data.userdata;
        mcUserdata.assistant = mcUserdata.assistant || {};
        mcUserdata.assistant.mcConfig = openaiConfig;
        mcUserdata.assistant.mcExplanation = mc.explanation;
      }
    })
  );
}

async function fetchOpenAI(
  config: OpenAIConfig,
  system_message: string,
  user_message: string,
  function_definition: OpenAI.FunctionDefinition
): Promise<OpenAI.ChatCompletionMessageToolCall.Function> {
  const { model, baseURL } = config;
  const apiKey = getSessionStorage<string>("openaiApiKey", "");

  if (apiKey === "") {
    throw new Error(
      "Cannot perform OpenAI request because an API Key is missing. Please open the inspector and set it in the field 'OpenAI Config'."
    );
  }

  const client = new OpenAI({ baseURL, apiKey, dangerouslyAllowBrowser: true });

  const res = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system_message },
      { role: "user", content: user_message },
    ],
    tool_choice: {
      type: "function",
      function: {
        name: function_definition.name,
      },
    },
    tools: [
      {
        type: "function",
        function: function_definition,
      },
    ],
  });

  if (
    res.choices.length !== 1 ||
    res.choices[0].message.tool_calls === undefined ||
    res.choices[0].message.tool_calls.length !== 1
  ) {
    throw new Error(
      "Got an unexpected response from OpenAI. This may happen sometimes, so please try again."
    );
  }

  return res.choices[0].message.tool_calls[0].function;
}
