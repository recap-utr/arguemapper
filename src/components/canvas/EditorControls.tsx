import { faCommentMedical, faRedo, faSitemap, faUndo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ControlButton, Controls } from "@xyflow/react";
import type React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { usePanelLayout } from "@/components/panels/layout.js";
import * as model from "@/model.js";
import {
  canRedo,
  canUndo,
  useArgueActions,
  useArgueConfig,
  useDocument,
  useInstanceFocused,
} from "@/store.js";

/** React Flow's zoom and fit controls, extended by undo, redo, layout, and adding a claim. */
export const EditorControls: React.FC = () => {
  const undoable = useDocument(canUndo);
  const redoable = useDocument(canRedo);
  const { readOnly } = useArgueConfig();
  const { setState, addNode, openPanel, undo, redo } = useArgueActions();
  const focused = useInstanceFocused();
  // short canvases above the panels have more room in width
  const { wide } = usePanelLayout();
  const hotkeys = { preventDefault: true, useKey: true, enabled: focused && !readOnly };

  useHotkeys("mod+z", () => undoable && undo(), hotkeys);
  useHotkeys("mod+y, mod+shift+z", () => redoable && redo(), hotkeys);

  return (
    <Controls
      showInteractive={false}
      fitViewOptions={model.fitViewOptions}
      position="bottom-left"
      orientation={wide ? "vertical" : "horizontal"}
    >
      <ControlButton title="Arrange automatically" onClick={() => setState({ shouldLayout: true })}>
        <FontAwesomeIcon icon={faSitemap} />
      </ControlButton>
      {!readOnly && (
        <>
          <ControlButton title="Undo (Ctrl+Z)" disabled={!undoable} onClick={() => undo()}>
            <FontAwesomeIcon icon={faUndo} />
          </ControlButton>
          <ControlButton title="Redo (Ctrl+Y)" disabled={!redoable} onClick={() => redo()}>
            <FontAwesomeIcon icon={faRedo} />
          </ControlButton>
          <ControlButton
            title="Add a claim without text"
            onClick={() => {
              addNode(model.newAtom());
              openPanel("inspector");
            }}
          >
            <FontAwesomeIcon icon={faCommentMedical} />
          </ControlButton>
        </>
      )}
    </Controls>
  );
};
