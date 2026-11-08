import { ReactFlowProvider } from "@xyflow/react";
import { useId, useMemo, useRef, useState } from "react";
import { shallow } from "zustand/shallow";
import type { AssistantSettings } from "@/assistant/config.js";
import { useContainerBreakpoint } from "@/components/breakpoints.js";
import { NoticeSnackbar } from "@/components/NoticeSnackbar.js";
import { GraphEditorLayout } from "@/GraphEditorLayout.js";
import {
  type ArgueConfig,
  ArgueConfigProvider,
  type EditorSlots,
  FlowWrapperProvider,
  InstanceFocusProvider,
  SlotsProvider,
  useFocusWithin,
  WorkspaceProvider,
  type WorkspaceStore,
} from "@/store.js";

const EMPTY_SLOTS: EditorSlots = {};

/** Props shared by the editor of one graph and the workspace of several. */
export interface EditorProps extends React.PropsWithChildren {
  /** Disable all editing — pure viewer. */
  readOnly?: boolean;
  /** Show the file menu, the settings, and the undo, redo, and layout controls. */
  toolbar?: boolean;
  /**
   * Show the panels for the text and the details of the selection, and the assistant if enabled.
   * Wide editors show them beside the canvas, narrow ones below it.
   */
  panels?: boolean;
  /**
   * Enable the AI assistant, disabled by default.
   * The given settings are fixed, the user chooses the others in the settings of the assistant.
   */
  assistant?: boolean | Partial<AssistantSettings>;
  /** Unique id; namespaces the ReactFlow instance and its SVG markers. Defaults to a generated id. */
  id?: string;
  /** Host content added to the file menu and the settings. */
  slots?: EditorSlots;
  style?: React.CSSProperties;
  className?: string;
}

interface EditorShellProps extends EditorProps {
  workspace: WorkspaceStore;
}

/** The editor of a workspace, shared by `<GraphEditor>` and `<GraphWorkspace>`. */
export function EditorShell({
  workspace,
  readOnly = false,
  toolbar = false,
  panels = false,
  assistant,
  id: idProp,
  slots,
  style,
  className,
  children,
}: EditorShellProps): React.JSX.Element {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const focused = useFocusWithin(rootRef);
  const breakpoint = useContainerBreakpoint(rootRef);

  // The assistant edits the graph, so read-only instances hide it.
  const requested = readOnly || !assistant ? undefined : assistant === true ? {} : assistant;
  // a fresh object of the host with the same settings keeps the config
  const [fixed, setFixed] = useState(requested);

  if (!shallow(fixed, requested)) {
    setFixed(requested);
  }

  const config = useMemo(
    (): ArgueConfig => ({ id, readOnly, toolbar, panels, assistant: fixed, breakpoint }),
    [id, readOnly, toolbar, panels, fixed, breakpoint],
  );

  return (
    <div
      ref={rootRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        containerType: "inline-size",
        ...style,
      }}
    >
      <ReactFlowProvider>
        <WorkspaceProvider value={workspace}>
          <FlowWrapperProvider value={wrapperRef}>
            <ArgueConfigProvider value={config}>
              <InstanceFocusProvider value={focused}>
                <SlotsProvider value={slots ?? EMPTY_SLOTS}>
                  <GraphEditorLayout />
                  <NoticeSnackbar />
                  {children}
                </SlotsProvider>
              </InstanceFocusProvider>
            </ArgueConfigProvider>
          </FlowWrapperProvider>
        </WorkspaceProvider>
      </ReactFlowProvider>
    </div>
  );
}
