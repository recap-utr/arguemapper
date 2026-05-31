import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import { GraphProviders } from "./GraphProviders.js";
import ErrorBoundary from "./components/ErrorBoundary.js";
import "./style.css";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <GraphProviders>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </GraphProviders>
  </React.StrictMode>,
);
