import { JsonObject } from "@protobuf-ts/runtime";
import * as arguebuf from "arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "arg-services/google/protobuf/struct_pb";
import * as meta from "./metadata";

export interface Resource {
  text: string;
  title?: string;
  source?: string;
  metadata: meta.Metadata;
  userdata: JsonObject;
}

interface Props {
  text: string;
  title?: string;
  source?: string;
  metadata?: meta.Metadata;
  userdata?: JsonObject;
}

export function init({
  text,
  title,
  source,
  metadata,
  userdata,
}: Props): Resource {
  return {
    text,
    title,
    source,
    metadata: metadata ?? meta.init({}),
    userdata: userdata ?? {},
  };
}

export function toProtobuf(data: Resource): arguebuf.Resource {
  return arguebuf.Resource.create({
    text: data.text,
    title: data.title,
    source: data.source,
    metadata: meta.toProtobuf(data.metadata),
    userdata: Struct.fromJson(data.userdata),
  });
}

export function fromProtobuf(obj: arguebuf.Resource): Resource {
  return {
    text: obj.text,
    title: obj.title,
    source: obj.source,
    metadata: obj.metadata ? meta.fromProtobuf(obj.metadata) : meta.init({}),
    userdata: obj.userdata ? (Struct.toJson(obj.userdata) as JsonObject) : {},
  };
}
