import * as common from "./common";

export interface Data {
  resources: { [x: string]: Resource };
  participants: { [x: string]: Participant };
  majorClaim?: string;
  analysts: Participant[];
  version: string;
  created: Date;
  updated: Date;
  metadata: common.Struct;
}

export function initData(): Data {
  const date = new Date();

  return {
    created: date,
    updated: date,
    metadata: {},
    resources: {},
    participants: {},
    analysts: [],
    version: "TODO",
  };
}

export interface Resource {
  text: string;
  title?: string;
  source?: string;
  created: Date;
  updated: Date;
  metadata: common.Struct;
}

export function initResource(): Resource {
  const date = new Date();

  return {
    text: "",
    title: null,
    source: null,
    created: date,
    updated: date,
    metadata: {},
  };
}

export interface Participant {
  name?: string;
  username?: string;
  email?: string;
  url?: string;
  location?: string;
  description?: string;
  created: Date;
  updated: Date;
  metadata: common.Struct;
}

export function initParticipant(): Participant {
  const date = new Date();

  return {
    name: null,
    username: null,
    email: null,
    url: null,
    location: null,
    description: null,
    created: date,
    updated: date,
    metadata: {},
  };
}
