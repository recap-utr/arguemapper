import * as arguebuf from "arguebuf";
import { snapdom } from "@zumer/snapdom";
import * as model from "@/model.js";
import type { AnalystIdentity } from "@/store/types.js";

export type ExportFormat = "aif" | "arguebuf";

/** Whether exports in the format record the analyst, who is then asked for first. */
export const recordsAnalyst = (format: ExportFormat): format is "arguebuf" => format === "arguebuf";

/**
 * Load a graph from a JSON object in any format supported by arguebuf, repairs are reported to `onIssue`.
 * The formats do not hold the name of the graph, which files take from their name.
 */
export function importGraph(
  obj: arguebuf.load.JsonGraph,
  { onIssue, name }: { onIssue?: arguebuf.Reporter; name?: string } = {},
): model.Graph {
  return arguebuf.load.json(obj, { codecs: model.codecs, onIssue, name });
}

/** File suffixes that `importFile` reads, e.g. for the `accept` attribute of file inputs. */
export const importSuffixes: readonly string[] = Object.values(arguebuf.load.suffixes).flat();

/**
 * Load a graph from a file in any format supported by arguebuf, derived from its suffix.
 * Throws if the file cannot be parsed, repairs are reported to `onIssue`.
 */
export async function importFile(file: File, onIssue?: arguebuf.Reporter): Promise<model.Graph> {
  const options = { codecs: model.codecs, onIssue };

  if (arguebuf.load.fileFormat(file.name) !== "argdown") {
    return arguebuf.load.file(file, options);
  }

  // loaded on demand, since the Argdown parser is large
  const { loadArgdown } = await import("arguebuf/argdown");
  const name = file.name.slice(0, file.name.lastIndexOf("."));

  return loadArgdown(await file.text(), { ...options, name });
}

/** Graph to open, JSON objects and files are loaded first, undefined stands for a new graph. */
export type GraphSource = model.Graph | arguebuf.load.JsonGraph | File;

/** Load the graph from the source, repairs are reported to `onIssue`. */
export async function loadGraph(
  source: GraphSource | undefined,
  onIssue?: arguebuf.Reporter,
): Promise<model.Graph | undefined> {
  if (source === undefined || source instanceof arguebuf.Graph) {
    return source;
  }

  if (source instanceof File) {
    return importFile(source, onIssue);
  }

  return importGraph(source, { onIssue });
}

/** The graph as arguebuf JSON without recording the analyst, e.g. to store it. */
export const dumpGraph = (graph: model.Graph): arguebuf.GraphJson =>
  arguebuf.dump.json(graph, { codecs: model.codecs });

/** Serialize the graph, the arguebuf format also records the analyst. */
export function exportGraph<F extends ExportFormat>(
  graph: model.Graph,
  format: F,
  analyst: AnalystIdentity,
): arguebuf.dump.Formats[F];
export function exportGraph(
  graph: model.Graph,
  format: ExportFormat,
  analyst: AnalystIdentity,
): arguebuf.dump.Formats[ExportFormat] {
  if (!recordsAnalyst(format)) {
    return arguebuf.dump.json(graph, format);
  }

  const known = Object.values(graph.analysts).some(
    (x) => x.name === analyst.name && x.email === analyst.email,
  );

  if (known) {
    return arguebuf.dump.json(graph, { codecs: model.codecs });
  }

  const result = graph.edit((draft) => {
    const { id, name, email } = analyst;

    if (Object.hasOwn(draft.analysts, id)) {
      draft.updateAnalyst(id, { name, email });
    } else {
      draft.addAnalyst(new arguebuf.Analyst(analyst));
    }
  });

  return arguebuf.dump.json(result, { codecs: model.codecs });
}

/** Name of a downloaded file without suffix, the name of the graph if it has one. */
function generateFilename(name: string | undefined): string {
  if (name) {
    return name;
  }

  const timestamp = Temporal.Now.plainDateTimeISO()
    .toString({ smallestUnit: "second" })
    .replaceAll(":", "-");

  return `arguemapper-${timestamp}`;
}

// https://stackoverflow.com/a/55613750/7626878
export function downloadJson(data: unknown, prettify: boolean, name?: string): void {
  const json = JSON.stringify(data, undefined, prettify ? 2 : undefined);
  const blob = new Blob([json], { type: "application/json" });
  downloadFile(URL.createObjectURL(blob), `${generateFilename(name)}.json`);
}

export type ImgFormat = "png" | "jpg";

// overlays such as controls and toolbars are not part of the graph
const excludedElements = [
  ".react-flow__handle",
  ".react-flow__attribution",
  ".react-flow__panel",
  ".react-flow__node-toolbar",
  ".react-flow__edge-toolbar",
].join(",");

/** Download the element as an image, `scale` multiplies its size on the screen. */
export async function downloadImage(
  format: ImgFormat,
  { element, scale, name }: { element: HTMLElement; scale: number; name?: string },
): Promise<void> {
  const capture = await snapdom(element, {
    backgroundColor: "white",
    exclude: excludedElements,
    excludeMode: "remove",
  });
  await capture.download({ format, scale, quality: 1, filename: generateFilename(name) });
}

const downloadFile = (href: string, filename: string) => {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
