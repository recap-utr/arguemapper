import { JsonObject, Struct } from "@bufbuild/protobuf";
import * as arguebuf from "arg-services/graph/v1/graph_pb";

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
  return new arguebuf.Analyst({
    name: data.name,
    email: data.email,
    userdata: Struct.fromJson(data.userdata),
  });
}

export function fromProtobuf(obj: arguebuf.Analyst): Analyst {
  return {
    name: obj.name,
    email: obj.email,
    userdata: obj.userdata ? (obj.userdata.toJson() as JsonObject) : {},
  };
}
