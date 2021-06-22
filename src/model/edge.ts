import * as common from './common';

export interface Data extends common.Data {
  id: string;
  source: string;
  target: string;
  metadata: common.Metadata;
}

export function init(source: string, target: string): Data {
  const date = new Date();

  return {
    id: common.uuid(),
    updated: date,
    created: date,
    metadata: {},
    source,
    target,
  };
}
