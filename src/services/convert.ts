import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "arg-services/arg_services/graph/v1/graph_pb";
import { toJpeg, toPng } from "html-to-image";
import { Options as ImgOptions } from "html-to-image/lib/options";
import { fromAif, fromProtobuf, Wrapper } from "../model";
import * as date from "./date";

export function importGraph(obj: any): Wrapper {
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
  const filename = generateFilename() + suffix;
  downloadFile(href, filename);
}

export const downloadImage = async (format: ImgFormat) => {
  const selectors = ["#react-flow"];
  const excludedClasses = [
    "react-flow__handle",
    "arguemapper-hidden",
    "react-flow__attribution",
  ];

  const elem = document.querySelector(
    selectors.join(" ")
  ) as HTMLElement | null;
  const func = imgFormatMap[format];

  if (elem !== null) {
    const href = await func(elem, {
      backgroundColor: "white",
      cacheBust: true,
      quality: 1.0,
      pixelRatio: 3,
      // https://github.com/bubkoo/html-to-image/blob/master/README.md#filter
      filter: (domNode) => {
        const classList = domNode.classList
          ? Array.from(domNode.classList)
          : [];
        return !excludedClasses.some((className) =>
          classList.includes(className)
        );
      },
    });
    const filename = `${generateFilename()}.${format}`;
    downloadFile(href, filename);
  }
};

export enum ImgFormat {
  PNG = "png",
  JPG = "jpg",
}

const imgFormatMap: {
  [key in ImgFormat]: (
    elem: HTMLElement,
    options?: ImgOptions
  ) => Promise<string>;
} = {
  png: toPng,
  jpg: toJpeg,
};

const downloadFile = async (href: string, filename: string) => {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
