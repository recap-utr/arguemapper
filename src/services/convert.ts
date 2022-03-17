import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "@recap-utr/arg-services/arg_services/graph/v1/graph_pb";
import * as aif from "../model/aif";
import * as cytoModel from "../model/cytoWrapper";

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
