import * as arguebuf from "arg-services/arg_services/graph/v1/graph_pb";

export interface Reference {
  resource?: string;
  offset?: number;
  text: string;
}

export interface Props {
  resource?: string;
  offset?: number;
  text: string;
}

export function init({ resource, offset, text }: Props): Reference {
  return {
    resource,
    offset,
    text,
  };
}

export function toProtobuf(data: Reference): arguebuf.Reference {
  return arguebuf.Reference.create({
    text: data.text,
    resource: data.resource,
    offset: data.offset,
  });
}

export function fromProtobuf(obj: arguebuf.Reference): Reference {
  return {
    text: obj.text,
    resource: obj.resource,
    offset: obj.offset,
  };
}
