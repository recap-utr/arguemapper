import type { JsonObject } from "arguebuf";
import * as arguebuf from "arguebuf";
import { toJpeg, toPng } from "html-to-image";
import { Options as ImgOptions } from "html-to-image/lib/types.js";
import * as model from "../model.js";
import { useStore } from "../store.js";

export function importGraph(obj: JsonObject): model.Wrapper {
  return model.fromArguebuf(arguebuf.load.json(obj));
}
export function exportGraph(
  obj: model.Wrapper,
  format: "aif" | "arguebuf"
): JsonObject {
  const graph = model.toArguebuf(obj);
  const currentAnalyst = useStore.getState().analyst;

  if (
    format === "arguebuf" &&
    !Object.values(graph.analysts).some(
      (x) => x.name === currentAnalyst.name && x.email === currentAnalyst.email
    )
  ) {
    graph.analysts[arguebuf.uuid()] = currentAnalyst;
  }

  return arguebuf.dump.json(graph, format);
}

export function generateFilename() {
  const timestamp = arguebuf.date.format(
    arguebuf.date.now(),
    "YYYY-MM-DD[T]HH-mm-ss"
  );

  return `arguemapper-${timestamp}`;
}

// https://stackoverflow.com/a/55613750/7626878
export async function downloadJson(data: any) {
  const prettify = useStore.getState().prettifyJson;
  const json = JSON.stringify(data, undefined, prettify ? 2 : undefined);
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
      pixelRatio: useStore.getState().imageScale,
      // https://github.com/bubkoo/html-to-image/blob/master/README.md#filter
      filter: (domNode: HTMLElement) => {
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
