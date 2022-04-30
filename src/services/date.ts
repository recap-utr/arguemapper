import { Timestamp } from "arg-services/google/protobuf/timestamp_pb";
import * as dateHelper from "date-fns";

export function now(): string {
  return new Date().toJSON();
}

export function parse(dateString: string, format: string): string {
  return dateHelper.parse(dateString, format, new Date()).toJSON();
}

export function instance(dateJSON: string): Date {
  return dateHelper.parseJSON(dateJSON);
}

export function format(dateJSON: string, format: string): string {
  return dateHelper.format(instance(dateJSON), format);
}

export function fromProtobuf(timestamp: Timestamp | undefined): string {
  if (timestamp) {
    return Timestamp.toDate(timestamp).toJSON();
  }

  return now();
}

export function toProtobuf(dateJSON: string): Timestamp {
  return Timestamp.fromDate(instance(dateJSON));
}
