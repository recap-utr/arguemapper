import * as arguebuf from "arguebuf";
import * as model from "@/model.js";

const TEXT =
  "The major claim typically appears at the beginning, followed by multiple claims or premises.";

export function generateDemo(): model.Graph {
  const graph = model.newGraph();
  const resource = new arguebuf.Resource({ text: TEXT });
  const participant = new arguebuf.Participant({ name: "John Doe" });
  const reference = (text: string) =>
    new arguebuf.Reference({ text, resource: resource.id, offset: TEXT.indexOf(text) });
  const claim = new arguebuf.AtomNode({
    text: "This node represents the major claim of the argument.",
    reference: reference("The major claim typically appears at the beginning"),
    participant: participant.id,
  });
  const premise = new arguebuf.AtomNode({
    text: "Here we have a premise that supports the claim.",
    reference: reference("followed by multiple claims or premises"),
  });
  const attack = new arguebuf.AtomNode({ text: "And another one that attacks it." });
  const support = new arguebuf.SchemeNode({ scheme: arguebuf.defaultScheme("support") });
  const conflict = new arguebuf.SchemeNode({ scheme: arguebuf.defaultScheme("attack") });

  graph.addResource(resource);
  graph.addParticipant(participant);
  graph.addAnalyst(new arguebuf.Analyst({ name: "Michael Web" }));

  for (const node of [claim, premise, attack, support, conflict]) {
    graph.addNode(node);
  }

  graph.connect([premise], support, claim);
  graph.connect([attack], conflict, claim);
  graph.majorClaim = claim.id;

  return graph;
}
