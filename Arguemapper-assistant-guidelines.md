## Guidelines for Using the AI Assistant in Arguemapper

### How to Access

In the Inspector on the right, there is a tab labeled "Assistant" that can be opened by clicking.

This tab contains three fields: **API Key**, **Model**, and **Base URL**.

- **API Key:**
  - Paste a key (if necessary) into this field, e.g., your OpenAI API Key.
  - Billing (if necessary) will be tied to this key.

- **Model:**
  - Choose a model that will perform the actions.
  - Currently available by default: OpenAI models such as GPT(4o, 4o-mini, 4-Turbo, 4, 3.5-Turbo, 4o(latest)).
  - More models will become available over time, including the option to connect to privately hosted models (e.g., LLama by Meta).

- **Base URL:**
  - The Base URL of the AI model provider. By default, it points to OpenAI's services.

### Usage

You can click the Blue Action Button in the main UI, where you would also add new Scheme and Argument Nodes. Several options are available: **Generate Complete Graph**, **Extract ADUs**, **Identify Major Claim**, and **Predict Relations**.

- **Generate Complete Graph:**
  - Extracts the Major Claim, Arguments, and predicts their relations directly.
  - The AI uses the Text Resource on the left; if it is empty, no extraction will occur.
  - It only uses the currently visible text resource and ignores any others if multiple exist.
  - Errors are more likely in this option compared to others, as the AI takes over the entire process.

- **Extract ADUs:**
  - Only extracts the Argument Nodes.
  - Existing Nodes in the UI will be deleted during this process.
  - Custom Instructions that request the model to keep certain nodes (e.g., a Major Claim) may result in errors.

- **Identify Major Claim:**
  - Identifies the Major Claim.
  - Searches only within existing Argument Nodes. If no nodes exist, an error will result.

- **Predict Relations:**
  - Predicts relations (Scheme Nodes) between existing Argument Nodes.
  - Occasionally, not all Argument Nodes will be connected in a single Graph, so manual checking is required after the action.

When selecting one of these options, a dialog will open, allowing you to include a **Custom Instruction Prompt**. The model will follow this instruction, significantly impacting the results.

### Example Workflows

1. First, load or paste a Text Resource, identify the Major Claim and Arguments, and then predict their relations to save time connecting them manually. Afterward, review the relations for accuracy.
   
2. Load/paste a Text Resource, generate the complete graph, and then check for errors.

### Disclaimer and Tips

The AI models available can significantly speed up the creation of Argument Graphs but are prone to errors and are not deterministic. The same input and Custom Instruction Prompt will almost never yield identical results. If something goes wrong, try multiple attempts—at least twice. The results however are probabilistic, a well-crafted Custom Instruction that has previously worked well will generally continue to yield better results, even if it occasionally fails.

If you are using or experimenting with a Custom Intruction it is helpful to edit it within a text editor and copy-pasting it into the dialog, in case of an error the Instruction gets lost, so this saves time in rewriting it.

Prompt engineering has a significant impact on the final results, but it is not necessary for getting acceptable outcomes. The default settings are usually sufficient. More information and examples on Prompts will follow later in this documentation.

Model performance varies widely. For example, GPT-3.5-Turbo often performs significantly worse than GPT-4, but can still be useful in some scenarios. Always consider the trade-off between cost and performance. For instance, generating a Complete Graph with GPT-4 costs roughly $0.015 - $0.03 (as of September 2024).

### Custom Instruction Prompt Engineering Tips

While the software works well without Custom Instructions, creating specific instructions can sometimes be beneficial. This is especially true when dealing with a dataset containing similarly structured texts. You can use a Prompt to guide the model around the general structure of the text, improving performance significantly. Providing solved examples can also be helpful, so the model doesn’t have to solve the problem from scratch (zero-shot). It may take a few trials to find which prompt works best, as even slight changes to the Prompt can lead to dramatically different outcomes. For instance, even missing or different punctuation can have a significant impact.

**Predicting Relations** often works best without a prompt, compared to other assistance tasks, but improvements can still be made here too.

