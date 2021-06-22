import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import theme from "./theme";
import { useMediaQuery, ThemeProvider, CssBaseline } from "@material-ui/core";

ReactDOM.render(
  <React.StrictMode>
    <Layout />
  </React.StrictMode>,
  document.getElementById("root")
);

function Layout() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  return (
    <ThemeProvider theme={theme(prefersDarkMode)}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}
