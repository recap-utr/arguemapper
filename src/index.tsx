import { CssBaseline, ThemeProvider, useMediaQuery } from "@material-ui/core";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import config from "./config";
import theme from "./theme";

ReactDOM.render(
  <React.StrictMode>
    <Layout />
  </React.StrictMode>,
  document.getElementById("root")
);

function Layout() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  document.title = config.name;

  return (
    <ThemeProvider theme={theme(prefersDarkMode)}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}
