// Barrel of the store module. Components consume the workspace of their editor through React context
// (see `store/hooks.ts`), each `<GraphEditor>` and `<GraphWorkspace>` owns one.
export {
  type ArgueConfig,
  ArgueConfigProvider,
  useArgueConfig,
} from "@/store/ArgueConfigContext.js";
export { useWorkspaceApi, WorkspaceProvider } from "@/store/context.js";
export {
  createDocumentStore,
  createWorkspaceStore,
  type DocumentInit,
} from "@/store/createStore.js";
export { FlowWrapperProvider, useFlowWrapperRef } from "@/store/FlowWrapperContext.js";
export { canRedo, canUndo, commit, redo, undo } from "@/store/history.js";
export {
  useArgueActions,
  useDocument,
  useDocumentApi,
  useWorkspace,
} from "@/store/hooks.js";
export {
  InstanceFocusProvider,
  useFocusWithin,
  useInstanceFocused,
} from "@/store/InstanceFocusContext.js";
export { type EditorSlots, SlotsProvider, useSlots } from "@/store/SlotsContext.js";
export type {
  AnalystIdentity,
  DocumentState,
  DocumentStore,
  Panel,
  WorkspaceState,
  WorkspaceStore,
} from "@/store/types.js";
export {
  findDocument,
  assistantWorkspace,
  closeDocument,
  openDocument,
  resetConversation,
  showDocument,
  subscribeDocuments,
} from "@/store/workspace.js";
