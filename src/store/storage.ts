import * as arguebuf from "arguebuf";
import { throttle } from "es-toolkit";
import { shallow } from "zustand/shallow";
import { type PersistStorage, type StorageValue } from "zustand/middleware";
import * as convert from "@/services/convert.js";
import { resolveAssistantConfig, type State } from "@/store/types.js";

export type PersistState = Pick<
  State,
  | "analyst"
  | "edgeStyle"
  | "firstVisit"
  | "graph"
  | "imageScale"
  | "layoutAlgorithm"
  | "prettifyJson"
  | "selectedResource"
  | "sidebarSide"
  | "sidebarSections"
  | "assistantConfig"
  | "assistantMessages"
>;

// On disk the graph is arguebuf JSON.
type SerializedState = Omit<PersistState, "analyst" | "graph"> & {
  analyst: arguebuf.AnalystInit;
  graph: arguebuf.GraphJson;
};

function write(name: string, { version, state }: StorageValue<PersistState>): void {
  const { graph, analyst } = state;
  const serializedState: StorageValue<SerializedState> = {
    version,
    state: {
      ...state,
      analyst: { id: analyst.id, name: analyst.name, email: analyst.email },
      graph: convert.exportGraph(graph, "arguebuf", analyst),
    },
  };
  localStorage.setItem(name, JSON.stringify(serializedState));
}

// e.g. a streamed reply changes the store often, so only the latest state is written once per second
const pending = new Map<string, StorageValue<PersistState>>();
// most store changes do not touch the persisted fields
const written = new Map<string, PersistState>();
const writePending = throttle(
  () => {
    for (const [name, value] of pending) {
      write(name, value);
    }

    pending.clear();
  },
  1000,
  { edges: ["trailing"] },
);
let flushesOnPageHide = false;

/** Read the persisted state, e.g. also to recover it after a crash. */
export function readState(name: string): StorageValue<PersistState> | null {
  const serializedState = localStorage.getItem(name);

  if (serializedState === null) {
    return null;
  }

  const { version, state } = JSON.parse(serializedState) as StorageValue<SerializedState>;

  return {
    version,
    state: {
      ...state,
      graph: convert.importGraph(state.graph),
      analyst: new arguebuf.Analyst(state.analyst),
      assistantConfig: resolveAssistantConfig(state.assistantConfig),
    },
  };
}

/** localStorage-backed persistence that serializes the graph to/from arguebuf JSON. */
export const localStorageBacked: PersistStorage<PersistState> = {
  getItem: readState,
  setItem: (name, value) => {
    const previous = written.get(name);

    if (previous !== undefined && shallow(previous, value.state)) {
      return;
    }

    written.set(name, value.state);
    pending.set(name, value);
    writePending();

    // pending writes would be lost when the page is closed
    if (!flushesOnPageHide) {
      window.addEventListener("pagehide", () => writePending.flush());
      flushesOnPageHide = true;
    }
  },
  removeItem: (name) => {
    pending.delete(name);
    written.delete(name);
    localStorage.removeItem(name);
  },
};

export const partialize = (state: State): PersistState => ({
  graph: state.graph,
  firstVisit: state.firstVisit,
  analyst: state.analyst,
  layoutAlgorithm: state.layoutAlgorithm,
  prettifyJson: state.prettifyJson,
  imageScale: state.imageScale,
  edgeStyle: state.edgeStyle,
  selectedResource: state.selectedResource,
  sidebarSide: state.sidebarSide,
  sidebarSections: state.sidebarSections,
  assistantConfig: state.assistantConfig,
  assistantMessages: state.assistantMessages,
});

export const persistVersion = 2;
