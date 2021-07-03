import {
  faPlus,
  faRedo,
  faSitemap,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  useTheme,
} from "@material-ui/core";
import cytoscape, { NodeSingular } from "cytoscape";
import cxtmenu from "cytoscape-cxtmenu";
import dagre from "cytoscape-dagre";
import edgehandles from "cytoscape-edgehandles";
import { useCallback, useEffect, useRef, useState } from "react";
import * as cytoModel from "../model/cytoModel";
import style from "../services/style";
import { useGraph } from "./GraphContext";

cytoscape.use(dagre);
// @ts-ignore
cytoscape.use(edgehandles);
cytoscape.use(cxtmenu);
// Otherwise, react will throw errors when hot-reloading the module
cytoscape.use = () => {};

const defaultLayout = {
  name: "dagre",
  nodeDimensionsIncludeLabels: true,
  rankDir: "BT",
  animate: false,
};

function initEdgeHandles(cy: cytoscape.Core, updateGraph: () => void) {
  cy.edgehandles({
    hoverDelay: 0,
    // edgeType: function (_source, edge) {
    //   // if (edge.source().edgesTo(edge.target()).length() > 1) {
    //   //   return null;
    //   // }
    //   return 'flat';
    // },
    complete: function (source, target, edges) {
      console.log(JSON.parse(JSON.stringify(edges.map((edge) => edge.data()))));

      const sourceData = source.data() as cytoModel.node.Data;
      const targetData = target.data() as cytoModel.node.Data;

      edges.remove();

      if (
        cytoModel.node.isAtom(sourceData) &&
        cytoModel.node.isAtom(targetData)
      ) {
        const sourcePos = source.position();
        const targetPos = target.position();

        const position = {
          x: (sourcePos.x + targetPos.x) / 2,
          y: (sourcePos.y + targetPos.y) / 2,
        };

        const schemeData = cytoModel.node.initScheme(cytoModel.node.Type.RA);

        cy.add({
          nodes: [{ data: schemeData, position }],
          edges: [
            { data: cytoModel.edge.init(sourceData.id, schemeData.id) },
            { data: cytoModel.edge.init(schemeData.id, targetData.id) },
          ],
        });
      } else {
        cy.add({
          // @ts-ignore
          edges: [
            {
              data: cytoModel.edge.init(sourceData.id, targetData.id),
            },
          ],
        });
      }

      updateGraph();
    },
  });
}

/*
 *
 * Set up context menus
 *
 * */
// const cxtmenuOptions = {
//   selector: "",
//   commands: [],
//   menuRadius: function (ele) {
//     return 150 - 0.5 * ele.outerWidth() + 5;
//     // radius - node size + 0.5 * spotlightRadius
//   }, // the outer radius (node center to the end of the menu) in pixels. It is added to the rendered size of the node. Can either be a number or function as in the example.
//   fillColor: "rgba(0, 0, 0, 0.75)", // the background colour of the menu
//   activeFillColor: "rgba(0, 0, 255, 0.75)", // the colour used to indicate the selected command
//   activePadding: 0, // additional size in pixels for the active command
//   indicatorSize: 25, // the size in pixels of the pointer to the active command, will default to the node size if the node size is smaller than the indicator size,
//   separatorWidth: 5, // the empty spacing in pixels between successive commands
//   spotlightPadding: 10, // extra spacing in pixels between the element and the spotlight
//   adaptativeNodeSpotlightRadius: false, // specify whether the spotlight radius should adapt to the node size
//   minSpotlightRadius: 10, // the minimum radius in pixels of the spotlight (ignored for the node if adaptativeNodeSpotlightRadius is enabled but still used for the edge & background)
//   maxSpotlightRadius: 10, // the maximum radius in pixels of the spotlight (ignored for the node if adaptativeNodeSpotlightRadius is enabled but still used for the edge & background)
//   openMenuEvents: "cxttap taphold", // space-separated cytoscape events that will open the menu; only `cxttapstart` and/or `taphold` work here
//   itemColor: "white", // the colour of text in the command's content
//   itemTextShadowColor: "transparent", // the text shadow colour of the command's content
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

// const atomOptions = { ...cxtmenuOptions };
// atomOptions.selector = "node";
// atomOptions.commands = [
//   {
//     content: <FontAwesomeIcon icon={faPlus} />,
//     select: function (ele) {},
//     enabled: true,
//   },
// ];

