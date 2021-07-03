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
    cy: React.MutableRefObject<cytoscape.Core>;
    cyHook: Date;
    initializeCy: React.Dispatch<React.SetStateAction<Date>>;
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

  const stateRef = useRef<cytoModel.Wrapper>(null);
  const [currentState, setCurrentState] =
    useState<cytoModel.Wrapper>(loadGraph);
  const [previousStates, setPreviousStates] = useState([]);
  const [futureStates, setFutureStates] = useState([]);
  const cy = useRef<cytoscape.Core>(null);
  const [cyHook, initializeCy] = useState<Date>(null);

  useEffect(() => {
    localStorage.setItem(storageName, JSON.stringify(currentState));
    stateRef.current = currentState;
  }, [currentState, storageName]);

  const updateGraph = useCallback(() => {
    setPreviousStates((states) => [stateRef.current, ...states]);
    setFutureStates([]);
    setCurrentState({
      // @ts-ignore
      data: cy.current.data(),
      elements: {
        // @ts-ignore
        nodes: cy.current.nodes("[metadata]").jsons(),
        // @ts-ignore
        edges: cy.current.edges("[metadata]").jsons(),
      },
    });
  }, [setCurrentState]);

  const undo = useCallback(() => {
    cy.current.json(previousStates[0]);
    cy.current.elements().selectify();
    cy.current.elements().unselect();

    setFutureStates((states) => [currentState, ...states]);
    setCurrentState(previousStates[0]);
    setPreviousStates((states) => states.slice(1));
  }, [currentState, previousStates, setCurrentState]);

  const redo = useCallback(() => {
    cy.current.json(futureStates[0]);
    cy.current.elements().selectify();
    cy.current.elements().unselect();

    setPreviousStates((states) => [currentState, ...states]);
    setCurrentState(futureStates[0]);
    setFutureStates((states) => states.slice(1));
  }, [currentState, futureStates, setCurrentState]);

  const reset = useCallback(() => {
    setPreviousStates([]);
    setFutureStates([]);
  }, []);

  const undoable = useCallback(
    () => previousStates.length > 0,
    [previousStates]
  );
  const redoable = useCallback(() => futureStates.length > 0, [futureStates]);

  return (
    <GraphContext.Provider
      value={{
        cy,
        cyHook,
        initializeCy,
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
