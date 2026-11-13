import type * as arguebuf from "arguebuf";
import { omit, pick, throttle } from "es-toolkit";
import { clear, createStore, delMany, get, getMany, setMany, type UseStore } from "idb-keyval";
import { resolveAssistantConfig } from "@/assistant/config.js";
import * as model from "@/model.js";
import * as convert from "@/services/convert.js";
import { createStore as createZustandStore, type StoreApi } from "zustand/vanilla";
import { createDocumentStore, createWorkspaceStore } from "@/store/createStore.js";
import type { Settings, WorkspaceState, WorkspaceStore } from "@/store/types.js";
import { notify, subscribeDocuments } from "@/store/workspace.js";

/**
 * Layout of the stored records, bumping it starts afresh instead of migrating them.
 * Records of other versions are discarded on load, new optional settings need no bump.
 */
const VERSION = 4;
/** Undo steps per graph that survive a reload. */
const HISTORY_LIMIT = 20;
const WORKSPACE_KEY = "workspace";

// The API key is a secret, so it is kept in the session storage, like the undo history.
const storedFields = [
  "analyst",
  "edgeStyle",
  "guide",
  "imageScale",
  "layoutAlgorithm",
  "prettifyJson",
  "panels",
  "assistantConfig",
  "assistantMessages",
] as const satisfies readonly (keyof Settings)[];

type WorkspaceRecord = Pick<Settings, (typeof storedFields)[number]> & {
  readonly version: number;
  /** Ids of the open graphs in the order of their tabs. */
  readonly documents: readonly string[];
  readonly active: string;
};

/** Stored graph. */
export interface GraphRecord {
  readonly graph: arguebuf.GraphJson;
  /** Name of the graph, which arguebuf JSON does not hold. */
  readonly name?: string;
}

interface DocumentRecord extends GraphRecord {
  readonly selectedResource?: string;
}

type HistoryRecord = Readonly<
  Record<string, { readonly past: GraphRecord[]; readonly future: GraphRecord[] }>
>;

// graphs are immutable, so e.g. the undo history is only serialized once per graph
const records = new WeakMap<model.Graph, GraphRecord>();

function toRecord(graph: model.Graph): GraphRecord {
  let record = records.get(graph);

  if (record === undefined) {
    record = { graph: convert.dumpGraph(graph), name: graph.name };
    records.set(graph, record);
  }

  return record;
}

const fromRecord = ({ graph, name }: GraphRecord): model.Graph =>
  convert.importGraph(graph, { name });

const documentKey = (id: string) => `graph/${id}`;
const apiKeyKey = (name: string) => `${name}/apiKey`;
const historyKey = (name: string) => `${name}/history`;

const databases = new Map<string, UseStore>();

/** The IndexedDB database of the workspace, which is named after it. */
function database(name: string): UseStore {
  let db = databases.get(name);

  if (db === undefined) {
    db = createStore(name, "state");
    databases.set(name, db);
  }

  return db;
}

/** Workspaces that are being removed, which must not be written again. */
const cleared = new Set<string>();

/** Lock of the persisted workspace, held by one browser tab at a time. */
export type Lock = StoreApi<{ readonly held: boolean }>;

/**
 * Request the lock of the workspace, which is kept until the page is closed or another tab steals it.
 * Without stealing, it is only granted if no other tab holds it.
 */
function acquireLock(name: string, steal: boolean): Promise<Lock> {
  const { promise, resolve } = Promise.withResolvers<Lock>();
  const lock: Lock = createZustandStore(() => ({ held: false }));

  navigator.locks
    .request(name, steal ? { steal: true } : { ifAvailable: true }, (granted) => {
      lock.setState({ held: granted !== null });
      resolve(lock);

      return granted === null ? undefined : new Promise<void>(() => {});
    })
    // another tab stole the lock
    .catch(() => lock.setState({ held: false }));

  return promise;
}

/** Restore the undo history of the graphs after a reload of the page. */
function readHistory(name: string): HistoryRecord {
  try {
    return JSON.parse(sessionStorage.getItem(historyKey(name)) ?? "{}") as HistoryRecord;
  } catch {
    return {};
  }
}

/** Keep the most recent undo steps of the graphs for a reload of the page. */
function writeHistory(name: string, { documents }: WorkspaceState): void {
  const dump = (graphs: readonly model.Graph[]) =>
    graphs.slice(-HISTORY_LIMIT).map(toRecord);
  const history: HistoryRecord = Object.fromEntries(
    documents.map((doc) => {
      const { past, future } = doc.getState();

      return [doc.id, { past: dump(past), future: dump(future) }];
    }),
  );

  try {
    sessionStorage.setItem(historyKey(name), JSON.stringify(history));
  } catch {
    // e.g. the quota is exceeded, then the history is lost on reload
    sessionStorage.removeItem(historyKey(name));
  }
}

/** The stored workspace record and its graphs, undefined if nothing is stored in this version. */
async function readStored(
  db: UseStore,
): Promise<{ record: WorkspaceRecord; docs: [string, DocumentRecord][] } | undefined> {
  const record = await get<WorkspaceRecord>(WORKSPACE_KEY, db);

  if (record?.version !== VERSION) {
    return undefined;
  }

  const stored = await getMany<DocumentRecord | undefined>(record.documents.map(documentKey), db);
  const docs = record.documents.flatMap((id, index): [string, DocumentRecord][] => {
    const doc = stored[index];

    return doc === undefined ? [] : [[id, doc]];
  });

  return { record, docs };
}

