import { Theme } from "@mui/material";
import { grey } from "@mui/material/colors";
import textMetrics from "text-metrics";
import * as cytoModel from "./model/cytoWrapper";
import { SchemeNode } from "./model/node";

const lineHeight = 1.15;
const maxWidth = 160;

const style = (theme: Theme) => {
  const metrics = textMetrics.init({
    fontSize: `${theme.typography.fontSize}px`,
    lineHeight: `${lineHeight * theme.typography.fontSize}px`,
    fontFamily: theme.typography.fontFamily,
    width: maxWidth * 0.99,
  });

  return [
    {
      selector: 'node[kind="atom"], node[kind="scheme"]',
      style: {
        width: (ele: cytoscape.NodeSingular) => {
          const data = ele.data() as cytoModel.node.Node;
          const label = cytoModel.node.label(data);
          const lines: string[] = label.split(/\r?\n/);

          const widths = lines.map(
            (line) => metrics.width(line, { multiline: true }) as number
          );
          const width = Math.max(...widths);

          return width;
        },
        height: (ele: cytoscape.NodeSingular) => {
          const data = ele.data() as cytoModel.node.Node;
          const lines: string[] = cytoModel.node.label(data).split(/\r?\n/);
          const heights = lines.map(
            (line) => metrics.height(line, { multiline: true }) as number
          );
          return heights.reduce((a, b) => a + b);
        },
        padding: 10,
        "font-size": `${theme.typography.fontSize}px`,
        "line-height": lineHeight,
        "font-family": theme.typography.fontFamily,
        "text-valign": "center",
        "text-halign": "center",
        "text-wrap": "wrap",
        color: theme.palette.common.white,
        "text-max-width": `${maxWidth}px`,
        "background-color": theme.palette.primary.main,
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
        content: (ele: cytoscape.NodeSingular) => {
          const data = ele.data() as SchemeNode;

          if (data.argumentationScheme) {
            return data.argumentationScheme;
          } else if (data.type) {
            return data.type;
          } else {
            return "Unknowm";
          }
        },
        // shape: "round-diamond",
      },
    },
    {
      selector: 'node[kind="scheme"][type="Support"]',
      style: {
        "background-color": theme.palette.success.main,
      },
    },
    {
      selector: 'node[kind="scheme"][type="Attack"]',
      style: {
        "background-color": theme.palette.error.main,
      },
    },
    {
      selector: "edge",
      style: {
        "line-color": grey[500],
        "background-color": grey[500],
        "target-arrow-color": grey[500],
        "target-arrow-shape": "triangle",
        "curve-style": "bezier", // unbundled-bezier
        // "control-point-distances": [20, -20],
        // "control-point-weights": [0.25, 0.75],
      },
    },
    {
      selector: ":selected",
      style: {
        "background-color": theme.palette.info.main,
      },
    },
    {
      selector: ".eh-source, .eh-target",
      style: {
        "background-color": theme.palette.warning.light,
      },
    },
    {
      selector: ".eh-preview, .eh-ghost-edge",
      style: {
        "line-color": theme.palette.warning.light,
        "target-arrow-color": theme.palette.warning.light,
        "source-arrow-color": theme.palette.warning.light,
      },
    },
    {
      selector: ".eh-ghost-edge.eh-preview-active",
      style: {
        opacity: 0,
      },
    },
  ];
};

export default style;
