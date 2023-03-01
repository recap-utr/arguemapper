import * as arguebuf from "arguebuf";
import { uuid } from "arguebuf";
import * as model from "../model.js";

export function generateDemo(): model.Wrapper {
  const resourceId = uuid();
  const resources = {
    [resourceId]: new arguebuf.Resource({
      text: "The major claim typically appears at the beginning, followed by multiple claims or premises.",
    }),
  };
  const participantId = uuid();
  const participants = {
    [participantId]: new arguebuf.Participant({ name: "John Doe" }),
  };

  const analysts = {
    [uuid()]: new arguebuf.Analyst({ name: "Michael Web" }),
  };

  const nodes = [
    model.initAtom({
      data: {
        text: "This node represents the major claim of the argument.",
        reference: new arguebuf.Reference({
          text: "The major claim typically appears at the beginning",
          resource: resourceId,
          offset: 0,
        }),
      },
    }),
    model.initAtom({
      data: {
        text: "Here we have a premise that supports the claim.",
        reference: new arguebuf.Reference({
          text: "followed by multiple claims or premises",
          resource: resourceId,
          offset: 52,
        }),
      },
    }),
    model.initAtom({
      data: {
        text: "And another one that attacks it.",
      },
    }),
    model.initScheme({
      data: {
        scheme: {
          value: arguebuf.Support.DEFAULT,
          case: "support",
        },
      },
    }),
    model.initScheme({
      data: {
        scheme: {
          value: arguebuf.Attack.DEFAULT,
          case: "attack",
        },
      },
    }),
  ];

  const edges = [
    model.initEdge({
      data: {},
      source: nodes[1].id,
      target: nodes[3].id,
    }),
    model.initEdge({
      data: {},
      source: nodes[3].id,
      target: nodes[0].id,
    }),
    model.initEdge({
      data: {},
      source: nodes[2].id,
      target: nodes[4].id,
    }),
    model.initEdge({
      data: {},
      source: nodes[4].id,
      target: nodes[0].id,
    }),
  ];

  return model.initWrapper({
    nodes,
    edges,
    graph: new arguebuf.Graph({
      majorClaim: nodes[0].id,
      resources,
      participants,
      analysts,
    }),
  });
}
