// Barrel of the store module. Components consume the workspace of their editor through React context
// (see `store/hooks.ts`), each `<GraphEditor>` and `<GraphWorkspace>` owns one.
export type { NodePlacement } from "@/store/actions.js";
export {
  type ArgueConfig,
  ArgueConfigProvider,
  type EditorSlots,
  useArgueConfig,
  useWorkspaceApi,
  WorkspaceProvider,
} from "@/store/context.js";
export { createDocumentStore, createWorkspaceStore } from "@/store/createStore.js";
export { canRedo, canUndo, commit, redo, undo } from "@/store/history.js";
export { useArgueActions, useDocument, useDocumentApi, useWorkspace } from "@/store/hooks.js";
export { clearSession, type GraphRecord, openSession, readBackups } from "@/store/persistence.js";
export type {
  AnalystIdentity,
  DocumentState,
  DocumentStore,
  Notice,
  Panel,
  WorkspaceState,
  WorkspaceStore,
} from "@/store/types.js";
export {
  assistantWorkspace,
  closeDocument,
  findDocument,
  openDocument,
  resetConversation,
  showDocument,
  subscribeDocuments,
} from "@/store/workspace.js";
