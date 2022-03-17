import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "@recap-utr/arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "@recap-utr/arg-services/google/protobuf/struct_pb";
import { Timestamp } from "@recap-utr/arg-services/google/protobuf/timestamp_pb";
import { v1 as uuid } from "uuid";
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
  const date = new Date().toISOString();

  return {
    id: id ?? uuid(),
    source,
    target,
    created: date,
    updated: date,
    metadata: {},
  };
}

export function toProtobuf(data: Edge): arguebuf.Edge {
  return {
    source: data.source,
    target: data.target,
    created: Timestamp.fromDate(new Date(data.created)),
    updated: Timestamp.fromDate(new Date(data.updated)),
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
