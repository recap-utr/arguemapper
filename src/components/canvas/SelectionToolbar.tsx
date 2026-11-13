import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import StarIcon from "@mui/icons-material/Star";
import { NodeToolbar } from "@xyflow/react";
import type React from "react";
import { ToolbarButton, ToolbarPaper } from "@/components/canvas/Toolbar.js";
import { useGraphRender } from "@/components/GraphRenderContext.js";
import { SchemeTypeToggle } from "@/components/inspector/SchemeTypeToggle.js";
import * as model from "@/model.js";
import { useArgueActions, useArgueConfig, useDocument } from "@/store.js";

/** Actions for the selected nodes, shown above them on all devices. */
export const SelectionToolbar: React.FC = () => {
  const ids = useDocument((state) => state.selection.nodes);
  const atom = useDocument(model.selectedAtom);
  const schemes = useDocument((state) => model.selectionType(state) === "schemes");
  const majorClaim = useDocument((state) => state.graph.majorClaim);
  const { readOnly, panels } = useArgueConfig();
  const { coarse } = useGraphRender();
  const { editGraph, deleteSelection, openPanel } = useArgueActions();

  if (ids.length === 0) {
    return null;
  }

  const isMajorClaim = atom !== undefined && atom.id === majorClaim;

  // xyflow takes a mutable array
  return (
    <NodeToolbar nodeId={[...ids]} isVisible>
      <ToolbarPaper>
        {schemes && !readOnly && (
          <SchemeTypeToggle
            ids={ids}
            types={["support", "attack"]}
            size={coarse ? "medium" : "small"}
          />
        )}
        {atom && !readOnly && (
          <ToolbarButton
            title={isMajorClaim ? "Unset main claim" : "Set as main claim"}
            icon={StarIcon}
            color={isMajorClaim ? "primary" : undefined}
            onClick={() => editGraph((graph) => model.toggleMajorClaim(graph, atom.id))}
          />
        )}
        {atom?.reference !== undefined && panels && (
          <ToolbarButton
            title="Show in text"
            icon={FormatQuoteIcon}
            onClick={() => openPanel("text")}
          />
        )}
        {panels && (
          <ToolbarButton
            title="Edit details"
            icon={EditIcon}
            onClick={() => openPanel("inspector")}
          />
        )}
        {!readOnly && (
          <ToolbarButton
            title="Delete (Del)"
            icon={DeleteIcon}
            color="error"
            onClick={deleteSelection}
          />
        )}
      </ToolbarPaper>
    </NodeToolbar>
  );
};
