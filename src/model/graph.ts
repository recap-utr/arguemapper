import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "@recap-utr/arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "@recap-utr/arg-services/google/protobuf/struct_pb";
import { Timestamp } from "@recap-utr/arg-services/google/protobuf/timestamp_pb";
import argServices from "@recap-utr/arg-services/package.json";
import * as date from "../services/date";
import {
  Participant,
  toProtobuf as participantToProtobuf,
} from "./participant";
import { Resource, toProtobuf as resourceToProtobuf } from "./resource";

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
    created: Timestamp.fromDate(date.instance(data.created)),
    updated: Timestamp.fromDate(date.instance(data.updated)),
    metadata: Struct.fromJson(data.metadata),
  };
}