/** Read the persisted workspace, a new one with the graphs if there is none. */
async function readWorkspace(
  name: string,
  graphs: readonly model.Graph[],
): Promise<WorkspaceStore> {
  const db = database(name);
  const stored = await readStored(db);
  const assistantApiKey = sessionStorage.getItem(apiKeyKey(name)) ?? "";

  if (stored === undefined) {
    // records of another version would otherwise stay behind forever
    await clear(db);
    sessionStorage.removeItem(historyKey(name));

    return createWorkspaceStore({ settings: { assistantApiKey }, graphs });
  }

  const { record, docs } = stored;
  const history = readHistory(name);
  const load = (records: readonly GraphRecord[] = []) => records.map(fromRecord);
  const settings = omit(record, ["version", "documents", "active"]);

  return createWorkspaceStore({
    settings: {
      ...settings,
      assistantConfig: resolveAssistantConfig(settings.assistantConfig),
      assistantApiKey,
    },
    documents: docs.map(([id, doc]) =>
      createDocumentStore({
        id,
        graph: fromRecord(doc),
        selectedResource: doc.selectedResource,
        past: load(history[id]?.past),
        future: load(history[id]?.future),
      }),
    ),
    active: record.active,
  });
}

/** Save the changes of the workspace while the tab holds its lock. */
function persist(name: string, workspace: WorkspaceStore, lock: Lock): void {
  const db = database(name);
  // ids of the graphs whose records are outdated, and of the stored ones
  const dirty = new Set<string>();
  let stored = new Set(workspace.getState().documents.map((doc) => doc.id));
  let workspaceChanged = false;
  const writable = () => lock.getState().held && !cleared.has(name);

  // e.g. a streamed reply changes the workspace often, so the latest changes are written in batches
  const flush = throttle(
    () => {
      if (!writable()) {
        return;
      }

      const state = workspace.getState();
      const current = new Set(state.documents.map((doc) => doc.id));
      const entries: [string, WorkspaceRecord | DocumentRecord][] = state.documents
        .filter((doc) => dirty.has(doc.id))
        .map((doc) => {
          const { graph, selectedResource } = doc.getState();

          return [documentKey(doc.id), { ...toRecord(graph), selectedResource }];
        });

      if (workspaceChanged) {
        entries.push([
          WORKSPACE_KEY,
          {
            ...pick(state, storedFields),
            version: VERSION,
            documents: [...current],
            active: state.active,
          },
        ]);
      }

      const deleted = [...stored.difference(current)].map(documentKey);
      dirty.clear();
      stored = current;
      workspaceChanged = false;

      Promise.all([setMany(entries, db), delMany(deleted, db)]).catch((error: unknown) => {
        notify(
          workspace,
          `Your graphs could not be saved: ${model.describeError(error)}`,
          "error",
        );
      });
    },
    500,
    { edges: ["trailing"] },
  );

  workspace.subscribe((state, previous) => {
    if (state.documents !== previous.documents) {
      for (const doc of state.documents) {
        if (!stored.has(doc.id)) dirty.add(doc.id);
      }
    }

    if (
      state.documents !== previous.documents ||
      state.active !== previous.active ||
      storedFields.some((field) => state[field] !== previous[field])
    ) {
      workspaceChanged = true;
      flush();
    }

    if (state.assistantApiKey !== previous.assistantApiKey && writable()) {
      sessionStorage.setItem(apiKeyKey(name), state.assistantApiKey);
    }
  });

  subscribeDocuments(workspace, (doc, state, previous) => {
    if (state.graph !== previous.graph || state.selectedResource !== previous.selectedResource) {
      dirty.add(doc.id);
      flush();
    }
  });

  // pending writes of a stolen workspace would overwrite the ones of the other tab
  lock.subscribe(() => flush.cancel());
  // writes started while the page is closed may not finish, so they are flushed once it is hidden
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush.flush();
  });
  window.addEventListener("pagehide", () => {
    flush.flush();

    if (writable()) writeHistory(name, workspace.getState());
  });
}

/** Persisted workspace of a browser tab, absent while another tab holds the lock. */
export interface Session {
  readonly lock: Lock;
  readonly workspace?: WorkspaceStore;
}

const sessions = new Map<string, Promise<Session>>();

/**
 * Open the persisted workspace with the name, a new one with the graphs if nothing is stored.
 * Only one browser tab holds it, others get no workspace unless they steal it.
 * The session is shared by all callers of the page until it is stolen back.
 */
export function openSession(
  name: string,
  graphs: readonly model.Graph[],
  steal = false,
): Promise<Session> {
  const cached = sessions.get(name);

  if (cached !== undefined && !steal) {
    return cached;
  }

  const session = acquireLock(name, steal).then(async (lock): Promise<Session> => {
    if (!lock.getState().held) {
      return { lock };
    }

    try {
      const workspace = await readWorkspace(name, graphs);
      persist(name, workspace, lock);
      // otherwise the browser may evict the storage when the disk runs full
      void navigator.storage.persist();

      return { lock, workspace };
    } catch (error) {
      // e.g. the browser blocks the storage, then the workspace works without it
      if (!(error instanceof DOMException)) throw error;

      const workspace = createWorkspaceStore({ graphs });
      notify(workspace, "Your graphs are not saved, as the browser blocks the storage.", "warning");

      return { lock, workspace };
    }
  });
  sessions.set(name, session);

  return session;
}

/** The persisted graphs as arguebuf JSON with their names, e.g. to recover them when the app breaks. */
export async function readBackups(name: string): Promise<GraphRecord[]> {
  const stored = await readStored(database(name));

  return stored?.docs.map(([, doc]) => doc) ?? [];
}

/** Remove the persisted workspace, which is no longer saved until the page is reloaded. */
export async function clearSession(name: string): Promise<void> {
  cleared.add(name);
  sessionStorage.removeItem(apiKeyKey(name));
  sessionStorage.removeItem(historyKey(name));
  await clear(database(name));
}
