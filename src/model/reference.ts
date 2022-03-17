import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "@recap-utr/arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "@recap-utr/arg-services/google/protobuf/struct_pb";

export interface Reference {
  resource?: string;
  offset?: number;
  text: string;
  metadata: JsonValue;
}

export function init(
  text: string,
  resource?: string,
  offset?: number
): Reference {
  return {
    resource,
    offset,
    text,
    metadata: {},
  };
}

export function toProtobuf(data: Reference): arguebuf.Reference {
  return {
    text: data.text,
    resource: data.resource,
    offset: BigInt(data.offset),
    metadata: Struct.fromJson(data.metadata),
  };
}