// // @ts-ignore
// cy.cxtmenu(atomOptions);

// @ts-ignore
// cy.navigator({
//   container: "#navigatorContainer",
//   //   viewLiveFramerate: 0, // set false to update graph pan only on drag end; set 0 to do it instantly; set a number (frames per second) to update not more than N times per second
//   //   thumbnailEventFramerate: 30, // max thumbnail's updates per second triggered by graph updates
//   //   thumbnailLiveFramerate: false, // max thumbnail's updates per second. Set false to disable
//   //   dblClickDelay: 200, // milliseconds
//   removeCustomContainer: false, // destroy the container specified by user on plugin destroy
//   rerenderDelay: 0, // ms to throttle rerender updates to the panzoom for performance
// });

// cy.on("cxttap", handleClick);

const initialCtxMenu = {
  mouseX: null,
  mouseY: null,
};

export default function Cytoscape() {
  const [ctxMenu, setCtxMenu] = useState<{
    mouseX: null | number;
    mouseY: null | number;
  }>(initialCtxMenu);
  const containerRef = useRef<HTMLElement>(null);
  const theme = useTheme();
  const {
    cy,
    initializeCy,
    loadGraph,
    updateGraph,
    undo,
    redo,
    undoable,
    redoable,
    reset,
  } = useGraph();

  const layout = useCallback(() => {
    if (cy) {
      cy.current.layout(defaultLayout).run();
      updateGraph();
    }
  }, [cy, updateGraph]);

  const handleClick = (event: cytoscape.EventObject) => {
    setCtxMenu({
      mouseX: event.originalEvent.clientX,
      mouseY: event.originalEvent.clientY,
    });
  };

  const handleClose = () => {
    setCtxMenu(initialCtxMenu);
  };

  useEffect(() => {
    if (containerRef.current !== null) {
      const _cy = cytoscape({
        container: containerRef.current,
        ...loadGraph(),
        layout: { name: "preset" },
        // @ts-ignore
        style: style(theme),
        boxSelectionEnabled: false,
        autounselectify: false,
        selectionType: "single",
        minZoom: 0.1,
        maxZoom: 3.0,
      });
      cy.current = _cy;

      _cy.elements().selectify();
      _cy.elements().unselect();
      initEdgeHandles(_cy, updateGraph);
      _cy.nodes("[metadata]").on("dragfree", () => {
        updateGraph();
      });

      if (
        _cy.nodes("[metadata]").every((node: NodeSingular) => {
          const pos = node.position();
          return pos.x === 0 && pos.y === 0;
        })
      ) {
        // layout() also calls updateGraph()
        layout();
      } else {
        updateGraph();
      }

      reset();
      initializeCy(new Date());

      return () => _cy.destroy();
    }
    // xeslint-disable-next-line react-hooks/exhaustive-deps
  }, [cy, layout, updateGraph, reset, theme, loadGraph, initializeCy]);

  return (
    <Box>
      <Box
        ref={containerRef}
        sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Box
        id="navigatorContainer"
        sx={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: 200,
          height: 200,
        }}
      />
      <Box sx={{ position: "absolute", left: 0, bottom: 0 }}>
        <Stack direction="column">
          <IconButton onClick={layout} aria-label="Layout">
            <FontAwesomeIcon icon={faSitemap} />
          </IconButton>
          <IconButton
            onClick={() => {
              cy.current.add({
                data: {
                  id: "e3",
                  metadata: {},
                  source: "a3",
                  target: "s1",
                  created: new Date(),
                  updated: new Date(),
                },
              });
              updateGraph();
            }}
          >
            <FontAwesomeIcon icon={faPlus} />
          </IconButton>
          <IconButton disabled={!undoable()} onClick={undo}>
            <FontAwesomeIcon icon={faUndo} />
          </IconButton>
          <IconButton disabled={!redoable()} onClick={redo}>
            <FontAwesomeIcon icon={faRedo} />
          </IconButton>
        </Stack>
      </Box>
      <Menu
        keepMounted
        open={ctxMenu.mouseY !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          ctxMenu.mouseY !== null && ctxMenu.mouseX !== null
            ? { top: ctxMenu.mouseY, left: ctxMenu.mouseX }
            : undefined
        }
      >
        <MenuItem>Profile</MenuItem>
        <MenuItem>My account</MenuItem>
        <MenuItem>Logout</MenuItem>
      </Menu>
    </Box>
  );
}
