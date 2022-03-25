import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "@recap-utr/arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "@recap-utr/arg-services/google/protobuf/struct_pb";
import * as date from "../services/date";

export interface Resource {
  text: string;
  title?: string;
  source?: string;
  created: string;
  updated: string;
  metadata: JsonValue;
}

export function init(): Resource {
  const now = date.now();

  return {
    text: "",
    title: undefined,
    source: undefined,
    created: now,
    updated: now,
    metadata: {},
  };
}

export function toProtobuf(data: Resource): arguebuf.Resource {
  return {
    metadata: Struct.fromJson(data.metadata),
    text: data.text,
    title: data.title,
    source: data.source,
  };
}
