import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "arg-services/google/protobuf/struct_pb";
import { v1 as uuid } from "uuid";
import * as aif from "./aif";
import * as meta from "./metadata";

export interface Edge {
  id: string;
  source: string;
  target: string;
  metadata: meta.Metadata;
  userdata: JsonValue;
}

export interface Props {
  id?: string;
  source: string;
  target: string;
  metadata?: meta.Metadata;
  userdata?: JsonValue;
}

export function init({ id, source, target, metadata, userdata }: Props): Edge {
  return {
    id: id ?? uuid(),
    source,
    target,
    metadata: metadata ?? meta.init({}),
    userdata: userdata ?? {},
  };
}

export function toProtobuf(data: Edge): arguebuf.Edge {
  return {
    source: data.source,
    target: data.target,
    metadata: meta.toProtobuf(data.metadata),
    userdata: Struct.fromJson(data.userdata),
  };
}

export function toAif(data: Edge): aif.Edge {
  return {
    edgeID: data.id,
    fromID: data.source,
    toID: data.target,
    formEdgeID: null,
  };
}

export function fromAif(obj: aif.Edge): Edge {
  return {
    id: obj.edgeID,
    source: obj.fromID,
    target: obj.toID,
    metadata: meta.init({}),
    userdata: {},
  };
}

export function fromProtobuf(id: string, obj: arguebuf.Edge): Edge {
  return {
    id,
    source: obj.source,
    target: obj.target,
    metadata: obj.metadata ? meta.fromProtobuf(obj.metadata) : meta.init({}),
    userdata: obj.userdata ? Struct.toJson(obj.userdata) : {},
  };
}

export default Edge;
