import * as arguebuf from "arguebuf";
import { pick, throttle } from "es-toolkit";
import { type PersistStorage, type StorageValue } from "zustand/middleware";
import * as convert from "@/services/convert.js";
import { resolveAssistantConfig, type State } from "@/store/types.js";

type PersistState = Pick<
  State,
  | "analyst"
  | "edgeStyle"
  | "graph"
  | "guide"
  | "imageScale"
  | "layoutAlgorithm"
  | "prettifyJson"
  | "selectedResource"
  | "panels"
  | "assistantConfig"
  | "assistantMessages"
  | "assistantApiKey"
>;

// On disk the graph is arguebuf JSON, and a new session lacks the API key.
type SerializedState = Omit<PersistState, "graph" | "assistantApiKey"> & {
  graph: arguebuf.GraphJson;
  assistantApiKey?: string;
};

const fields = [
  "analyst",
  "edgeStyle",
  "graph",
  "guide",
  "imageScale",
  "layoutAlgorithm",
  "prettifyJson",
  "selectedResource",
  "panels",
  "assistantConfig",
  "assistantMessages",
  "assistantApiKey",
] as const satisfies readonly (keyof PersistState)[];

type Field = (typeof fields)[number];

// The API key is a secret, so it is kept for the browser session only.
const sessionFields: ReadonlySet<Field> = new Set(["assistantApiKey"]);
const backend = (field: Field): Storage => (sessionFields.has(field) ? sessionStorage : localStorage);

// Each field has its own key below the version, so a change writes only the changed fields.
const fieldKey = (name: string, field: Field) => `${name}/${field}`;

function serialize(state: PersistState, field: Field): unknown {
  switch (field) {
    case "graph":
      return convert.exportGraph(state.graph, "arguebuf", state.analyst);
    default:
      return state[field];
  }
}

// e.g. a streamed reply changes the store often, so the latest changes are written once per second
const pending = new Map<string, { value: StorageValue<PersistState>; fields: Set<Field> }>();
const written = new Map<string, PersistState>();
const writePending = throttle(
  () => {
    for (const [name, { value, fields }] of pending) {
      localStorage.setItem(name, JSON.stringify(value.version));

      for (const field of fields) {
        // JSON has no undefined, e.g. of `selectedResource`, so it is stored as null
        backend(field).setItem(
          fieldKey(name, field),
          JSON.stringify(serialize(value.state, field) ?? null),
        );
      }
    }

    pending.clear();
  },
  1000,
  { edges: ["trailing"] },
);
let flushesOnPageHide = false;

/** Read the persisted state, e.g. also to recover it after a crash. */
export function readState(name: string): StorageValue<PersistState> | null {
  const version: unknown = JSON.parse(localStorage.getItem(name) ?? "null");

  // nothing is stored, or in the former layout
  if (typeof version !== "number") {
    return null;
  }

  const entries = fields.flatMap((field) => {
    const value = backend(field).getItem(fieldKey(name, field));
    return value === null ? [] : [[field, JSON.parse(value) ?? undefined] as const];
  });
  const stored = new Set(entries.map(([field]) => field));

  // the first write of every session stores all fields, so missing ones stem from another version
  if (fields.some((field) => !stored.has(field) && !sessionFields.has(field))) {
    return null;
  }

  const state = Object.fromEntries(entries) as SerializedState;

  return {
    version,
    state: {
      ...state,
      graph: convert.importGraph(state.graph),
      assistantConfig: resolveAssistantConfig(state.assistantConfig),
      assistantApiKey: state.assistantApiKey ?? "",
    },
  };
}

/** Persistence in the local storage, and the session storage for secrets, with the graph as arguebuf JSON. */
const storage: PersistStorage<PersistState> = {
  getItem: readState,
  setItem: (name, value) => {
    const previous = written.get(name);
    const changed = fields.filter(
      (field) =>
        previous === undefined ||
        !Object.is(previous[field], value.state[field]) ||
        // the graph records the analyst
        (field === "graph" && previous.analyst !== value.state.analyst),
    );

    if (changed.length === 0) {
      return;
    }

    written.set(name, value.state);
    pending.set(name, {
      value,
      fields: new Set([...(pending.get(name)?.fields ?? []), ...changed]),
    });
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

    for (const field of fields) {
      backend(field).removeItem(fieldKey(name, field));
    }
  },
};

/** Whether the storages are accessible, browsers throw on access if the site data is blocked. */
function accessible(): boolean {
  try {
    return localStorage !== undefined && sessionStorage !== undefined;
  } catch {
    return false;
  }
}

/** The persistence of the browser, absent if its storages are not accessible. */
export const browserStorage: PersistStorage<PersistState> | undefined = accessible()
  ? storage
  : undefined;

export const partialize = (state: State): PersistState => pick(state, fields);

export const persistVersion = 3;
