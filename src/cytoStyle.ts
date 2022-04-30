import { Theme } from "@mui/material";
import * as color from "@mui/material/colors";
import textMetrics from "text-metrics";
import * as cytoModel from "./model/cytoWrapper";

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
      selector: 'node[type="atom"], node[type="scheme"]',
      style: {
        content: (ele: cytoscape.NodeSingular) =>
          cytoModel.node.label(ele.data()),
        width: (ele: cytoscape.NodeSingular) => {
          const data = ele.data() as cytoModel.node.Node;
          const label = cytoModel.node.label(data);
          const lines: string[] = label.split(/\r?\n/);

          const widths = lines.map(
            (line) => metrics.width(line, { multiline: true }) as number
          );
          const width = Math.max(...widths);

          if (width > 0) {
            return width;
          }

          return 20;
        },
        height: (ele: cytoscape.NodeSingular) => {
          const data = ele.data() as cytoModel.node.Node;
          const lines: string[] = cytoModel.node.label(data).split(/\r?\n/);
          const heights = lines.map(
            (line) => metrics.height(line, { multiline: true }) as number
          );
          const height = heights.reduce((a, b) => a + b);

          if (height > 0) {
            return height;
          }

          return 10;
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
        "background-color": color.grey[500],
        shape: "round-rectangle",
      },
    },
    {
      selector: 'node[type="atom"]',
      style: {
        // "background-color": theme.palette.primary.main,
        // "border-color": grey[500],
        // "border-width": (ele: cytoscape.NodeSingular) => {
        //   const data = ele.cy().data() as cytoModel.graph.Graph;

        //   if (data.majorClaim && data.majorClaim === ele.id()) {
        //     return 1;
        //   }

        //   return 0;
        // },
        // content: (ele: cytoscape.NodeSingular) => {
        //   const data = ele.data() as AtomNode;

        //   if (data.text === "") {
        //     return "No Text";
        //   } else {
        //     return data.text;
        //   }
        // },
        "background-color": (ele: cytoscape.NodeSingular) => {
          const data = ele.cy().data() as cytoModel.graph.Graph;

          if (data.majorClaim && data.majorClaim === ele.id()) {
            return color.blue[900];
          }

          return color.blue[500];
        },
      },
    },
    {
      selector: 'node[type="scheme"]',
      style: {
        // shape: "round-hexagon",
        "background-color": color.teal[500],
      },
    },
    {
      selector: 'node[type="scheme"][scheme.type="support"]',
      style: {
        "background-color": color.green[500],
      },
    },
    {
      selector: 'node[type="scheme"][scheme.type="attack"]',
      style: {
        "background-color": color.red[500],
      },
    },
    {
      selector: "edge",
      style: {
        "line-color": color.grey[500],
        "background-color": color.grey[500],
        "target-arrow-color": color.grey[500],
        "target-arrow-shape": "triangle",
        "curve-style": "bezier", // unbundled-bezier
        // "control-point-distances": [20, -20],
        // "control-point-weights": [0.25, 0.75],
      },
    },
    {
      selector: ":selected",
      style: {
        "border-color": theme.palette.text.primary,
        "border-width": 3,
      },
    },
    {
      selector: "edge:selected",
      style: {
        "line-color": theme.palette.text.primary,
        "background-color": theme.palette.text.primary,
        "target-arrow-color": theme.palette.text.primary,
      },
    },
    {
      selector: ".eh-source, .eh-target",
      style: {
        "background-color": color.brown[500],
      },
    },
    {
      selector: ".eh-preview, .eh-ghost-edge",
      style: {
        "line-color": color.brown[500],
        "target-arrow-color": color.brown[500],
        "source-arrow-color": color.brown[500],
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
