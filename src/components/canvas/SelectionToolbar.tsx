import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faPen, faQuoteLeft, faStar, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton, Paper, Tooltip } from "@mui/material";
import { NodeToolbar } from "@xyflow/react";
import type React from "react";
import { useGraphRender } from "@/components/GraphRenderContext.js";
import { SchemeTypeToggle } from "@/components/inspector/SchemeTypeToggle.js";
import * as model from "@/model.js";
import { useArgueActions, useArgueConfig, useStore } from "@/store.js";

interface ButtonProps {
  title: string;
  icon: IconProp;
  onClick: () => void;
  color?: "primary" | "error";
}

/** Icon button of a canvas toolbar, larger for touch input. */
export const ToolbarButton: React.FC<ButtonProps> = ({ title, icon, onClick, color }) => {
  const { coarse } = useGraphRender();

  return (
    <Tooltip title={title}>
      <IconButton aria-label={title} color={color} size={coarse ? "large" : "medium"} onClick={onClick}>
        <FontAwesomeIcon icon={icon} fixedWidth />
      </IconButton>
    </Tooltip>
  );
};

/** Paper holding the buttons of a canvas toolbar. */
export const ToolbarPaper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Paper elevation={4} sx={{ display: "flex", alignItems: "center", gap: 0.5, p: 0.5 }}>
    {children}
  </Paper>
);

/** Actions for the selected nodes, shown above them on all devices. */
export const SelectionToolbar: React.FC = () => {
  const ids = useStore((state) => state.selection.nodes);
  const node = useStore(({ graph, selection }) => model.selectedNode(graph, selection));
  const schemes = useStore(
    ({ graph, selection }) => model.selectionType(graph, selection) === "schemes",
  );
  const isMajorClaim = useStore((state) => node !== undefined && state.graph.majorClaim === node.id);
  const { readOnly, panels } = useArgueConfig();
  const { coarse } = useGraphRender();
  const { editGraph, deleteSelection, openPanel } = useArgueActions();

  if (ids.length === 0) {
    return null;
  }

  return (
    <NodeToolbar nodeId={ids} isVisible>
      <ToolbarPaper>
        {schemes && !readOnly && (
          <SchemeTypeToggle ids={ids} types={["support", "attack"]} size={coarse ? "medium" : "small"} />
        )}
        {node?.type === "atom" && !readOnly && (
          <ToolbarButton
            title={isMajorClaim ? "Unset main claim" : "Set as main claim"}
            icon={faStar}
            color={isMajorClaim ? "primary" : undefined}
            onClick={() => editGraph((graph) => model.toggleMajorClaim(graph, node.id))}
          />
        )}
        {node?.type === "atom" && node.reference !== undefined && panels && (
          <ToolbarButton title="Show in text" icon={faQuoteLeft} onClick={() => openPanel("text")} />
        )}
        {panels && (
          <ToolbarButton title="Edit details" icon={faPen} onClick={() => openPanel("inspector")} />
        )}
        {!readOnly && (
          <ToolbarButton title="Delete (Del)" icon={faTrash} color="error" onClick={deleteSelection} />
        )}
      </ToolbarPaper>
    </NodeToolbar>
  );
};
