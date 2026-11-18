// arguebuf relies on the global Temporal, which some browsers such as Safari lack.
import "temporal-polyfill/global";
import "@fontsource-variable/roboto";
import { CssBaseline, createTheme, ThemeProvider } from "@mui/material";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App.js";
import { ErrorBoundary } from "react-error-boundary";
import { Recovery } from "@/standalone/Recovery.js";

// follows the light or dark mode of the OS
const theme = createTheme({
  colorSchemes: { dark: true },
  typography: { fontFamily: '"Roboto Variable", "Helvetica", "Arial", sans-serif' },
});

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);
root.render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary FallbackComponent={Recovery}>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);
