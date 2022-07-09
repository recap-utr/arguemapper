import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "arg-services/google/protobuf/struct_pb";
import argServices from "arg-services/package.json";
import * as aif from "./aif";
import * as analyst from "./analyst";
import * as edge from "./edge";
import { Edge } from "./edge";
import * as meta from "./metadata";
import * as node from "./node";
import { Node } from "./node";
import * as participant from "./participant";
import * as resource from "./resource";

export interface Graph {
  nodes: Array<Node>;
  edges: Array<Edge>;
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
  nodes?: Array<Node>;
  edges?: Array<Edge>;
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
  nodes,
  edges,
  resources,
  participants,
  majorClaim,
  analysts,
  metadata,
  userdata,
}: Props): Graph {
  return {
    nodes: nodes ?? [],
    edges: edges ?? [],
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

export function toAif(obj: Graph): aif.Graph {
  return {
    nodes: obj.nodes.map((n) => node.toAif(n)),
    edges: obj.edges.map((e) => edge.toAif(e)),
    locutions: [],
  };
}

export function fromAif(obj: aif.Graph): Graph {
  const nodes = obj.nodes
    .map((n) => node.fromAif(n))
    .filter((n): n is Node => !!n);
  const nodeIds = new Set(nodes.map((node) => node.id));

  const edges = obj.edges
    .filter((e) => nodeIds.has(e.fromID) && nodeIds.has(e.toID))
    .map((e) => edge.fromAif(e));

  return init({
    nodes,
    edges,
  });
}

export function toProtobuf(obj: Graph): arguebuf.Graph {
  return arguebuf.Graph.create({
    nodes: Object.fromEntries(obj.nodes.map((n) => [n.id, node.toProtobuf(n)])),
    edges: Object.fromEntries(obj.edges.map((e) => [e.id, edge.toProtobuf(e)])),
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

export function fromProtobuf(obj: arguebuf.Graph): Graph {
  return {
    nodes: Object.entries(obj.nodes).map(([id, n]) => node.fromProtobuf(id, n)),
    edges: Object.entries(obj.edges).map(([id, e]) => edge.fromProtobuf(id, e)),
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
