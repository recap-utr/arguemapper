import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { CssBaseline, ThemeProvider } from "@material-ui/core";
import React from "react";
import ReactDOM from "react-dom";
import { useMedia } from "react-use";
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
  // const query = window.matchMedia("(prefers-color-scheme: dark)");
  // const [darkMode, setDarkMode] = useState(query.matches);
  // query.addEventListener("change", (e) => setDarkMode(e.matches));

  const darkMode = useMedia("(prefers-color-scheme: dark)");
  document.title = config.name;

  return (
    <ThemeProvider theme={theme(darkMode)}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}
