import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "arg-services/google/protobuf/struct_pb";
import argServices from "arg-services/package.json";
import * as analyst from "./analyst";
import * as meta from "./metadata";
import * as participant from "./participant";
import * as resource from "./resource";

export interface Graph {
  resources: { [x: string]: resource.Resource };
  participants: { [x: string]: participant.Participant };
  majorClaim?: string;
  analysts: { [x: string]: analyst.Analyst };
  libraryVersion: string;
  schemaVersion: number;
  metadata: meta.Metadata;
  userdata: JsonValue;
}

export interface Props {
  resources?: { [x: string]: resource.Resource };
  participants?: { [x: string]: participant.Participant };
  majorClaim?: string;
  analysts?: { [x: string]: analyst.Analyst };
  libraryVersion?: string;
  schemaVersion?: number;
  metadata?: meta.Metadata;
  userdata?: JsonValue;
}

export function init({
  resources,
  participants,
  majorClaim,
  analysts,
  metadata,
  userdata,
}: Props): Graph {
  return {
    metadata: metadata ?? meta.init({}),
    userdata: userdata ?? {},
    resources: resources ?? {},
    participants: participants ?? {},
    analysts: analysts ?? {},
    majorClaim: majorClaim,
    libraryVersion: argServices.version,
    schemaVersion: 1,
  };
}

export function toProtobuf(data: Graph): arguebuf.Graph {
  return arguebuf.Graph.create({
    resources: Object.fromEntries(
      Object.entries(data.resources).map(([k, v]) => [
        k,
        resource.toProtobuf(v),
      ])
    ),
    participants: Object.fromEntries(
      Object.entries(data.participants).map(([k, v]) => [
        k,
        participant.toProtobuf(v),
      ])
    ),
    majorClaim: data.majorClaim,
    analysts: Object.fromEntries(
      Object.entries(data.analysts).map(([k, v]) => [k, analyst.toProtobuf(v)])
    ),
    libraryVersion: data.libraryVersion,
    schemaVersion: data.schemaVersion,
    metadata: meta.toProtobuf(data.metadata),
    userdata: Struct.fromJson(data.userdata),
  });
}

export function fromProtobuf(obj: arguebuf.Graph): Graph {
  return {
    resources: Object.fromEntries(
      Object.entries(obj.resources).map(([k, v]) => [
        k,
        resource.fromProtobuf(v),
      ])
    ),
    participants: Object.fromEntries(
      Object.entries(obj.participants).map(([k, v]) => [
        k,
        participant.fromProtobuf(v),
      ])
    ),
    majorClaim: obj.majorClaim,
    analysts: Object.fromEntries(
      Object.entries(obj.analysts).map(([k, v]) => [k, analyst.fromProtobuf(v)])
    ),
    libraryVersion: obj.libraryVersion,
    schemaVersion: obj.schemaVersion,
    metadata: obj.metadata ? meta.fromProtobuf(obj.metadata) : meta.init({}),
    userdata: obj.userdata ? Struct.toJson(obj.userdata) : {},
  };
}
