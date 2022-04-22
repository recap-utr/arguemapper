import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "@recap-utr/arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "@recap-utr/arg-services/google/protobuf/struct_pb";
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

export function init(
  name?: string,
  username?: string,
  email?: string,
  url?: string,
  location?: string,
  description?: string,
  metadata: JsonValue = {}
): Participant {
  const now = date.now();

  return {
    name,
    username,
    email,
    url,
    location,
    description,
    created: now,
    updated: now,
    metadata,
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
    created: date.toProtobuf(data.created),
    updated: date.toProtobuf(data.updated),
    metadata: Struct.fromJson(data.metadata),
  };
}

export function fromProtobuf(obj: arguebuf.Participant): Participant {
  return {
    name: obj.name,
    username: obj.username,
    email: obj.email,
    url: obj.url,
    location: obj.location,
    description: obj.description,
    created: date.fromProtobuf(obj.created),
    updated: date.fromProtobuf(obj.updated),
    metadata: obj.metadata ? Struct.toJson(obj.metadata) : {},
  };
}
