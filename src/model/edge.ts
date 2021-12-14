import * as common from "./common";

export class Data {
  id: string;
  source: string;
  target: string;
  created: Date;
  updated: Date;
  metadata: common.Struct;
}

export function initData(source: string, target: string, id?: string): Data {
  const date = new Date();

  return {
    id: id ?? common.uuid(),
    source,
    target,
    created: date,
    updated: date,
    metadata: {},
  };
}
