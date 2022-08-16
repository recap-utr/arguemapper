import { JsonObject } from "@protobuf-ts/runtime";
import * as arguebuf from "arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "arg-services/google/protobuf/struct_pb";
import * as meta from "./metadata";

export interface Participant {
  name?: string;
  username?: string;
  email?: string;
  url?: string;
  location?: string;
  description?: string;
  metadata: meta.Metadata;
  userdata: JsonObject;
}

interface Props {
  name?: string;
  username?: string;
  email?: string;
  url?: string;
  location?: string;
  description?: string;
  metadata?: meta.Metadata;
  userdata?: JsonObject;
}

export function init({
  name,
  username,
  email,
  url,
  location,
  description,
  metadata,
  userdata,
}: Props): Participant {
  return {
    name,
    username,
    email,
    url,
    location,
    description,
    metadata: metadata ?? meta.init({}),
    userdata: userdata ?? {},
  };
}

export function toProtobuf(data: Participant): arguebuf.Participant {
  return arguebuf.Participant.create({
    name: data.name,
    username: data.username,
    email: data.email,
    url: data.url,
    location: data.location,
    description: data.description,
    metadata: meta.toProtobuf(data.metadata),
    userdata: Struct.fromJson(data.userdata),
  });
}

export function fromProtobuf(obj: arguebuf.Participant): Participant {
  return {
    name: obj.name,
    username: obj.username,
    email: obj.email,
    url: obj.url,
    location: obj.location,
    description: obj.description,
    metadata: obj.metadata ? meta.fromProtobuf(obj.metadata) : meta.init({}),
    userdata: obj.userdata ? (Struct.toJson(obj.userdata) as JsonObject) : {},
  };
}
