import cytoscape from "cytoscape";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as cytoModel from "../model/cytoModel";
import demoGraph from "../model/demo";

const GraphContext = createContext<
  Partial<{
    cy: cytoscape.Core;
    _setCy: React.Dispatch<React.SetStateAction<cytoscape.Core>>;
    currentCy: () => cytoscape.Core;
    _setCurrentCy: (instance: cytoscape.Core) => void;
    loadGraph: () => cytoModel.Wrapper;
    updateGraph: () => void;
    redo: () => void;
    undo: () => void;
    reset: () => void;
    undoable: () => boolean;
    redoable: () => boolean;
  }>
>(null);

interface GraphProviderProps {
  storageName: string;
}

export const GraphProvider: React.FC<GraphProviderProps> = ({
  children,
  storageName,
}) => {
  // const [currentState, setCurrentState] = useLocalStorage(
  //   "cytoGraph",
  //   demoGraph
  // );
  const loadGraph = useCallback(() => {
    const storedGraph = localStorage.getItem(storageName);

    if (storedGraph) {
      return JSON.parse(storedGraph);
    }

    return demoGraph;
  }, [storageName]);

  const [currentState, setCurrentState] =
    useState<cytoModel.Wrapper>(loadGraph);
  const currentStateRef = useRef<cytoModel.Wrapper>(null);
  const [previousStates, setPreviousStates] = useState([]);
  const [futureStates, setFutureStates] = useState([]);
  const [cy, _setCy] = useState<cytoscape.Core>(null);
  const cyRef = useRef<cytoscape.Core>(null);

  useEffect(() => {
    localStorage.setItem(storageName, JSON.stringify(currentState));
    currentStateRef.current = currentState;
  }, [currentState, storageName]);

  const updateGraph = useCallback(() => {
    setPreviousStates((states) => [currentStateRef.current, ...states]);
    setFutureStates([]);
    setCurrentState({
      // @ts-ignore
      data: cyRef.current.data(),
      elements: {
        // @ts-ignore
        nodes: cyRef.current.nodes("[metadata]").jsons(),
        // @ts-ignore
        edges: cyRef.current.edges("[metadata]").jsons(),
      },
    });
  }, [setCurrentState]);

  const undo = useCallback(() => {
    cy.json(previousStates[0]);
    cy.elements().selectify();
    cy.elements().unselect();

    setFutureStates((states) => [currentState, ...states]);
    setCurrentState(previousStates[0]);
    setPreviousStates((states) => states.slice(1));
  }, [cy, currentState, previousStates, setCurrentState]);

  const redo = useCallback(() => {
    cy.json(futureStates[0]);
    cy.elements().selectify();
    cy.elements().unselect();

    setPreviousStates((states) => [currentState, ...states]);
    setCurrentState(futureStates[0]);
    setFutureStates((states) => states.slice(1));
  }, [cy, currentState, futureStates, setCurrentState]);

  const reset = useCallback(() => {
    setPreviousStates([]);
    setFutureStates([]);
  }, []);

  const undoable = useCallback(
    () => previousStates.length > 0,
    [previousStates]
  );
  const redoable = useCallback(() => futureStates.length > 0, [futureStates]);

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
        reset,
      }}
    >
      {children}
    </GraphContext.Provider>
  );
};

export const useGraph = () => useContext(GraphContext);
