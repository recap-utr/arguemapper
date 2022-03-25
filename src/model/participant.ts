import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "@recap-utr/arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "@recap-utr/arg-services/google/protobuf/struct_pb";
import { Timestamp } from "@recap-utr/arg-services/google/protobuf/timestamp_pb";
import * as date from "../services/date";

export interface Participant {
  name?: string;
  username?: string;
  email?: string;
  url?: string;
  location?: string;
  description?: string;
  created: string;
  updated: string;
  metadata: JsonValue;
}

export function init(): Participant {
  const now = date.now();

  return {
    name: undefined,
    username: undefined,
    email: undefined,
    url: undefined,
    location: undefined,
    description: undefined,
    created: now,
    updated: now,
    metadata: {},
  };
}

export function toProtobuf(data: Participant): arguebuf.Participant {
  return {
    name: data.name,
    username: data.username,
    email: data.email,
    url: data.url,
    location: data.location,
    description: data.description,
    created: Timestamp.fromDate(date.instance(data.created)),
    updated: Timestamp.fromDate(date.instance(data.updated)),
    metadata: Struct.fromJson(data.metadata),
  };
}
