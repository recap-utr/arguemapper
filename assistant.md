# Using the AI Assistant in ArgueMapper

The assistant is a chat that reads and edits the argument graph for you.
It runs in your browser and talks directly to the model provider you configure, so the texts and the graph are sent to that provider.

## Setup

Open the **Assistant** panel with the buttons at the top right of the canvas.
The model name in the toolbar of the message field opens its settings:

- **API Key**: the key of your provider, billing is tied to it.
  It is only kept until the browser tab is closed and has to be entered again in a new one.
  Local servers usually need none.
- **Model**: the model that performs the actions, e.g. one of the [OpenAI models](https://platform.openai.com/docs/models).
  Choose a model that supports tool calls.
- **Base URL**: the provider, OpenAI by default.
  Any server implementing the OpenAI Chat Completions API works, e.g. llama.cpp, Ollama, or vLLM, as does the Anthropic API.
- **Reasoning**: the reasoning effort of models that support it.

Apps that embed ArgueMapper may fix some of these settings, which are then not shown.

## Usage

Write a message or pick one of the suggestions of an empty conversation:

- **Generate full graph**: clears the graph, then extracts the claims of the shown text, identifies the main claim, and connects them.
- **Extract ADUs**: clears the graph and adds the claims of the shown text.
- **Identify major claim**: picks the main claim among the existing claims.
- **Predict relations**: connects the existing claims into a hierarchical graph rooted at the main claim.
- **Clean up structure**: fixes unconnected claims, cycles, and claims not connected to the main claim.

The assistant uses the text shown in the **Text** panel, quotes claims verbatim from it, and can look up background information on Wikipedia.
Elements it created or changed show its explanation in the **Details** panel, and exported files record which model created them.
Every edit can be undone, and the pen in the toolbar of the message field starts a new conversation.

## Workflows

1. Annotate the main claim and the claims yourself, then let the assistant **predict the relations** and review them.
   In our experience, this saves the most time with the fewest errors.
2. **Generate the full graph** and correct it afterwards.
   This has the highest error rate, since one misstep early on affects large parts of the graph.
3. Set the main claim yourself and ask the assistant to extract the claims supporting or attacking it.

Hints about the structure of your texts improve the results, e.g. "The main claim is usually stated in the last paragraph" or "Only extract statements that can be argued for, not facts or reported speech".
For a collection of similar texts, a solved example in the message helps as well.

## Tips

- The results are not deterministic, the same message may yield different graphs, so retry if a result is off.
- Always review the graph, models sometimes paraphrase or invent text, especially weaker ones.
- Texts that are hard to analyze for humans are hard for models as well.
- Stronger models produce better graphs but cost more, so weigh cost against quality for your use case.
