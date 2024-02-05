import * as arguebuf from "arguebuf";
import OpenAI from "openai";
import { getSessionStorage } from "../storage";
import { OpenAIConfig, getState } from "../store";

export type Mapping<U> = {
  [key in string]: U;
};

interface GeneratedAtom {
  text: string;
  explanation: string;
}

export async function generateAtomNodes(
  resources: Mapping<arguebuf.Resource>
): Promise<Array<arguebuf.AtomNodeConstructor>> {
  if (Object.keys(resources).length !== 1) {
    throw new Error(
      "You added multiple resources to the graph. Currently, only one resource is supported for AI generations."
    );
  }

  const resourceId = Object.keys(resources)[0];
  const resourceText = resources[resourceId].text;
  // const text = Object.values(resources).map((resource) => resource.text).join("\n");

  const systemMessage = `
The user will provide a long text that contains a set of arguments.
Your task is to identify all argumentative discourse units (ADUs) in the text.
They will subsequently be used to construct a graph.
The user will have the chance to correct the graph, so DO NOT change any text during this step.
You shall only EXTRACT the ADUs from the text.
`;

  const openaiConfig = getState().openaiConfig;

  const res = await fetchOpenAI(openaiConfig, systemMessage, resourceText, {
    name: "generate_atom_nodes",
    description:
      "Generate a set of atom nodes (argumentative discourse units) from a resource",
    parameters: {
      title: "Generate atom nodes",
      description:
        "Generate a set of atom nodes (argumentative discourse units) from a resource",
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
  const resourceTextLower = resourceText.toLowerCase();

  return generatedAtoms.map((generatedAtom) => {
    const text = generatedAtom.text.trim().replace(/[.,]$/, "");
    return {
      text,
      reference: new arguebuf.Reference({
        text,
        resource: resourceId,
        offset: resourceTextLower.indexOf(text.toLowerCase()),
      }),
      userdata: {
        assistant: {
          config: openaiConfig,
          explanation: generatedAtom.explanation,
        },
      },
    };
  });
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
