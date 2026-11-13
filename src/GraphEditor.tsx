import type * as arguebuf from "arguebuf";
import { type Ref, useEffect, useImperativeHandle, useState } from "react";
import { EditorShell, type EditorProps, useGraphChanges } from "@/EditorShell.js";
import type * as model from "@/model.js";
import * as convert from "@/services/convert.js";
import {
  canRedo,
  canUndo,
  commit,
  createDocumentStore,
  createWorkspaceStore,
  redo,
  undo,
} from "@/store.js";

export interface GraphEditorProps extends EditorProps {
  /**
   * The graph to edit, it replaces the current one as an edit that can be undone whenever it changes.
   * Graphs are immutable, so the editor and the host can share them safely.
   */
  graph?: model.Graph;
  /** Called with the new graph after each change, e.g. an edit, an undo, or an import. */
  onGraphChange?: (graph: model.Graph) => void;
  ref?: Ref<GraphEditorHandle>;
}

export interface GraphEditorHandle {
  exportGraph: <F extends convert.ExportFormat>(format: F) => arguebuf.dump.Formats[F];
  fitView: () => void;
  layout: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

/** Editor of a single graph, which opening a file replaces. See `<GraphWorkspace>` for several graphs. */
export function GraphEditor({
  graph,
  onGraphChange,
  ref,
  ...props
}: GraphEditorProps): React.JSX.Element {
  // Create the stores exactly once per instance.
  const [doc] = useState(() => createDocumentStore({ graph }));
  const [workspace] = useState(() => createWorkspaceStore({ documents: [doc], tabs: false }));

  useEffect(() => {
    if (graph !== undefined) commit(doc, graph);
  }, [doc, graph]);

  useGraphChanges(workspace, (_id, next) => onGraphChange?.(next));

  useImperativeHandle(
    ref,
    (): GraphEditorHandle => ({
      exportGraph: (format) =>
        convert.exportGraph(doc.getState().graph, format, workspace.getState().analyst),
      fitView: () => doc.setState({ shouldFitView: true }),
      layout: () => doc.setState({ shouldLayout: true }),
      undo: () => undo(doc),
      redo: () => redo(doc),
      canUndo: () => canUndo(doc.getState()),
      canRedo: () => canRedo(doc.getState()),
    }),
    [doc, workspace],
  );

  return <EditorShell workspace={workspace} {...props} />;
}
