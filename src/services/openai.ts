import * as arguebuf from "arguebuf";
import { produce } from "immer";
import OpenAI from "openai";
import * as model from "../model";
import { getSessionStorage } from "../storage";
import { OpenAIConfig, State, getState, setState } from "../store";

export type Mapping<U> = {
  [key in string]: U;
};

interface ExtractedAdu {
  text?: string;
  explanation?: string;
}

interface ExtractAdusArgs {
  adus: Array<ExtractedAdu>;
}

interface IdentifyMajorClaimArgs {
  id?: string;
  explanation?: string;
}

interface PredictedRelation {
  source?: string;
  target?: string;
  type?: "support" | "attack";
  explanation?: string;
}

interface PredictRelationsArgs {
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
          items: {
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
          },
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
      draft.nodes.push(...extractedAtomNodes);
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
      title: "Major Claim Identification",
      description: "Identify the major claim / conclusion of an argument",
      type: "object",
      required: ["id", "explanation"],
      properties: {
        id: {
          type: "string",
          description:
            "The ID of the ADU that you consider to be the major claim",
        },
        explanation: {
          type: "string",
          description: "A reason why this ADU was chosen as the major claim",
        },
      },
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
      mcUserdata.assistant.config = openaiConfig;
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
          items: {
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
          },
        },
      },
    },
  });

  const functionArgs: PredictRelationsArgs = JSON.parse(res.arguments);
  const predictedRelations = functionArgs.relations;

  setState(
    produce((draft: State) => {
      draft.shouldLayout = true;

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
