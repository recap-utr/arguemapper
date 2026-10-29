import * as arguebuf from "arguebuf";
import { toJpeg, toPng } from "html-to-image";
import type { Options as ImgOptions } from "html-to-image/lib/types.js";
import * as model from "@/model.js";

export type ExportFormat = "aif" | "arguebuf";

/** Load a graph in any format supported by arguebuf, repairs are reported to `onIssue`. */
export function importGraph(obj: arguebuf.load.JsonGraph, onIssue?: arguebuf.Reporter): model.Graph {
  return arguebuf.load.json(obj, { codecs: model.codecs, onIssue });
}

// persistence and `onChange` serialize the same graph after every change
const arguebufExports = new WeakMap<
  model.Graph,
  { analyst: arguebuf.Analyst; json: arguebuf.dump.Formats["arguebuf"] }
>();

/** Serialize the graph, the arguebuf format also records the analyst. */
export function exportGraph<F extends ExportFormat>(
  graph: model.Graph,
  format: F,
  analyst: arguebuf.Analyst,
): arguebuf.dump.Formats[F];
export function exportGraph(
  graph: model.Graph,
  format: ExportFormat,
  analyst: arguebuf.Analyst,
): arguebuf.dump.Formats[ExportFormat] {
  if (format === "aif") {
    return arguebuf.dump.json(graph, "aif");
  }

  const cached = arguebufExports.get(graph);

  if (cached?.analyst === analyst) {
    return cached.json;
  }

  const known = Object.values(graph.analysts).some(
    (x) => x.name === analyst.name && x.email === analyst.email,
  );
  const result = known ? graph : graph.copy();

  if (!known) {
    if (Object.hasOwn(result.analysts, analyst.id)) {
      result.removeAnalyst(analyst.id);
    }

    result.addAnalyst(analyst);
  }

  const json = arguebuf.dump.json(result, { codecs: model.codecs });
  arguebufExports.set(graph, { analyst, json });

  return json;
}

function generateFilename(): string {
  const timestamp = arguebuf.Temporal.Now.plainDateTimeISO()
    .toString({ smallestUnit: "second" })
    .replaceAll(":", "-");

  return `arguemapper-${timestamp}`;
}

// https://stackoverflow.com/a/55613750/7626878
export function downloadJson(data: unknown, prettify: boolean): void {
  const json = JSON.stringify(data, undefined, prettify ? 2 : undefined);
  const blob = new Blob([json], { type: "application/json" });
  downloadBlob(blob, ".json");
}

function downloadBlob(data: Blob, suffix: string): void {
  const href = URL.createObjectURL(data);
  const filename = generateFilename() + suffix;
  downloadFile(href, filename);
}

export const downloadImage = async (
  format: ImgFormat,
  options: { element: HTMLElement; pixelRatio: number },
): Promise<void> => {
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

export type ImgFormat = "png" | "jpg";

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
