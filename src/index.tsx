import "temporal-polyfill/global";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "@/App.js";
import { GraphProviders } from "@/GraphProviders.js";
import { ErrorBoundary } from "react-error-boundary";
import { Recovery } from "@/standalone/Recovery.js";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <GraphProviders>
      <ErrorBoundary FallbackComponent={Recovery}>
        <App />
      </ErrorBoundary>
    </GraphProviders>
  </React.StrictMode>,
);
