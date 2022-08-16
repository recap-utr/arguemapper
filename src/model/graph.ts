import { JsonObject } from "@protobuf-ts/runtime";
import * as arguebuf from "arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "arg-services/google/protobuf/struct_pb";
import argServices from "arg-services/package.json";
import * as analyst from "./analyst";
import { Edge } from "./edge";
import * as meta from "./metadata";
import { Node } from "./node";
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
  userdata: JsonObject;
}

export interface Props {
  nodes?: Array<Node>;
  edges?: Array<Edge>;
  resources?: { [x: string]: resource.Resource };
  participants?: { [x: string]: participant.Participant };
  majorClaim?: string;
  analysts?: { [x: string]: analyst.Analyst };
  libraryVersion?: string;
  schemaVersion?: number;
  metadata?: meta.Metadata;
  userdata?: JsonObject;
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

export function toProtobuf(
  obj: Graph
): Omit<arguebuf.Graph, "nodes" | "edges"> {
  return arguebuf.Graph.create({
    resources: Object.fromEntries(
      Object.entries(obj.resources).map(([k, v]) => [k, resource.toProtobuf(v)])
    ),
    participants: Object.fromEntries(
      Object.entries(obj.participants).map(([k, v]) => [
        k,
        participant.toProtobuf(v),
      ])
    ),
    majorClaim: obj.majorClaim,
    analysts: Object.fromEntries(
      Object.entries(obj.analysts).map(([k, v]) => [k, analyst.toProtobuf(v)])
    ),
    libraryVersion: obj.libraryVersion,
    schemaVersion: obj.schemaVersion,
    metadata: meta.toProtobuf(obj.metadata),
    userdata: Struct.fromJson(obj.userdata),
  });
}

export function fromProtobuf(
  obj: arguebuf.Graph
): Omit<Graph, "nodes" | "edges"> {
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
    userdata: obj.userdata ? (Struct.toJson(obj.userdata) as JsonObject) : {},
  };
}
