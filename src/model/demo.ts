import * as cytoModel from "./cytoModel";

const demoGraph: cytoModel.Wrapper = {
  elements: {
    nodes: [
      {
        data: {
          id: "a1",
          kind: "atom",
          metadata: {},
          text: "Every person is going to die",
          // resources: [],
          created: new Date(),
          updated: new Date(),
        },
      },
      {
        data: {
          id: "a2",
          kind: "atom",
          metadata: {},
          text: "This is a fact",
          // resources: [],
          created: new Date(),
          updated: new Date(),
        },
      },
      {
        data: {
          id: "a3",
          kind: "atom",
          metadata: {},
          text: "Single node",
          // resources: [],
          created: new Date(),
          updated: new Date(),
        },
      },
      {
        data: {
          id: "s1",
          kind: "scheme",
          metadata: {},
          type: cytoModel.node.Type.RA,
          // scheme: null,
          created: new Date(),
          updated: new Date(),
        },
      },
    ],
    edges: [
      {
        data: {
          id: "e1",
          metadata: {},
          source: "a2",
          target: "s1",
          created: new Date(),
          updated: new Date(),
        },
      },
      {
        data: {
          id: "e2",
          metadata: {},
          source: "s1",
          target: "a1",
          created: new Date(),
          updated: new Date(),
        },
      },
    ],
  },
  data: {
    created: new Date(),
    updated: new Date(),
    // majorClaim: null,
    id: "94a975db-25ae-4d25-93cc-1c07c932e2f9",
    metadata: {},
    resources: [],
  },
};

export default demoGraph;
