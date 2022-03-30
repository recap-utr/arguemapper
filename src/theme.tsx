import { createTheme } from "@mui/material/styles";

// A custom theme for this app
const theme = (prefersDarkMode: boolean) =>
  createTheme({
    palette: {
      mode: prefersDarkMode ? "dark" : "light",
      primary: {
        main: "#556cd6",
      },
      secondary: {
        main: "#19857b",
      },
      error: {
        main: "#FF0000",
      },
      success: {
        main: "#00FF00",
      },
      info: {
        main: "#0000FF",
      },
      warning: {
        main: "#FFFF00",
      },
    },
  });

export default theme;
