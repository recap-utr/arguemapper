import { ReactFlowProvider } from "@xyflow/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { shallow } from "zustand/shallow";
import type { AssistantSettings } from "@/assistant/config.js";
import { useContainerBreakpoint } from "@/components/breakpoints.js";
import { NoticeSnackbar } from "@/components/NoticeSnackbar.js";
import { GraphEditorLayout } from "@/GraphEditorLayout.js";
import type * as model from "@/model.js";
import {
  type ArgueConfig,
  ArgueConfigProvider,
  type EditorSlots,
  subscribeDocuments,
  WorkspaceProvider,
  type WorkspaceStore,
} from "@/store.js";

/** Props shared by the editor of one graph and the workspace of several. */
export interface EditorProps extends React.PropsWithChildren {
  /** Disable all editing, a pure viewer. */
  readOnly?: boolean;
  /** Show the file menu, the settings, and the undo, redo, and layout controls. */
  toolbar?: boolean;
  /**
   * Show the panels for the text and the details of the selection, and the assistant if enabled.
   * Wide editors show them beside the canvas, narrow ones below it.
   */
  panels?: boolean;
  /** Offer the getting started guide on the canvas, which the user can hide in the settings. */
  guide?: boolean;
  /**
   * Enable the AI assistant, disabled by default.
   * The given settings are fixed, the user chooses the others in the settings of the assistant.
   */
  assistant?: boolean | Partial<AssistantSettings>;
  /** Unique id that namespaces React Flow and its SVG markers, a generated one by default. */
  id?: string;
  /** Host content added to the file menu and the settings. */
  slots?: EditorSlots;
  style?: React.CSSProperties;
  className?: string;
}

interface EditorShellProps extends EditorProps {
  workspace: WorkspaceStore;
}

/** Call the latest listener of the host with the id and the new graph after each change. */
export function useGraphChanges(
  workspace: WorkspaceStore,
  listener: ((id: string, graph: model.Graph) => void) | undefined,
): void {
  const emit = useEffectEvent((id: string, graph: model.Graph) => listener?.(id, graph));

  useEffect(
    () =>
      subscribeDocuments(workspace, (doc, state, previous) => {
        if (state.graph !== previous.graph) {
          emit(doc.id, state.graph);
        }
      }),
    [workspace],
  );
}

/** The editor of a workspace, shared by `<GraphEditor>` and `<GraphWorkspace>`. */
export function EditorShell({
  workspace,
  readOnly = false,
  toolbar = false,
  panels = false,
  guide = false,
  assistant,
  id,
  slots = {},
  style,
  className,
  children,
}: EditorShellProps): React.JSX.Element {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const breakpoint = useContainerBreakpoint(rootRef);

  // The assistant edits the graph, so read-only instances hide it.
  const requested = readOnly || !assistant ? undefined : assistant === true ? {} : assistant;
  // a fresh object of the host with the same settings keeps the config
  const [fixed, setFixed] = useState(requested);

  if (!shallow(fixed, requested)) {
    setFixed(requested);
  }

  const config: ArgueConfig = {
    id,
    readOnly,
    toolbar,
    panels,
    guide: guide && !readOnly,
    assistant: fixed,
    slots,
    breakpoint,
    rootRef,
    wrapperRef,
  };

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
          <ArgueConfigProvider value={config}>
            <GraphEditorLayout />
            <NoticeSnackbar />
            {children}
          </ArgueConfigProvider>
        </WorkspaceProvider>
      </ReactFlowProvider>
    </div>
  );
}
