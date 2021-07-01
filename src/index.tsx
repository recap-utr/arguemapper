import { CssBaseline, ThemeProvider } from "@material-ui/core";
import React, { useState } from "react";
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
  // https://stackoverflow.com/a/58936230
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const [darkMode, setDarkMode] = useState(query.matches);
  query.addEventListener("change", (e) => setDarkMode(e.matches));

  // The following line causes the view to render in light mode initially and
  // immediately rerender in dark mode, leading to performance problems
  // const darkMode = useMediaQuery("(prefers-color-scheme: dark)");
  document.title = config.name;

  return (
    <ThemeProvider theme={theme(darkMode)}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}
