import { Box } from "@material-ui/core";
import cytoscape from "cytoscape";
import cxtmenu from "cytoscape-cxtmenu";
import dagre from "cytoscape-dagre";
import edgehandles from "cytoscape-edgehandles";
import { useEffect, useRef } from "react";
import * as textMetrics from "text-metrics";
import * as cytoModel from "../model/cytoModel";
import demo from "../model/demo";

cytoscape.use(dagre);
cytoscape.use(edgehandles);
cytoscape.use(cxtmenu);
cytoscape.use = () => {};

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

const defaultLayout = {
  name: "dagre",
  nodeDimensionsIncludeLabels: true,
  rankDir: "BT",
  animate: true,
};

function initCytoscape(container: HTMLDivElement, graph?: cytoModel.Wrapper) {
  if (!graph) {
    graph = cytoModel.init();
  }

  const cy = cytoscape({
    container: container,
    ...graph,
    style: [
      {
        selector: 'node[kind="atom"], node[kind="scheme"]',
        style: {
          width: function (ele) {
            const data = ele.data() as cytoModel.node.Data;
            const label = cytoModel.node.label(data);
            const lines: string[] = label.split(/\r?\n/);

            const widths = lines.map(
              (line) => metrics.width(line, { multiline: true }) as number
            );
            const width = Math.max(...widths);

            return width;
          },
          height: function (ele) {
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
          "text-max-width": `${nodeMaxWidth}px`,
          "background-color": "gray",
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
          "background-color": "green",
        },
      },
      {
        selector: 'node[kind="scheme"][type="CA"]',
        style: {
          "background-color": "red",
        },
      },
      {
        selector: "edge",
        style: {
          "line-color": "gray",
          "background-color": "gray",
          "target-arrow-color": "gray",
          "target-arrow-shape": "triangle",
          "curve-style": "bezier",
        },
      },
      {
        selector: ":selected",
        style: {
          "background-color": "cyan",
        },
      },
      {
        selector: ".eh-handle",
        style: {
          "background-color": "red",
          width: 6,
          height: 6,
          shape: "ellipse",
          "overlay-opacity": 0,
          "border-width": 3, // makes the handle easier to hit
          "border-opacity": 0,
        },
      },
      {
        selector: ".eh-source, .eh-target",
        style: {
          "background-color": "blue",
        },
      },
      {
        selector: ".eh-preview, .eh-ghost-edge",
        style: {
          "line-color": "blue",
          "target-arrow-color": "blue",
          "source-arrow-color": "blue",
        },
      },
      {
        selector: ".eh-ghost-edge.eh-preview-active",
        style: {
          opacity: 0,
        },
      },
    ],
    layout: defaultLayout,
    boxSelectionEnabled: false,
    autounselectify: false,
    selectionType: "single",
    minZoom: 0.1,
    maxZoom: 2.0,
  });

  cy.edgehandles({
    hoverDelay: 0,
    // edgeType: function (_source, edge) {
    //   // if (edge.source().edgesTo(edge.target()).length() > 1) {
    //   //   return null;
    //   // }
    //   return 'flat';
    // },
    complete: function (_event, _source, edge) {
      const sourceNode = edge.source();
      const targetNode = edge.target();

      const sourceData = sourceNode.data() as cytoModel.node.Data;
      const targetData = targetNode.data() as cytoModel.node.Data;

      edge.remove();

      if (
        cytoModel.node.isAtom(sourceData) &&
        cytoModel.node.isAtom(targetData)
      ) {
        const sourcePos = sourceNode.position() as { x: number; y: number };
        const targetPos = targetNode.position() as { x: number; y: number };

        const position = {
          x: (sourcePos.x + targetPos.x) / 2,
          y: (sourcePos.y + targetPos.y) / 2,
        };

        const schemeData = cytoModel.node.initScheme(cytoModel.node.Type.RA);

        cy.add([
          {
            group: "nodes",
            data: schemeData,
            position,
          },
          {
            group: "edges",
            data: cytoModel.edge.init(sourceData.id, schemeData.id),
          },
          {
            group: "edges",
            data: cytoModel.edge.init(schemeData.id, targetData.id),
          },
        ]);
      } else {
        cy.add({
          group: "edges",
          data: cytoModel.edge.init(sourceData.id, targetData.id),
        });
      }
    },
  });
  /*
   *
   * Set up context menus
   *
   * */
  // const cxtmenuOptions = {
  //   selector: '',
  //   commands: [],
  //   menuRadius: function (ele) {
  //     return 150 - 0.5 * ele.outerWidth() + 5;
  //     // radius - node size + 0.5 * spotlightRadius
  //   }, // the outer radius (node center to the end of the menu) in pixels. It is added to the rendered size of the node. Can either be a number or function as in the example.
  //   fillColor: 'rgba(0, 0, 0, 0.75)', // the background colour of the menu
  //   activeFillColor: 'rgba(0, 0, 255, 0.75)', // the colour used to indicate the selected command
  //   activePadding: 0, // additional size in pixels for the active command
  //   indicatorSize: 25, // the size in pixels of the pointer to the active command, will default to the node size if the node size is smaller than the indicator size,
  //   separatorWidth: 5, // the empty spacing in pixels between successive commands
  //   spotlightPadding: 10, // extra spacing in pixels between the element and the spotlight
  //   adaptativeNodeSpotlightRadius: false, // specify whether the spotlight radius should adapt to the node size
  //   minSpotlightRadius: 10, // the minimum radius in pixels of the spotlight (ignored for the node if adaptativeNodeSpotlightRadius is enabled but still used for the edge & background)
  //   maxSpotlightRadius: 10, // the maximum radius in pixels of the spotlight (ignored for the node if adaptativeNodeSpotlightRadius is enabled but still used for the edge & background)
  //   openMenuEvents: 'cxttap taphold', // space-separated cytoscape events that will open the menu; only `cxttapstart` and/or `taphold` work here
  //   itemColor: 'white', // the colour of text in the command's content
  //   itemTextShadowColor: 'transparent', // the text shadow colour of the command's content
  //   zIndex: 9999, // the z-index of the ui div
  //   atMouse: false, // draw menu at mouse position
  //   outsideMenuCancel: 0, // if set to a number, this will cancel the command if the pointer is released outside of the spotlight, padded by the number given
  // };

  // const nodeCommands = [
  //   {
  //     content: '<i class="fas fa-edit"></i>',
  //     select: function (ele) {
  //       if (selected.length !== 0) {
  //         selected.forEach(function (node) {
  //           delete_nodes(node);
  //         });
  //         selected = [];
  //       } else {
  //         if (ele.data().type == 'atom') {
  //           delete_nodes(ele);
  //           ele.remove();
  //         } else if (ele.data().typeshape == 'diamond') {
  //           delete_nodes(ele);
  //           ele.remove();
  //         } else {
  //           sadface.delete_edge(ele.id());
  //           update_local_storage();
  //           ele.remove();
  //         }
  //       }
  //     },
  //     enabled: true,
  //   },
  // ];

  // const atomOptions = { ...cxtmenuOptions };
  // atomOptions.selector = 'node[type = "atom"]';
  // atomOptions.commands = [
  //   {
  //     content: '<i class="fas fa-edit"></i> content',
  //     select: function (ele) {
  //       $('#editContentModal').modal('show');
  //       $('#edit_atom_content').val(ele.data('content'));
  //       edit_atom = ele;
  //     },
  //     enabled: true,
  //   },
  //   {
  //     content: '<i class="fas fa-trash"></i> remove',
  //     select: function (ele) {
  //       $('#edit_metadata').empty();
  //       var atom = sadface.get_atom(ele.id());
  //       var textArea = $(
  //         '<textarea id="' +
  //           ele.id() +
  //           '_metadata" class="form-control" rows="2" >' +
  //           JSON.stringify(atom.metadata) +
  //           '</textarea>'
  //       );
  //       $('#edit_metadata').append(textArea);
  //       $('#editMetadataModal').modal('show');
  //       edit_atom = ele;
  //     },
  //     enabled: true,
  //   },
  //   ...nodeCommands,
  // ];

  // cy.cxtmenu(atomOptions);
}

export default function Cytoscape() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current !== null) {
      initCytoscape(containerRef.current, demo);
    }
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
}
