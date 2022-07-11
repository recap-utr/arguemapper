import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "arg-services/arg_services/graph/v1/graph_pb";
import { fromAif, fromProtobuf, State } from "../model";
import * as date from "./date";

export function importGraph(obj: any): State {
  if ("locutions" in obj) {
    return fromAif(obj);
  } else {
    return fromProtobuf(obj);
  }
}

export function proto2json(graph: arguebuf.Graph): JsonValue {
  return arguebuf.Graph.toJson(graph);
}

export function json2proto(graph: JsonValue): arguebuf.Graph {
  return arguebuf.Graph.fromJson(graph);
}

export function generateFilename() {
  return date.format(date.now(), "yyyy-MM-dd-HH-mm-ss");
}

// https://stackoverflow.com/a/55613750/7626878
export async function downloadJson(data: any) {
  const json = JSON.stringify(data);
  const blob = new Blob([json], { type: "application/json" });
  downloadBlob(blob, ".json");
}

export async function downloadBlob(data: Blob, suffix: string) {
  const href = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = href;
  link.download = generateFilename() + suffix;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
