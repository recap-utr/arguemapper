import type { GraphJson } from "arg-services/graph/v1/graph_pb";
import * as arguebuf from "arguebuf";
import { toJpeg, toPng } from "html-to-image";
import type { Options as ImgOptions } from "html-to-image/lib/types.js";
import * as model from "../model.js";

export function importGraph(obj: GraphJson): model.Wrapper {
  return model.fromArguebuf(arguebuf.load.json(obj));
}

export function exportGraph(
  obj: model.Wrapper,
  format: "aif" | "arguebuf",
  analyst: arguebuf.Analyst,
): GraphJson {
  const graph = model.toArguebuf(obj);

  if (
    format === "arguebuf" &&
    !Object.values(graph.analysts).some((x) => x.name === analyst.name && x.email === analyst.email)
  ) {
    if (Object.keys(graph.analysts).includes(analyst.id)) {
      graph.removeAnalyst(analyst.id);
    }

    graph.addAnalyst(analyst);
  }

  return arguebuf.dump.json(graph, format) as GraphJson;
}

export function generateFilename() {
  const timestamp = arguebuf.date.format(arguebuf.date.now(), "YYYY-MM-DD[T]HH-mm-ss");

  return `arguemapper-${timestamp}`;
}

// https://stackoverflow.com/a/55613750/7626878
export function downloadJson(data: unknown, prettify: boolean) {
  const json = JSON.stringify(data, undefined, prettify ? 2 : undefined);
  const blob = new Blob([json], { type: "application/json" });
  downloadBlob(blob, ".json");
}

export function downloadBlob(data: Blob, suffix: string) {
  const href = URL.createObjectURL(data);
  const filename = generateFilename() + suffix;
  downloadFile(href, filename);
}

export const downloadImage = async (
  format: ImgFormat,
  options: { element: HTMLElement; pixelRatio: number },
) => {
  const excludedClasses = ["react-flow__handle", "arguemapper-hidden", "react-flow__attribution"];
  const func = imgFormatMap[format];

  const href = await func(options.element, {
    backgroundColor: "white",
    cacheBust: true,
    quality: 1.0,
    pixelRatio: options.pixelRatio,
    // https://github.com/bubkoo/html-to-image/blob/master/README.md#filter
    filter: (domNode: HTMLElement) => {
      const classList = domNode.classList ? Array.from(domNode.classList) : [];
      return !excludedClasses.some((className) => classList.includes(className));
    },
  });
  const filename = `${generateFilename()}.${format}`;
  downloadFile(href, filename);
};

export enum ImgFormat {
  PNG = "png",
  JPG = "jpg",
}

const imgFormatMap: Record<
  ImgFormat,
  (elem: HTMLElement, options?: ImgOptions) => Promise<string>
> = {
  png: toPng,
  jpg: toJpeg,
};

const downloadFile = (href: string, filename: string) => {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
