import { JsonObject, Struct } from "@bufbuild/protobuf";
import { version as argServicesVersion } from "arg-services";
import * as arguebuf from "arg-services/graph/v1/graph_pb";
import * as analyst from "./analyst.js";
import { Edge } from "./edge.js";
import * as meta from "./metadata.js";
import { Node } from "./node.js";
import * as participant from "./participant.js";
import * as resource from "./resource.js";

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
    libraryVersion: argServicesVersion,
    schemaVersion: 1,
  };
}

export function toProtobuf(
  obj: Graph
): Omit<arguebuf.Graph, "nodes" | "edges"> {
  return new arguebuf.Graph({
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
    userdata: obj.userdata ? (obj.userdata.toJson() as JsonObject) : {},
  };
}
