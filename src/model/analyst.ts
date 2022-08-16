import { JsonObject } from "@protobuf-ts/runtime";
import * as arguebuf from "arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "arg-services/google/protobuf/struct_pb";

export interface Analyst {
  name?: string;
  email?: string;
  userdata: JsonObject;
}

export interface Props {
  name?: string;
  email?: string;
  userdata?: JsonObject;
}

export function init({ name, email, userdata }: Props): Analyst {
  return {
    name,
    email,
    userdata: userdata ?? {},
  };
}

export function toProtobuf(data: Analyst): arguebuf.Analyst {
  return arguebuf.Analyst.create({
    name: data.name,
    email: data.email,
    userdata: Struct.fromJson(data.userdata),
  });
}

export function fromProtobuf(obj: arguebuf.Analyst): Analyst {
  return {
    name: obj.name,
    email: obj.email,
    userdata: obj.userdata ? (Struct.toJson(obj.userdata) as JsonObject) : {},
  };
}
