import cytoscape from "cytoscape";
import React, { createContext, useCallback, useContext, useState } from "react";
import { useLocalStorage } from "react-use";
import * as cytoModel from "../model/cytoModel";
import demoGraph from "../model/demo";

const GraphContext = createContext<
  Partial<{
    cy: cytoscape.Core;
    setCy: (cy: React.SetStateAction<cytoscape.Core>) => void;
    graph: cytoModel.Wrapper;
    updateGraph: (cy: cytoscape.Core) => void;
    redo: () => void;
    undo: () => void;
    reset: () => void;
    undoable: () => boolean;
    redoable: () => boolean;
  }>
>(null);

export const GraphProvider: React.FC = ({ children }) => {
  const [currentState, setCurrentState] = useLocalStorage(
    "cytoGraph",
    demoGraph
  );
  const [previousStates, setPreviousStates] = useState([]);
  const [futureStates, setFutureStates] = useState([]);
  const [cy, setCy] = useState<cytoscape.Core>(null);

  const updateGraph = useCallback(() => {
    // @ts-ignore
    setCurrentState((pastState) => {
      console.log(pastState.elements.nodes[0].data);
      setPreviousStates((states) => [pastState, ...states]);
      setFutureStates([]);

      return {
        // @ts-ignore
        data: cy.data(),
        elements: {
          // @ts-ignore
          nodes: cy.elements("node[kind='scheme'], node[kind='atom']").jsons(),
          // @ts-ignore
          edges: cy.elements("edge").jsons(),
        },
      };
    });
    // TODO: Circular dependency!!!!!!!!!!!
  }, [cy, setCurrentState]);

  const undo = useCallback(() => {
    setCurrentState(previousStates[0]);

    cy.json(previousStates[0]);
    cy.elements().unselect();

    setFutureStates((states) => [currentState, ...states]);
    setPreviousStates((states) => states.slice(1));
  }, [cy, currentState, previousStates, setCurrentState]);

  const redo = useCallback(() => {
    setCurrentState(futureStates[0]);

    cy.json(futureStates[0]);
    cy.elements().unselect();

    setPreviousStates((states) => [currentState, ...states]);
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

  return (
    <GraphContext.Provider
      value={{
        cy,
        setCy,
        graph: currentState,
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
