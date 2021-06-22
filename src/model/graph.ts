import * as common from './common';

export interface Data extends common.Data {
  id: string;
  resources: Array<Resource>;
  metadata: common.Metadata;
  majorClaim?: string;
}

export interface Resource {
  id: string;
  text: string;
  metadata: common.Metadata;
  title?: string;
  source?: string;
  date?: Date;
}

export interface Analyst {
  name: string;
  email: string;
}

export function init(): Data {
  const date = new Date();

  return {
    id: common.uuid(),
    resources: [],
    updated: date,
    created: date,
    metadata: {},
    // majorClaim: null,
  };
}

// export function toJSON() {}