Since LLMs (like GPT-4o) behave unpredictably compared to typical software, it’s often better to think of them differently when writing prompts. A useful approach can be to imagine the assistant as an overworked but knowledgeable intern. Sometimes, telling a model to behave a certain way doesn’t work unless you repeat the instruction multiple times in different ways. If the author of the prompt wouldn’t know how to respond to it, then the prompt likely won’t result in good performance.

Prompts can also introduce errors. Sometimes the model does not follow the structure given in a prompt, especially when told to adhere to a specific format in its responses.

### Example Custom Instruction Prompts:
```txt
Firstly look for the correct major claim, this can be usually found at the end of the given essay, eg "in conclusion i think xyz is good" then the major claim would be "xyz is good" and the arguments are there to exacerbate this.
Rather retrive less arguments than too many, i can still add any missing one manually afterwards. Think step by step.
```
This prompt was used for a dataset where the major claim of the argument is very often found at the same position in the text and in a fairly similar style, if the position varies over multiple texts it is useful to change the prompt accordingly (eg found at the start instead of found at the end).

As explained earlier, at times it’s useful to give out an example of a piece of data and it's solved Graph. Since visual inputs are not possible as of now, you need to encode the solution into text. You could for example mark Argument Nodes with a # in front, and explain their relations between each other in ( ), as long as a human could read and understand the encoding you’ve chosen the models likely will too.
The following example combines this approach with the previous example (since it is an original data piece it contains spelling errors):


```txt
Firstly look for the correct major claim, this can be usually found at the end of the given essay, eg "in conclusion i think xyz is good" then the major claim would be "xyz is good" and the arguments are there to exacerbate this.
Rather retrive less arguments than too many, i can still add any missing one manually afterwards. Think step by step.
Ill give you an example of how i would do it, first youll get the original text, and then my extractions, first the major claim, followed by connection information eg -(support to main claim) means the connection goes to the main claim as a support, # signifies an individual argument:

Original text:
Many people believe that children should study at school to have more knowledge that prepare better for their future. Others, however, think that these children may disrupt their school work and should be allowed to leave school early to find a job. Personally, I tend to agree with the point of view that student have to be forced to study at school.
First of all, schools offer to students a good environment with experienced professors and high quality programs for studying. It creates the best conditions for students education and can force them to focus on their school work instead of wasting their time to do useless things. Second of all, schools provide lots of academic knowledge to students. Students may learn professional skills, expand their understandings and gain experiences. Therefore, they have more opprotunities to find a job and to be successful in the future. For example, as we know, employer always prefer to hire an employee of high degree who have professional skills.
Nevertheless, it is not unreasonable that some people think that children should interrupt their school work and get a job. Whether children can learn a lot at school, there are many subjects that will be of little value to them in the future. Furthermore, children can learn social skills when they have a job. They can get more experiences that can not be obtained at school. Working helps children be more independent and teach them to esteem and manage the money that they've earned.
Overall, I believe that students should study at school. Even though there are some advantages of leaving school to find a job, studying at school is always the best choice for children's future. There are many ways that can train children to learn independent and social skills instead of getting a job.
#####
My extractions:
(custom main claim formed out of the opinion of the essay)
Main claim: Students should study at school and not take a job early by dropping out
arguments:
-(attack on main claim)
#Whether children can learn a lot at school, there are many subjects that will be of little value to them in the future
-(support for previous argument)
#Working helps children be more independent and teach them to esteem and manage the money that they've earned
#They can get more experiences that can not be obtained at school
#children can learn social skills when they have a job
-(support on main claim)
#schools provide lots of academic knowledge to students
-(support for previous argument)
#they have more opprotunities to find a job and to be successful in the future
-(support for main claim)
#schools offer to students a good environment with experienced professors and high quality programs for studying
```

Note that the shown approaches are not proven to be optimal, but resulted in often successful annotations nevertheless when generating a complete graph.
Also note that with specifically fine-tuned models prompts and results will vary massively, the same will likely be true for upcoming reasoning models like OpenAIs o1 series, prompt behaviour and model performance also changes unpredictably within the same model if said model gets updated by their Owners, therefore you need to specify when a prompt worked exactly, to have a fallback strategy in case of an update.
If you have trouble coming up with a prompt, the models themselves, wherever they are accessible, can also help you craft some as a starting point.
