import { Button, Stack, Typography } from "@mui/material";
import type * as arguebuf from "arguebuf";
import {
  type Ref,
  Suspense,
  use,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useState,
} from "react";
import { useStore } from "zustand";
import { EditorShell, type EditorProps } from "@/EditorShell.js";
import type * as model from "@/model.js";
import * as convert from "@/services/convert.js";
import {
  closeDocument,
  createWorkspaceStore,
  findDocument,
  openDocument,
  subscribeDocuments,
  type WorkspaceStore,
} from "@/store.js";
import { openSession } from "@/store/persistence.js";

export interface GraphWorkspaceProps extends EditorProps {
  /** Graphs opened initially, a persisted workspace restores its own instead. */
  graphs?: readonly model.Graph[];
  /**
   * Persist the workspace in the browser under this key (absent => no persistence).
   * Only one browser tab edits it at a time, the others offer to take it over.
   */
  persistKey?: string;
  /** Called with the id and the new graph after each change, e.g. an edit, an undo, or an import. */
  onGraphChange?: (id: string, graph: model.Graph) => void;
  ref?: Ref<GraphWorkspaceHandle>;
}

export interface GraphWorkspaceHandle {
  /** The open graphs in the order of their tabs. */
  graphs: () => readonly { readonly id: string; readonly graph: model.Graph }[];
  /** Open the graph in a new tab and return its id. */
  open: (graph: model.Graph) => string;
  close: (id: string) => void;
  exportGraph: <F extends convert.ExportFormat>(id: string, format: F) => arguebuf.dump.Formats[F];
}

type ViewProps = Omit<GraphWorkspaceProps, "graphs" | "persistKey">;

/** Editor of several graphs, which are opened as tabs. */
export function GraphWorkspace({
  graphs = [],
  persistKey,
  ...props
}: GraphWorkspaceProps): React.JSX.Element {
  return persistKey === undefined ? (
    <MemoryWorkspace graphs={graphs} {...props} />
  ) : (
    <Suspense>
      <PersistedWorkspace key={persistKey} persistKey={persistKey} graphs={graphs} {...props} />
    </Suspense>
  );
}

const MemoryWorkspace: React.FC<ViewProps & { graphs: readonly model.Graph[] }> = ({
  graphs,
  ...props
}) => {
  const [workspace] = useState(() =>
    createWorkspaceStore({ graphs }),
  );

  return <WorkspaceView workspace={workspace} {...props} />;
};

const PersistedWorkspace: React.FC<
  ViewProps & { persistKey: string; graphs: readonly model.Graph[] }
> = ({ persistKey, graphs, ...props }) => {
  const [request, setRequest] = useState(() => openSession(persistKey, graphs));
  const { lock, workspace } = use(request);
  const held = useStore(lock, (state) => state.held);

  return held && workspace !== undefined ? (
    <WorkspaceView workspace={workspace} {...props} />
  ) : (
    <Stack
      spacing={2}
      className={props.className}
      style={props.style}
      sx={{ alignItems: "center", justifyContent: "center", p: 3, textAlign: "center" }}
    >
      <Typography variant="h5">The graphs are open in another tab</Typography>
      <Typography color="text.secondary">
        Only one tab can edit them at a time, so that no changes get lost.
      </Typography>
      <Button variant="contained" onClick={() => setRequest(openSession(persistKey, graphs, true))}>
        Use them here
      </Button>
    </Stack>
  );
};

const WorkspaceView: React.FC<ViewProps & { workspace: WorkspaceStore }> = ({
  workspace,
  onGraphChange,
  ref,
  ...props
}) => {
  // reads the latest callback, so the subscription is kept when the host passes an inline one
  const emitChange = useEffectEvent((id: string, graph: model.Graph) => onGraphChange?.(id, graph));

  useEffect(
    () =>
      subscribeDocuments(workspace, (doc, state, previous) => {
        if (state.graph !== previous.graph) {
          emitChange(doc.id, state.graph);
        }
      }),
    [workspace],
  );

  useImperativeHandle(ref, (): GraphWorkspaceHandle => {
    const find = (id: string) => {
      const doc = findDocument(workspace.getState(), id);

      if (doc === undefined) {
        throw new Error(`No graph with id "${id}".`);
      }

      return doc;
    };

    return {
      graphs: () =>
        workspace.getState().documents.map((doc) => ({ id: doc.id, graph: doc.getState().graph })),
      open: (graph) => openDocument(workspace, { graph }).id,
      close: (id) => closeDocument(workspace, id),
      exportGraph: (id, format) =>
        convert.exportGraph(find(id).getState().graph, format, workspace.getState().analyst),
    };
  }, [workspace]);

  return <EditorShell workspace={workspace} {...props} />;
};
