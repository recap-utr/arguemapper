import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { CssBaseline, ThemeProvider, useMediaQuery } from "@mui/material";
import { ConfirmProvider } from "material-ui-confirm";
import { SnackbarProvider } from "notistack";
import React from "react";
import CacheBuster from "react-cache-buster";
import { createRoot } from "react-dom/client";
import { ReactFlowProvider } from "reactflow";
import { version as npmVersion } from "../package.json";
import App from "./App.js";
import ErrorBoundary from "./components/ErrorBoundary.js";
import "./style.css";
import theme from "./theme.js";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <Layout />
  </React.StrictMode>
);

function Layout() {
  // https://stackoverflow.com/a/58936230
  // const query = window.matchMedia("(prefers-color-scheme: dark)");
  // const [darkMode, setDarkMode] = useState(query.matches);
  // query.addEventListener("change", (e) => setDarkMode(e.matches));

  const darkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <CacheBuster
      currentVersion={npmVersion}
      isEnabled={isProduction}
      isVerboseMode={false}
      loadingComponent={undefined}
    >
      <ThemeProvider theme={theme(darkMode)}>
        <CssBaseline />
        <ConfirmProvider
          defaultOptions={{
            title: "Are you sure?",
            description: "This action is destructive and cannot be undone!",
            confirmationText: "OK",
            cancellationText: "Cancel",
            confirmationButtonProps: { autoFocus: true },
          }}
        >
          <SnackbarProvider maxSnack={3} preventDuplicate>
            <ErrorBoundary>
              <ReactFlowProvider>
                <App />
              </ReactFlowProvider>
            </ErrorBoundary>
          </SnackbarProvider>
        </ConfirmProvider>
      </ThemeProvider>
    </CacheBuster>
  );
}
