import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "@recap-utr/arg-services/arg_services/graph/v1/graph_pb";
import * as aif from "../model/aif";
import * as cytoModel from "../model/cytoWrapper";

export function importGraph(obj: any): cytoModel.CytoGraph {
  if (obj.louctions) {
    return aif2cyto(obj);
  } else {
    return proto2cyto(obj);
  }
}

export function proto2json(graph: arguebuf.Graph): JsonValue {
  return arguebuf.Graph.toJson(graph);
}

export function json2proto(graph: JsonValue): arguebuf.Graph {
  return arguebuf.Graph.fromJson(graph);
}

export function cyto2protobuf(cyto: cytoModel.CytoGraph): arguebuf.Graph {
  return {
    ...cytoModel.graph.toProtobuf(cyto.data),
    nodes: Object.fromEntries(
      cyto.elements.nodes.map((node) => [
        node.data.id,
        cytoModel.node.toProtobuf(node.data),
      ])
    ),
    edges: Object.fromEntries(
      cyto.elements.edges.map((edge) => [
        edge.data.id,
        cytoModel.edge.toProtobuf(edge.data),
      ])
    ),
  };
}

export function cyto2aif(cyto: cytoModel.CytoGraph): aif.Graph {
  return {
    nodes: cyto.elements.nodes.map((node) => cytoModel.node.toAif(node.data)),
    edges: cyto.elements.edges.map((edge) => cytoModel.edge.toAif(edge.data)),
    locutions: [],
  };
}

function aif2cyto(obj: aif.Graph): cytoModel.CytoGraph {
  return {
    data: {
      ...cytoModel.graph.init(),
    },
    elements: {
      nodes: obj.nodes.map((node) => ({ data: cytoModel.node.fromAif(node) })),
      edges: obj.edges.map((edge) => ({ data: cytoModel.edge.fromAif(edge) })),
    },
  };
}

function proto2cyto(obj: arguebuf.Graph): cytoModel.CytoGraph {
  return {
    data: {
      ...cytoModel.graph.fromProtobuf(obj),
    },
    elements: {
      nodes: Object.entries(obj.nodes).map(([id, node]) => ({
        data: cytoModel.node.fromProtobuf(id, node),
      })),
      edges: Object.entries(obj.edges).map(([id, edge]) => ({
        data: cytoModel.edge.fromProtobuf(id, edge),
      })),
    },
  };
}
