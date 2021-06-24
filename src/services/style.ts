import { Palette } from "@material-ui/core";
import textMetrics from "text-metrics";
import * as cytoModel from "../model/cytoModel";

const nodeFontSize = "16px";
const nodeLineHeight = "18.4px";
const nodeLineHeightFactor = 1.15;
const nodeFontFamily = ["Roboto", "sans-serif"];
const nodeMaxWidth = 160;

const metrics = textMetrics.init({
  fontSize: nodeFontSize,
  lineHeight: nodeLineHeight,
  fontFamily: nodeFontFamily.reduce((x, y) => `${x}, ${y}`),
  width: nodeMaxWidth * 0.99,
});

const style = (palette: Palette) => [
  {
    selector: 'node[kind="atom"], node[kind="scheme"]',
    style: {
      width: (ele: cytoscape.NodeSingular) => {
        const data = ele.data() as cytoModel.node.Data;
        const label = cytoModel.node.label(data);
        const lines: string[] = label.split(/\r?\n/);

        const widths = lines.map(
          (line) => metrics.width(line, { multiline: true }) as number
        );
        const width = Math.max(...widths);

        return width;
      },
      height: (ele: cytoscape.NodeSingular) => {
        const data = ele.data() as cytoModel.node.Data;
        const label = cytoModel.node.label(data);
        const lines: string[] = label.split(/\r?\n/);
        const heights = lines.map((line) => metrics.height(line) as number);
        return heights.reduce((a, b) => a + b);
      },
      padding: 10,
      "font-size": nodeFontSize,
      "line-height": nodeLineHeightFactor,
      "font-family": nodeFontFamily.join(", "),
      "text-valign": "center",
      "text-halign": "center",
      "text-wrap": "wrap",
      color: palette.common.white,
      "text-max-width": `${nodeMaxWidth}px`,
      "background-color": palette.primary.main,
      shape: "round-rectangle",
    },
  },
  {
    selector: 'node[kind="atom"]',
    style: {
      content: "data(text)",
    },
  },
  {
    selector: 'node[kind="scheme"]',
    style: {
      content: "data(type)",
      shape: "round-diamond",
    },
  },
  {
    selector: 'node[kind="scheme"][scheme]',
    style: {
      content: "data(scheme)",
    },
  },
  {
    selector: 'node[kind="scheme"][type="RA"]',
    style: {
      "background-color": palette.success.main,
    },
  },
  {
    selector: 'node[kind="scheme"][type="CA"]',
    style: {
      "background-color": palette.error.main,
    },
  },
  {
    selector: "edge",
    style: {
      "line-color": palette.divider,
      "background-color": palette.divider,
      "target-arrow-color": palette.divider,
      "target-arrow-shape": "triangle",
      "curve-style": "bezier", // unbundled-bezier
      // "control-point-distances": [20, -20],
      // "control-point-weights": [0.25, 0.75],
    },
  },
  {
    selector: ":selected",
    style: {
      "background-color": palette.info.main,
    },
  },
  {
    selector: ".eh-handle",
    style: {
      "background-color": palette.warning.dark,
      width: 7,
      height: 7,
      shape: "ellipse",
      "overlay-opacity": 0,
      "border-width": 3, // makes the handle easier to hit
      "border-opacity": 0,
    },
  },
  {
    selector: ".eh-source, .eh-target",
    style: {
      "background-color": palette.warning.light,
    },
  },
  {
    selector: ".eh-preview, .eh-ghost-edge",
    style: {
      "line-color": palette.warning.light,
      "target-arrow-color": palette.warning.light,
      "source-arrow-color": palette.warning.light,
    },
  },
  {
    selector: ".eh-ghost-edge.eh-preview-active",
    style: {
      opacity: 0,
    },
  },
];

export default style;
