import * as common from "./common";

interface AbstractData extends common.Data {
  id: string;
  metadata: common.Metadata;
}

export interface AtomData extends AbstractData {
  kind: "atom";
  text: string;
  resource?: Resource;
}

export interface Resource {
  id: string;
  text: string;
  offset: number; // evtl. weglassen
}

export interface SchemeData extends AbstractData {
  kind: "scheme";
  type: Type;
  scheme?: Scheme;
}

export type Data = AtomData | SchemeData;

export enum Type {
  // I = 'I',
  // L = 'L',
  RA = "RA",
  CA = "CA",
  MA = "MA",
  TA = "TA",
  PA = "PA",
  YA = "YA",
}

// https://stackoverflow.com/a/57462517/7626878
export enum Scheme {
  TODO = "TODO",
}

export function isAtom(obj: Data): obj is AtomData {
  // return 'text' in obj;
  return obj.kind === "atom";
}

export function isScheme(obj: Data): obj is SchemeData {
  // return 'type' in obj;
  return obj.kind === "scheme";
}

export function label(obj: Data): string {
  if (isAtom(obj)) {
    return obj.text;
  } else if (isScheme(obj)) {
    return obj.type;
  }

  return "";
}

export function initAtom(text: string): AtomData {
  const date = new Date();

  return {
    id: common.uuid(),
    kind: "atom",
    updated: date,
    created: date,
    metadata: {},
    text,
  };
}

export function initScheme(type: Type, scheme?: Scheme): SchemeData {
  const date = new Date();

  return {
    id: common.uuid(),
    kind: "scheme",
    updated: date,
    created: date,
    metadata: {},
    type,
    scheme,
  };
}
