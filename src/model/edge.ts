import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "@recap-utr/arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "@recap-utr/arg-services/google/protobuf/struct_pb";
import { v1 as uuid } from "uuid";
import * as date from "../services/date";
import * as aif from "./aif";

export interface Edge {
  id: string;
  source: string;
  target: string;
  created: string;
  updated: string;
  metadata: JsonValue;
}

export function init(source: string, target: string, id?: string): Edge {
  const now = date.now();

  return {
    id: id ?? uuid(),
    source,
    target,
    created: now,
    updated: now,
    metadata: {},
  };
}

export function toProtobuf(data: Edge): arguebuf.Edge {
  return {
    source: data.source,
    target: data.target,
    created: date.toProtobuf(data.created),
    updated: date.toProtobuf(data.updated),
    metadata: Struct.fromJson(data.metadata),
  };
}

export function toAif(data: Edge): aif.Edge {
  return {
    edgeID: data.id,
    fromID: data.source,
    toID: data.target,
    formEdgeID: "",
  };
}

export function fromAif(obj: aif.Edge): Edge {
  const now = date.now();

  return {
    id: obj.edgeID,
    source: obj.fromID,
    target: obj.toID,
    created: now,
    updated: now,
    metadata: {},
  };
}

export function fromProtobuf(id: string, obj: arguebuf.Edge): Edge {
  return {
    id,
    source: obj.source,
    target: obj.target,
    created: date.fromProtobuf(obj.created),
    updated: date.fromProtobuf(obj.updated),
    metadata: obj.metadata ? Struct.toJson(obj.metadata) : {},
  };
}
