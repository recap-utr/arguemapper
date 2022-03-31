import cytoscape from "cytoscape";
import { pick } from "lodash";
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
  currentCy: () => cytoscape.Core | null;
  _setCurrentCy: (instance: cytoscape.Core) => void;
  loadGraph: () => cytoModel.CytoGraph;
  updateGraph: () => void;
  redo: () => void;
  undo: () => void;
  resetStates: () => void;
  exportState: () => cytoModel.CytoGraph;
  resetGraph: (useDemo: boolean) => void;
  undoable: boolean;
  redoable: boolean;
}>({
  cy: null,
  _setCy: () => {},
  currentCy: () => null,
  _setCurrentCy: () => {},
  loadGraph: () => cytoModel.init(),
  updateGraph: () => {},
  redo: () => {},
  undo: () => {},
  resetStates: () => {},
  exportState: () => cytoModel.init(),
  resetGraph: () => {},
  undoable: false,
  redoable: false,
});

interface GraphProviderProps {
  storageName: string;
}

export const GraphProvider: React.FC<GraphProviderProps> = ({
  children,
  storageName,
}) => {
  const [initialGraph, setInitialGraph] = useState<cytoModel.CytoGraph>(
    cytoModel.init()
  );

  const loadGraph = useCallback(() => {
    const storedGraph = localStorage.getItem(storageName);

    if (storedGraph) {
      try {
        return JSON.parse(storedGraph);
      } catch {}
    }

    return initialGraph;
  }, [storageName, initialGraph]);

  const [currentState, setCurrentState] =
    useState<cytoModel.CytoGraph>(loadGraph);
  const currentStateRef = useRef<cytoModel.CytoGraph | null>(null);
  const [previousStates, setPreviousStates] = useState<cytoModel.CytoGraph[]>(
    []
  );
  const [futureStates, setFutureStates] = useState<cytoModel.CytoGraph[]>([]);
  const [cy, _setCy] = useState<cytoscape.Core | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    // This function is responsible for updating `currentStateRef` every time `currentState` changes.
    localStorage.setItem(storageName, JSON.stringify(currentState));
    currentStateRef.current = currentState;
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
          "pan",
          "zoom",
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

      return cytoModel.init();
    },
    []
  );

  const updateGraph = useCallback(() => {
    const state = currentStateRef.current;

    if (state) {
      setFutureStates([]);
      setPreviousStates((states) => [state, ...states]);
      setCurrentState(exportState(true));
    }
  }, [exportState]);

  const undo = useCallback(() => {
    const state = currentStateRef.current;
    console.log(previousStates[0]);

    if (state) {
      cy?.json(previousStates[0]);
      cy?.elements().selectify();
      cy?.elements().unselect();

      setFutureStates((states) => [state, ...states]);
      setCurrentState(previousStates[0]);
      setPreviousStates((states) => states.slice(1));
    }
  }, [cy, previousStates]);

  const redo = useCallback(() => {
    const state = currentStateRef.current;

    if (state) {
      cy?.json(futureStates[0]);
      cy?.elements().selectify();
      cy?.elements().unselect();

      setPreviousStates((states) => [state, ...states]);
      setCurrentState(futureStates[0]);
      setFutureStates((states) => states.slice(1));
    }
  }, [cy, futureStates]);

  const resetStates = useCallback(() => {
    setPreviousStates([]);
    setFutureStates([]);
  }, []);

  const resetGraph = useCallback(
    (useDemo: boolean) => {
      localStorage.removeItem(storageName);

      if (useDemo) {
        setInitialGraph(demoGraph);
      } else {
        setInitialGraph(cytoModel.init());
      }
    },
    [setInitialGraph, storageName]
  );

  const undoable = previousStates.length > 0;
  const redoable = futureStates.length > 0;

  const currentCy = useCallback(() => cyRef.current, [cyRef]);
  const _setCurrentCy = useCallback(
    (instance: cytoscape.Core) => {
      cyRef.current = instance;
    },
    [cyRef]
  );

  return (
    <GraphContext.Provider
      value={{
        cy,
        _setCy,
        currentCy,
        _setCurrentCy,
        loadGraph,
        updateGraph,
        undo,
        redo,
        undoable,
        redoable,
        resetStates,
        resetGraph,
        exportState,
      }}
    >
      {children}
    </GraphContext.Provider>
  );
};

export const useGraph = () => useContext(GraphContext);
