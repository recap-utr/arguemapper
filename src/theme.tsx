import { createTheme, type Theme } from "@mui/material/styles";

// A custom theme for this app
const buildTheme = (mode: "dark" | "light") =>
  createTheme({
    palette: {
      mode,
      // primary: {
      //   main: color.blue[500],
      // },
      // secondary: {
      //   main: color.teal[500],
      // },
      // error: {
      //   main: color.red[500],
      // },
      // success: {
      //   main: color.green[500],
      // },
      // info: {
      //   main: color.blue[500],
      // },
      // warning: {
      //   main: color.yellow[500],
      // },
    },
    components: {
      MuiListSubheader: {
        styleOverrides: {
          // sticky headers take on the elevation tint of the surface they are on, e.g. a menu
          sticky: { backgroundImage: "var(--Paper-overlay)" },
        },
      },
    },
  });

const themes = { dark: buildTheme("dark"), light: buildTheme("light") };

const theme = (prefersDarkMode: boolean): Theme => themes[prefersDarkMode ? "dark" : "light"];

export default theme;
