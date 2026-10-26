import type { GraphJson } from "arg-services/graph/v1/graph_pb";
import * as arguebuf from "arguebuf";
import { toJpeg, toPng } from "html-to-image";
import type { Options as ImgOptions } from "html-to-image/lib/types.js";
import * as model from "@/model.js";

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

/** Ids that occur more than once in `ids` (each reported once). */
function duplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) repeated.add(id);
    seen.add(id);
  }
  return [...repeated];
}

/**
 * Structural defects that make a graph non-compliant with the AIF / arguebuf data model, each phrased
 * for the assistant to act on. An empty list means the graph is compliant. These are the format-level
 * defects that {@link exportGraph} would otherwise serialize into a file that violates AIF's node/edge
 * typing or cannot be re-imported (a dangling edge or a typeless scheme node serializes silently, then
 * throws on load). Quality issues that are still valid AIF (orphaned atoms, incomplete arguments) are
 * surfaced as warnings elsewhere, not here. This is the single source of truth shared by every graph
 * mutation, so validation stays complete and consistent across both export formats.
 */
export function validateGraph({ nodes, edges, graph }: model.Wrapper): string[] {
  const defects: string[] = [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const duplicateNodes = duplicates(nodes.map((node) => node.id));
  if (duplicateNodes.length > 0) {
    defects.push(`Duplicate node ids: ${duplicateNodes.join(", ")}.`);
  }
  const duplicateEdges = duplicates(edges.map((edge) => edge.id));
  if (duplicateEdges.length > 0) {
    defects.push(`Duplicate edge ids: ${duplicateEdges.join(", ")}.`);
  }

  for (const node of nodes) {
    const scheme = model.schemeData(node);
    if (scheme !== undefined && scheme.scheme?.case === undefined) {
      defects.push(
        `Scheme node ${node.id} has no type; set it to support, attack, rephrase or preference.`,
      );
    }
  }

  for (const edge of edges) {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (source === undefined || target === undefined) {
      const missing = [source ? undefined : edge.source, target ? undefined : edge.target].filter(
        (id) => id !== undefined,
      );
      defects.push(`Edge ${edge.id} references unknown node(s): ${missing.join(", ")}.`);
    } else if (edge.source === edge.target) {
      defects.push(`Edge ${edge.id} connects node ${edge.source} to itself.`);
    } else if (source.data.type === "atom" && target.data.type === "atom") {
      defects.push(
        `Edge ${edge.id} directly connects two atoms (${edge.source} → ${edge.target}); atoms must be joined through a scheme node.`,
      );
    }
  }

  if (graph.majorClaim !== undefined) {
    const majorClaim = nodeById.get(graph.majorClaim);
    if (majorClaim === undefined) {
      defects.push(`The major claim ${graph.majorClaim} is not an existing node.`);
    } else if (majorClaim.data.type !== "atom") {
      defects.push(`The major claim ${graph.majorClaim} is not an atom.`);
    }
  }

  return defects;
}

export function generateFilename() {
  const timestamp = arguebuf.date.format(arguebuf.date.now(), "YYYY-MM-DD[T]HH-mm-ss");

  return `arguemapper-${timestamp}`;
}

// https://stackoverflow.com/a/55613750/7626878
export function downloadJson(data: unknown, prettify: boolean): void {
  const json = JSON.stringify(data, undefined, prettify ? 2 : undefined);
  const blob = new Blob([json], { type: "application/json" });
  downloadBlob(blob, ".json");
}

export function downloadBlob(data: Blob, suffix: string): void {
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
