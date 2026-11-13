import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { CssBaseline, createTheme, ThemeProvider } from "@mui/material";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "@/App.js";
import { ErrorBoundary } from "react-error-boundary";
import { Recovery } from "@/standalone/Recovery.js";

// follows the light or dark mode of the OS
const theme = createTheme({ colorSchemes: { dark: true } });

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary FallbackComponent={Recovery}>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>,
);
