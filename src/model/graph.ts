import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "@recap-utr/arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "@recap-utr/arg-services/google/protobuf/struct_pb";
import argServices from "@recap-utr/arg-services/package.json";
import * as date from "../services/date";
import {
  fromProtobuf as participantFromProtobuf,
  Participant,
  toProtobuf as participantToProtobuf,
} from "./participant";
import {
  fromProtobuf as resourceFromProtobuf,
  Resource,
  toProtobuf as resourceToProtobuf,
} from "./resource";

export interface Graph {
  resources: { [x: string]: Resource };
  participants: { [x: string]: Participant };
  majorClaim?: string;
  analysts: Participant[];
  version: string;
  created: string;
  updated: string;
  metadata: JsonValue;
}

export function init(): Graph {
  const now = date.now();

  return {
    created: now,
    updated: now,
    metadata: {},
    resources: {},
    participants: {},
    analysts: [],
    version: argServices.version,
  };
}

export function toProtobuf(
  data: Graph
): Omit<arguebuf.Graph, "nodes" | "edges"> {
  return {
    resources: Object.fromEntries(
      Object.entries(data.resources).map(([k, v]) => [k, resourceToProtobuf(v)])
    ),
    participants: Object.fromEntries(
      Object.entries(data.participants).map(([k, v]) => [
        k,
        participantToProtobuf(v),
      ])
    ),
    majorClaim: data.majorClaim,
    analysts: data.analysts.map((v) => participantToProtobuf(v)),
    version: data.version,
    created: date.toProtobuf(data.created),
    updated: date.toProtobuf(data.updated),
    metadata: Struct.fromJson(data.metadata),
  };
}

export function fromProtobuf(obj: arguebuf.Graph): Graph {
  return {
    resources: Object.fromEntries(
      Object.entries(obj.resources).map(([k, v]) => [
        k,
        resourceFromProtobuf(v),
      ])
    ),
    participants: Object.fromEntries(
      Object.entries(obj.participants).map(([k, v]) => [
        k,
        participantFromProtobuf(v),
      ])
    ),
    majorClaim: obj.majorClaim,
    analysts: obj.analysts.map((v) => participantFromProtobuf(v)),
    version: obj.version,
    created: date.fromProtobuf(obj.created),
    updated: date.fromProtobuf(obj.updated),
    metadata: obj.metadata ? Struct.toJson(obj.metadata) : {},
  };
}
