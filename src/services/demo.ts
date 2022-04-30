import { v1 as uuid } from "uuid";
import * as cytoModel from "../model/cytoWrapper";

// STRESS TEST
// const nodes = [];
// const edges = [];

// for (let i = 0; i < 1000; i = i + 2) {
//   nodes.push(
//     {
//       data: cytoModel.node.initAtom(`Node ${i}`, `${i}`),
//     },
//     {
//       data: cytoModel.node.initAtom(`Node ${i + 1}`, `${i + 1}`),
//     }
//   );
//   edges.push({
//     data: cytoModel.edge.init(`${i}`, `${i + 1}`, `${i}-${i + 1}`),
//   });
// }

// const demoGraph: cytoModel.CytoGraph = {
//   elements: {
//     nodes,
//     edges,
//   },
//   data: cytoModel.graph.init(),
// };

function demoGraph(): cytoModel.CytoGraph {
  const resourceId = uuid();
  const resources = {
    [resourceId]: cytoModel.resource.init({
      text: "The major claim typically appears at the beginning, followed by multiple claims or premises.",
    }),
  };
  const participantId = uuid();
  const participants = {
    [participantId]: cytoModel.participant.init({ name: "John Doe" }),
  };

  const analysts = {
    [uuid()]: cytoModel.participant.init({ name: "Michael Web" }),
  };

  const nodes = [
    {
      data: cytoModel.node.initAtom({
        text: "This node represents the major claim of the argument.",
        reference: cytoModel.reference.init({
          text: "The major claim typically appears at the beginning",
          resource: resourceId,
          offset: 0,
        }),
      }),
    },
    {
      data: cytoModel.node.initAtom({
        text: "Here we have a premise that supports the claim.",
        reference: cytoModel.reference.init({
          text: "followed by multiple claims or premises",
          resource: resourceId,
          offset: 52,
        }),
      }),
    },
    {
      data: cytoModel.node.initAtom({
        text: "And another one that attacks it.",
      }),
    },
    {
      data: cytoModel.node.initScheme({
        scheme: { type: "support", value: cytoModel.node.Support.DEFAULT },
      }),
    },
    {
      data: cytoModel.node.initScheme({
        scheme: { type: "attack", value: cytoModel.node.Attack.DEFAULT },
      }),
    },
  ];

  const edges = [
    {
      data: cytoModel.edge.init({
        source: nodes[1].data.id,
        target: nodes[3].data.id,
      }),
    },
    {
      data: cytoModel.edge.init({
        source: nodes[3].data.id,
        target: nodes[0].data.id,
      }),
    },
    {
      data: cytoModel.edge.init({
        source: nodes[2].data.id,
        target: nodes[4].data.id,
      }),
    },
    {
      data: cytoModel.edge.init({
        source: nodes[4].data.id,
        target: nodes[0].data.id,
      }),
    },
  ];

  return {
    elements: {
      nodes,
      edges,
    },
    data: cytoModel.graph.init({
      majorClaim: nodes[0].data.id,
      resources,
      participants,
      analysts,
    }),
  };
}

export default demoGraph;
