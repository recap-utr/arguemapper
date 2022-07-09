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
import { useReactFlow } from "react-flow-renderer";
import * as model from "../model";
import generateDemo from "../services/demo";
import layout from "../services/layout";

const GraphContext = createContext<{
  graph: model.Graph;
  setGraph: React.Dispatch<React.SetStateAction<model.Graph>>;
  resetGraph: (graph?: model.Graph) => void;
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
  graph: model.initGraph({}),
  setGraph: () => {},
  resetGraph: () => {},
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

interface GraphProviderProps {
  storageName: string;
}

export const GraphProvider: React.FC<GraphProviderProps> = ({
  children,
  storageName,
}) => {
  // Load the current state from storage when (re)loading the app
  const loadGraph = useCallback(() => {
    const storedGraph = localStorage.getItem(storageName);

    if (storedGraph) {
      try {
        return JSON.parse(storedGraph);
      } catch {}
    }

    return model.initGraph({});
  }, [storageName]);

  const [graph, setGraph] = useState<model.Graph>(loadGraph);
  const [selection, setSelection] = useState<model.Selection>({
    nodes: [],
    edges: [],
  });
  const [previousStates, setPreviousStates] = useState<model.Graph[]>([]);
  const [futureStates, setFutureStates] = useState<model.Graph[]>([]);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [shouldSave, setShouldSave] = useState(false);
  const flow = useReactFlow();

  const saveState = useCallback(() => {
    setShouldSave(true);
  }, []);

  const undo = useCallback(() => {
    setFutureStates((states) => [graph, ...states]);
    setGraph(previousStates[0]);
    setPreviousStates((states) => states.slice(1));
    localStorage.setItem(storageName, JSON.stringify(graph));
  }, [setGraph, graph, previousStates]);

  const redo = useCallback(() => {
    setPreviousStates((states) => [graph, ...states]);
    setGraph(futureStates[0]);
    setFutureStates((states) => states.slice(1));
    localStorage.setItem(storageName, JSON.stringify(graph));
  }, [setGraph, graph, futureStates]);

  const resetStates = useCallback(() => {
    setPreviousStates([]);
    setFutureStates([]);
  }, []);

  const clearCache = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  const resetGraph = useCallback(
    (inputGraph?: model.Graph) => {
      const g = inputGraph ?? model.initGraph({});
      layout(g).then((layoutedNodes) => {
        setGraph(
          produce(g, (draft) => {
            draft.nodes = layoutedNodes;
          })
        );
        localStorage.setItem(storageName, JSON.stringify(g));
        resetStates();
        flow.fitView();
      });
    },
    [resetStates, setGraph]
  );

  const undoable = previousStates.length > 0;
  const redoable = futureStates.length > 0;

  // Persist the current state every time it changes
  useEffect(() => {
    if (shouldSave) {
      localStorage.setItem(storageName, JSON.stringify(graph));
      setPreviousStates((states) => [graph, ...states]);
      setFutureStates([]);
      setShouldSave(false);
    }
  }, [graph, shouldSave, storageName]);

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
                  resetGraph(generateDemo());
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
  }, [resetGraph, closeSnackbar, enqueueSnackbar, storageName]);

  return (
    <GraphContext.Provider
      value={{
        graph,
        setGraph,
        resetGraph,
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
