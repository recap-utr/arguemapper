import * as arguebuf from "arguebuf";
import OpenAI from "openai";
import { getSessionStorage } from "../storage";
import { getState } from "../store";

export type Mapping<U> = {
  [key in string]: U;
};

export async function generateAtomNodes(
  resources: Mapping<arguebuf.Resource>
): Promise<Array<arguebuf.AtomNodeConstructor>> {
  if (Object.keys(resources).length !== 1) {
    throw new Error("Only one resource is supported");
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

  const res = await fetchOpenAI(systemMessage, resourceText, {
    name: "generate_atom_nodes",
    description:
      "Generate a set of atom nodes (argumentative discourse units) from a resource",
    parameters: {
      title: "Generate atom nodes",
      description:
        "Generate a set of atom nodes (argumentative discourse units) from a resource",
      type: "object",
      properties: {
        atoms: {
          type: "array",
          items: {
            type: "string",
            description: "The text of the atom node (ADU)",
          },
        },
      },
    },
  });

  const functionArgs = JSON.parse(res.arguments);
  const atomTexts: Array<string> = functionArgs.atoms;
  const resourceTextLower = resourceText.toLowerCase();

  return atomTexts.map((generatedText) => {
    const text = generatedText.trim().replace(/[.,]$/, "");
    return {
      text,
      reference: new arguebuf.Reference({
        text,
        resource: resourceId,
        offset: resourceTextLower.indexOf(text.toLowerCase()),
      }),
    };
  });
}

async function fetchOpenAI(
  system_message: string,
  user_message: string,
  function_definition: OpenAI.FunctionDefinition
): Promise<OpenAI.ChatCompletionMessageToolCall.Function> {
  const { model, baseURL } = getState().openaiConfig;
  const apiKey = getSessionStorage<string>("openaiApiKey", "");

  if (apiKey === "") {
    throw new Error("OpenAI API key not found");
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
    throw new Error("Unexpected response from OpenAI");
  }

  return res.choices[0].message.tool_calls[0].function;
}
