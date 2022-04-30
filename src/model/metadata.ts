import * as arguebuf from "arg-services/arg_services/graph/v1/graph_pb";
import * as date from "../services/date";

export interface Metadata {
  created: string;
  updated: string;
}

export interface Props {
  created?: string;
  updated?: string;
}

export function init({ created, updated }: Props): Metadata {
  const now = date.now();

  return {
    created: created ?? now,
    updated: updated ?? now,
  };
}

export function toProtobuf(data: Metadata): arguebuf.Metadata {
  return {
    created: date.toProtobuf(data.created),
    updated: date.toProtobuf(data.updated),
  };
}

export function fromProtobuf(obj: arguebuf.Metadata): Metadata {
  return {
    created: date.fromProtobuf(obj.created),
    updated: date.fromProtobuf(obj.updated),
  };
}
