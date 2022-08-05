import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, IconButton, Stack } from "@mui/material";
import produce from "immer";
import { useSnackbar } from "notistack";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as model from "../model";
import generateDemo from "../services/demo";
import layout from "../services/layout";

const GraphContext = createContext<{
  nodes: Array<model.Node>;
  setNodes: React.Dispatch<React.SetStateAction<Array<model.Node>>>;
  edges: Array<model.Edge>;
  setEdges: React.Dispatch<React.SetStateAction<Array<model.Edge>>>;
  graph: model.Graph;
  setGraph: React.Dispatch<React.SetStateAction<model.Graph>>;
  state: model.State;
  setState: React.Dispatch<React.SetStateAction<model.State>>;
  resetState: (state?: model.State) => void;
  saveState: () => void;
  redo: () => void;
  undo: () => void;
  resetStates: () => void;
  undoable: boolean;
  redoable: boolean;
  clearCache: () => void;
  selection: model.Selection;
  setSelection: React.Dispatch<React.SetStateAction<model.Selection>>;
}>({
  nodes: [],
  setNodes: () => {},
  edges: [],
  setEdges: () => {},
  graph: model.initGraph({}),
  setGraph: () => {},
  state: model.initState({}),
  setState: () => {},
  resetState: () => {},
  saveState: () => {},
  redo: () => {},
  undo: () => {},
  resetStates: () => {},
  undoable: false,
  redoable: false,
  clearCache: () => {},
  selection: { nodes: [], edges: [] },
  setSelection: () => {},
});

interface GraphProviderProps extends React.PropsWithChildren {
  storageName: string;
}

export const GraphProvider: React.FC<GraphProviderProps> = ({
  children,
  storageName,
}) => {
  // Load the current state from storage when (re)loading the app
  const loadState = useCallback(() => {
    const storedState = localStorage.getItem(storageName);

    if (storedState) {
      try {
        return JSON.parse(storedState);
      } catch {}
    }

    return model.initState({});
  }, [storageName]);

  const [state, setState] = useState<model.State>(loadState);
  const [graph, setGraph] = useState<model.Graph>(state.graph);
  const [nodes, setNodes] = useState<Array<model.Node>>(state.nodes);
  const [edges, setEdges] = useState<Array<model.Edge>>(state.edges);

  // const [graph, setGraph] = useState<model.Graph>(model.initGraph({}));
  // const [nodes, setNodes] = useState<Array<model.Node>>([]);
  // const [edges, setEdges] = useState<Array<model.Edge>>([]);

  const [selection, setSelection] = useState<model.Selection>({
    nodes: [],
    edges: [],
  });
  const [previousStates, setPreviousStates] = useState<model.State[]>([]);
  const [futureStates, setFutureStates] = useState<model.State[]>([]);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const undo = useCallback(() => {
    setFutureStates((states) => [state, ...states]);
    setState(previousStates[0]);
    setPreviousStates((states) => states.slice(1));
  }, [setState, state, previousStates]);

  const redo = useCallback(() => {
    setPreviousStates((states) => [state, ...states]);
    setState(futureStates[0]);
    setFutureStates((states) => states.slice(1));
  }, [setState, state, futureStates]);

  const resetStates = useCallback(() => {
    setPreviousStates([]);
    setFutureStates([]);
  }, []);

  const clearCache = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  const resetState = useCallback(
    (preset?: model.State) => {
      const s = preset ?? model.initState({});
      layout(s).then((layoutedNodes) => {
        setState({
          nodes: layoutedNodes,
          edges: s.edges,
          graph: s.graph,
        });
        // TODO
        resetStates();
        // flow.fitView();
      });
    },
    [resetStates, setState]
  );

  const saveState = useCallback(() => {
    setState(
      produce((draft) => {
        draft.edges = edges;
        draft.nodes = nodes;
        draft.graph = graph;
      })
    );
  }, [edges, nodes, graph]);

  const undoable = previousStates.length > 0;
  const redoable = futureStates.length > 0;

  // Persist the current state every time it changes
  useEffect(() => {
    localStorage.setItem(storageName, JSON.stringify(state));
    setPreviousStates((states) => [state, ...states]);
    setFutureStates([]);
    setNodes(state.nodes);
    setEdges(state.edges);
    setGraph(state.graph);
  }, [state, storageName]);

  // If the user visits the app for the first time, show a little banner
  useEffect(() => {
    if (localStorage.getItem(storageName) === null) {
      enqueueSnackbar(
        "Hi there! If you are using this app for the first time, you may want to load our demo.",
        {
          key: "welcome",
          persist: true,
          variant: "info",
          action: (key) => (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                disableElevation
                variant="contained"
                onClick={() => {
                  resetState(generateDemo());
                  closeSnackbar(key);
                }}
              >
                Load Demo
              </Button>
              <IconButton
                onClick={() => {
                  closeSnackbar(key);
                }}
              >
                <FontAwesomeIcon icon={faXmark} />
              </IconButton>
            </Stack>
          ),
        }
      );
    }
  }, [resetState, closeSnackbar, enqueueSnackbar, storageName]);

  return (
    <GraphContext.Provider
      value={{
        nodes,
        setNodes,
        edges,
        setEdges,
        graph,
        setGraph,
        state,
        setState,
        resetState,
        saveState,
        undo,
        redo,
        undoable,
        redoable,
        resetStates,
        clearCache,
        selection,
        setSelection,
      }}
    >
      {children}
    </GraphContext.Provider>
  );
};

export const useGraph = () => useContext(GraphContext);
