import { GraphEditor } from "@/GraphEditor.js";
import { AifdbImport } from "@/standalone/AifdbImport.js";
import { ClearCacheButton } from "@/standalone/ClearCacheButton.js";

/** Key of the state that the standalone app stores in the browser. */
export const PERSIST_KEY = "arguemapper";

// ArgueMapper, the standalone app: the full-feature configuration of the embeddable <GraphEditor>,
// with the app-specific widgets injected as slots.
export default function App(): React.JSX.Element {
  return (
    <GraphEditor
      persistKey={PERSIST_KEY}
      toolbar
      panels
      assistant={{}}
      slots={{ fileMenu: <AifdbImport />, settings: <ClearCacheButton /> }}
      style={{ height: "100dvh" }}
    />
  );
}
