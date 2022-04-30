import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, IconButton, Stack } from "@mui/material";
import cytoscape from "cytoscape";
import { pick } from "lodash";
import { useSnackbar } from "notistack";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as cytoModel from "../model/cytoWrapper";
import * as date from "../services/date";
import demoGraph from "../services/demo";

const GraphContext = createContext<{
  cy: cytoscape.Core | null;
  _setCy: (instance: cytoscape.Core | null) => void;
  _setCyRef: (instance: cytoscape.Core | null) => void;
  loadGraph: () => cytoModel.CytoGraph;
  updateGraph: () => void;
  redo: () => void;
  undo: () => void;
  resetStates: () => void;
  exportState: () => cytoModel.CytoGraph;
  resetGraph: (graph: cytoModel.CytoGraph) => void;
  undoable: boolean;
  redoable: boolean;
  clearCache: () => void;
  currentState: cytoModel.CytoGraph | null;
}>({
  cy: null,
  _setCy: () => {},
  _setCyRef: () => {},
  loadGraph: () => cytoModel.init({}),
  updateGraph: () => {},
  redo: () => {},
  undo: () => {},
  resetStates: () => {},
  exportState: () => cytoModel.init({}),
  resetGraph: () => {},
  undoable: false,
  redoable: false,
  clearCache: () => {},
  currentState: null,
});

interface GraphProviderProps {
  storageName: string;
}

export const GraphProvider: React.FC<GraphProviderProps> = ({
  children,
  storageName,
}) => {
  const [initialGraph, setInitialGraph] = useState<cytoModel.CytoGraph>(
    cytoModel.init({})
  );
  const [cy, _setCy] = useState<cytoscape.Core | null>(null);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [currentState, setCurrentState] = useState<cytoModel.CytoGraph | null>(
    null
  );
  const [previousStates, setPreviousStates] = useState<cytoModel.CytoGraph[]>(
    []
  );
  const [futureStates, setFutureStates] = useState<cytoModel.CytoGraph[]>([]);

  // IMPORTANT!
  // For two useState variables, we store another one with useRef.
  // This enables to use the current value without causing a chain of rerenderings due to changed callbacks
  // Otherwise, we would end up with an infinite loop that would break the application
  // The refs are for internal use of this context only and should not be exported!
  const stateRef = useRef<cytoModel.CytoGraph | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const loadGraph = useCallback(() => {
    const storedGraph = localStorage.getItem(storageName);

    if (storedGraph) {
      try {
        return JSON.parse(storedGraph);
      } catch {}
    }

    return initialGraph;
  }, [storageName, initialGraph]);

  // Here, we persist the current state every time it changes
  useEffect(() => {
    if (currentState !== null) {
      localStorage.setItem(storageName, JSON.stringify(currentState));
    }
  }, [currentState, storageName]);

  const exportState = useCallback(
    (update: boolean = false): cytoModel.CytoGraph => {
      // We cannot use cyRef.current?.json() because it may contain unwanted nodes/edges.
      // For instance, the preview of edge handles could be serialized.
      // Also, the style cannot be serialized properly because we use callback functions.
      const currentCy = cyRef.current;

      if (currentCy) {
        if (update) {
          currentCy.data("updated", date.now());
        }

        const cytoMetadata = pick(currentCy.json(), [
          // "pan",
          // "zoom",
          "data",
        ]) as {
          data: cytoModel.graph.Graph;
          [x: string]: unknown;
        };

        return {
          ...cytoMetadata,
          elements: {
            nodes: currentCy.nodes("[metadata]").jsons() as any,
            edges: currentCy.edges("[metadata]").jsons() as any,
          },
        };
      }

      return cytoModel.init({});
    },
    []
  );

  const updateGraph = useCallback(() => {
    const currState = stateRef.current;

    if (currState) {
      setFutureStates([]);
      setPreviousStates((states) => [currState, ...states]);
    }

    const newState = exportState(true);
    setCurrentState(newState);
    stateRef.current = newState;
  }, [exportState]);

  const undo = useCallback(() => {
    const currState = stateRef.current;

    if (currState) {
      cy?.json(previousStates[0]);
      cy?.elements().selectify();
      cy?.elements().unselect();

      setFutureStates((states) => [currState, ...states]);
      const newState = previousStates[0];
      setCurrentState(newState);
      stateRef.current = newState;
      setPreviousStates((states) => states.slice(1));
    }
  }, [cy, previousStates]);

  const redo = useCallback(() => {
    const currState = stateRef.current;

    if (currState) {
      cy?.json(futureStates[0]);
      cy?.elements().selectify();
      cy?.elements().unselect();

      setPreviousStates((states) => [currState, ...states]);
      const newState = futureStates[0];
      setCurrentState(newState);
      stateRef.current = newState;
      setFutureStates((states) => states.slice(1));
    }
  }, [cy, futureStates]);

  const resetStates = useCallback(() => {
    setPreviousStates([]);
    setFutureStates([]);
  }, []);

  const resetGraph = useCallback(
    (graph: cytoModel.CytoGraph) => {
      localStorage.removeItem(storageName);
      // Make the graph unique, otherwise React could skip rerendering
      graph.data.metadata.updated = date.now();
      setInitialGraph(graph);
    },
    [storageName]
  );

  const clearCache = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  const undoable = previousStates.length > 0;
  const redoable = futureStates.length > 0;

  const _setCyRef = useCallback((instance: cytoscape.Core | null) => {
    cyRef.current = instance;
  }, []);

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
                  resetGraph(demoGraph());
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
  }, [closeSnackbar, enqueueSnackbar, resetGraph, storageName]);

  return (
    <GraphContext.Provider
      value={{
        cy,
        _setCy,
        _setCyRef,
        loadGraph,
        updateGraph,
        undo,
        redo,
        undoable,
        redoable,
        resetStates,
        resetGraph,
        exportState,
        clearCache,
        currentState,
      }}
    >
      {children}
    </GraphContext.Provider>
  );
};

export const useGraph = () => useContext(GraphContext);
