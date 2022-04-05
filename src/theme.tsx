import { createTheme } from "@mui/material/styles";

// A custom theme for this app
const theme = (prefersDarkMode: boolean) =>
  createTheme({
    palette: {
      mode: prefersDarkMode ? "dark" : "light",
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
  });

export default theme;
