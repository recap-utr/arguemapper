import { GraphWorkspace } from "@/GraphWorkspace.js";
import { AifdbImport } from "@/standalone/AifdbImport.js";
import { ClearCacheButton } from "@/standalone/ClearCacheButton.js";
import { PERSIST_KEY } from "@/standalone/storage.js";

// ArgueMapper, the standalone app: the full-feature configuration of the embeddable <GraphWorkspace>,
// with the app-specific widgets injected as slots.
export function App(): React.JSX.Element {
  return (
    <GraphWorkspace
      persistKey={PERSIST_KEY}
      toolbar
      panels
      guide
      assistant
      slots={{ fileMenu: <AifdbImport />, settings: <ClearCacheButton /> }}
      style={{ height: "100dvh" }}
    />
  );
}
