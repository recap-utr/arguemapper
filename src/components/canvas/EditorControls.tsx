import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AddCommentIcon from "@mui/icons-material/AddComment";
import RedoIcon from "@mui/icons-material/Redo";
import UndoIcon from "@mui/icons-material/Undo";
import { ControlButton, Controls } from "@xyflow/react";
import type React from "react";
import { usePanelLayout } from "@/components/panels/layout.js";
import { useEditorHotkeys } from "@/components/useEditorHotkeys.js";
import * as model from "@/model.js";
import { canRedo, canUndo, useArgueActions, useArgueConfig, useDocument } from "@/store.js";

/** React Flow's zoom and fit controls, extended by undo, redo, layout, and adding a claim. */
export const EditorControls: React.FC = () => {
  const undoable = useDocument(canUndo);
  const redoable = useDocument(canRedo);
  const { readOnly } = useArgueConfig();
  const { setState, addNode, openPanel, undo, redo } = useArgueActions();
  // short canvases above the panels have more room in width
  const { wide } = usePanelLayout();

  useEditorHotkeys("mod+z", undo);
  useEditorHotkeys("mod+y, mod+shift+z", redo);

  return (
    <Controls
      showInteractive={false}
      fitViewOptions={model.fitViewOptions}
      position="bottom-left"
      orientation={wide ? "vertical" : "horizontal"}
    >
      <ControlButton title="Arrange automatically" onClick={() => setState({ shouldLayout: true })}>
        <AccountTreeIcon />
      </ControlButton>
      {!readOnly && (
        <>
          <ControlButton title="Undo (Ctrl+Z)" disabled={!undoable} onClick={undo}>
            <UndoIcon />
          </ControlButton>
          <ControlButton title="Redo (Ctrl+Y)" disabled={!redoable} onClick={redo}>
            <RedoIcon />
          </ControlButton>
          <ControlButton
            title="Add a claim without text"
            onClick={() => {
              addNode(model.newAtom());
              openPanel("inspector");
            }}
          >
            <AddCommentIcon />
          </ControlButton>
        </>
      )}
    </Controls>
  );
};
