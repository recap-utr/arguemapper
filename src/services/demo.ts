import { v1 as uuid } from "uuid";
import * as model from "../model";

function demoGraph(): model.Wrapper {
  const resourceId = uuid();
  const resources = {
    [resourceId]: model.initResource({
      text: "The major claim typically appears at the beginning, followed by multiple claims or premises.",
    }),
  };
  const participantId = uuid();
  const participants = {
    [participantId]: model.initParticipant({ name: "John Doe" }),
  };

  const analysts = {
    [uuid()]: model.initParticipant({ name: "Michael Web" }),
  };

  const nodes = [
    model.node.initAtom({
      text: "This node represents the major claim of the argument.",
      reference: model.initReference({
        text: "The major claim typically appears at the beginning",
        resource: resourceId,
        offset: 0,
      }),
    }),
    model.node.initAtom({
      text: "Here we have a premise that supports the claim.",
      reference: model.initReference({
        text: "followed by multiple claims or premises",
        resource: resourceId,
        offset: 52,
      }),
    }),
    model.node.initAtom({
      text: "And another one that attacks it.",
    }),
    model.node.initScheme({
      scheme: {
        type: model.node.SchemeType.SUPPORT,
        value: model.node.Support.DEFAULT,
      },
    }),
    model.node.initScheme({
      scheme: {
        type: model.node.SchemeType.ATTACK,
        value: model.node.Attack.DEFAULT,
      },
    }),
  ];

  const edges = [
    model.initEdge({
      source: nodes[1].id,
      target: nodes[3].id,
    }),
    model.initEdge({
      source: nodes[3].id,
      target: nodes[0].id,
    }),
    model.initEdge({
      source: nodes[2].id,
      target: nodes[4].id,
    }),
    model.initEdge({
      source: nodes[4].id,
      target: nodes[0].id,
    }),
  ];

  return model.initWrapper({
    nodes,
    edges,
    graph: model.initGraph({
      majorClaim: nodes[0].id,
      resources,
      participants,
      analysts,
    }),
  });
}

export default demoGraph;
