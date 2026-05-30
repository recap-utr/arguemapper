import { ArgueMapper } from "./ArgueMapper.js";
import { AifdbImport } from "./standalone/AifdbImport.js";
import { ClearCacheButton } from "./standalone/ClearCacheButton.js";
import { SideToggle } from "./standalone/SideToggle.js";
import { WelcomeSnackbar } from "./standalone/WelcomeSnackbar.js";

// The standalone app is the full-feature configuration of the embeddable <ArgueMapper>, with the
// app-specific inspector widgets injected as slots.
export default function App() {
  return (
    <ArgueMapper
      persistKey="state"
      header
      sidebar
      side="right"
      toolbar
      assistant={{}}
      inspectorSlots={{
        import: <AifdbImport />,
        configuration: (
          <>
            <SideToggle />
            <ClearCacheButton />
          </>
        ),
      }}
      style={{ height: "100vh" }}
    >
      <WelcomeSnackbar />
    </ArgueMapper>
  );
}
