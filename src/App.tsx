import { GraphWorkspace } from "@/GraphWorkspace.js";
import { AifdbImport } from "@/standalone/AifdbImport.js";
import { ClearCacheButton } from "@/standalone/ClearCacheButton.js";

/** Key of the workspace that the standalone app stores in the browser. */
export const PERSIST_KEY = "arguemapper";

// ArgueMapper, the standalone app: the full-feature configuration of the embeddable <GraphWorkspace>,
// with the app-specific widgets injected as slots.
export default function App(): React.JSX.Element {
  return (
    <GraphWorkspace
      persistKey={PERSIST_KEY}
      toolbar
      panels
      assistant
      slots={{ fileMenu: <AifdbImport />, settings: <ClearCacheButton /> }}
      style={{ height: "100dvh" }}
    />
  );
}
