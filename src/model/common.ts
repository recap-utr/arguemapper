import { v1 } from 'uuid';

export const uuid = v1;

export interface Metadata {
  [x: string]: unknown;
}

export interface Data {
  created: Date;
  updated: Date;
}
