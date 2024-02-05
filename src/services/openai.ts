import * as arguebuf from "arguebuf";
import { produce } from "immer";
import OpenAI from "openai";
import * as model from "../model";
import { getSessionStorage } from "../storage";
import { OpenAIConfig, State, getState, setState } from "../store";

export type Mapping<U> = {
  [key in string]: U;
};

interface GeneratedAtom {
  text: string;
  explanation: string;
}

function getResource(): arguebuf.Resource {
  const selectedResourceTab = getState().selectedResourceTab;
  const resources = getState().graph.resources;

  if (selectedResourceTab > Object.keys(resources).length) {
    throw new Error("Please create a resource first.");
  }

  return Object.values(resources)[selectedResourceTab];
}

export async function generateAtomNodes(): Promise<
  Array<arguebuf.AtomNodeConstructor>
> {
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
    name: "extract_atom_nodes",
    description:
      "Extract a set of atom nodes (argumentative discourse units) from a resource",
    parameters: {
      title: "Atom node extraction",
      description:
        "Extract a set of atom nodes (argumentative discourse units) from a resource",
      type: "object",
      required: ["atoms"],
      properties: {
        atoms: {
          type: "array",
          items: {
            type: "object",
            required: ["text", "explanation"],
            properties: {
              text: {
                type: "string",
                description: "The text of the atom node (ADU)",
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

  const functionArgs = JSON.parse(res.arguments);
  const generatedAtoms: Array<GeneratedAtom> = functionArgs.atoms;

  const parsedAtomNodes = generatedAtoms.map((generatedAtom) => {
    const text = generatedAtom.text.trim().replace(/[.,]$/, "");
    return model.initAtom({
      data: {
        text,
        reference: new arguebuf.Reference({
          text,
          resource: resource.id,
          offset: resource.text.toLowerCase().indexOf(text.toLowerCase()),
        }),
        userdata: {
          assistant: {
            config: openaiConfig,
            explanation: generatedAtom.explanation,
          },
        },
      },
    });
  });

  setState(
    produce((draft: State) => {
      draft.nodes.push(...parsedAtomNodes);
      draft.shouldLayout = true;
    })
  );
}

export async function generateMajorClaim() {
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

  const functionArgs = JSON.parse(res.arguments);
  const mcId = functionArgs.id;

  if (atomNodes.find((node) => node.id === mcId) === undefined) {
    throw new Error(
      "The model identified an invalid major claim id. Please try again or set one manually."
    );
  }

  setState(
    produce((draft: State) => {
      draft.graph.majorClaim = mcId;
      const mcUserdata = draft.nodes.find((node) => node.data.id === mcId)!.data
        .userdata;
      mcUserdata.assistant = mcUserdata.assistant || {};
      mcUserdata.assistant.config = openaiConfig;
      mcUserdata.assistant.mcExplanation = functionArgs.explanation;
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
