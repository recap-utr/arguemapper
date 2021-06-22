import { createTheme } from "@material-ui/core/styles";

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
    },
  });

export default theme;
