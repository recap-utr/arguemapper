import { JsonObject } from "@protobuf-ts/runtime";
import * as arguebuf from "arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "arg-services/google/protobuf/struct_pb";
import { Edge as FlowEdge } from "reactflow";
import { v1 as uuid } from "uuid";
import * as aif from "./aif";
import * as meta from "./metadata";

export type Edge = FlowEdge<EdgeData>;

export interface EdgeData {
  metadata: meta.Metadata;
  userdata: JsonObject;
}

export interface Props {
  id?: string;
  source: string;
  target: string;
  metadata?: meta.Metadata;
  userdata?: JsonObject;
}

export function init({ id, source, target, metadata, userdata }: Props): Edge {
  return {
    id: id ?? uuid(),
    source,
    target,
    data: {
      metadata: metadata ?? meta.init({}),
      userdata: userdata ?? {},
    },
  };
}

export function toProtobuf(edge: Edge): arguebuf.Edge {
  return {
    source: edge.source,
    target: edge.target,
    metadata: meta.toProtobuf(edge.data?.metadata ?? meta.init({})),
    userdata: Struct.fromJson(edge.data?.userdata ?? {}),
  };
}

export function toAif(edge: Edge): aif.Edge {
  return {
    edgeID: edge.id,
    fromID: edge.source,
    toID: edge.target,
    formEdgeID: null,
  };
}

export function fromAif(obj: aif.Edge): Edge {
  return {
    id: obj.edgeID,
    source: obj.fromID,
    target: obj.toID,
    data: {
      metadata: meta.init({}),
      userdata: {},
    },
  };
}

export function fromProtobuf(id: string, obj: arguebuf.Edge): Edge {
  return {
    id,
    source: obj.source,
    target: obj.target,
    data: {
      metadata: obj.metadata ? meta.fromProtobuf(obj.metadata) : meta.init({}),
      userdata: obj.userdata ? (Struct.toJson(obj.userdata) as JsonObject) : {},
    },
  };
}

export default Edge;
