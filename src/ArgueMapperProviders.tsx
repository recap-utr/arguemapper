import { CssBaseline, type Theme, ThemeProvider, useMediaQuery } from "@mui/material";
import { ConfirmProvider } from "material-ui-confirm";
import { SnackbarProvider } from "notistack";
import type React from "react";
import { useMemo } from "react";
import defaultTheme from "./theme.js";

export interface ArgueMapperProvidersProps extends React.PropsWithChildren {
  /** Force dark/light mode. Defaults to the OS `prefers-color-scheme`. */
  darkMode?: boolean;
  /** Provide a custom MUI theme. Overrides `darkMode`. */
  theme?: Theme;
}

/**
 * Bundles the providers `<ArgueMapper>` expects from its host (MUI theme, notistack snackbars,
 * confirm dialogs). Embedding apps that already set these up don't need this wrapper.
 */
export const ArgueMapperProviders: React.FC<ArgueMapperProvidersProps> = ({
  darkMode,
  theme,
  children,
}) => {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const resolvedTheme = useMemo(
    () => theme ?? defaultTheme(darkMode ?? prefersDark),
    [theme, darkMode, prefersDark],
  );

  return (
    <ThemeProvider theme={resolvedTheme}>
      <CssBaseline />
      <ConfirmProvider
        defaultOptions={{
          title: "Are you sure?",
          description: "This action is destructive and cannot be undone!",
          confirmationText: "OK",
          cancellationText: "Cancel",
          confirmationButtonProps: { autoFocus: true },
        }}
      >
        <SnackbarProvider maxSnack={3} preventDuplicate>
          {children}
        </SnackbarProvider>
      </ConfirmProvider>
    </ThemeProvider>
  );
};
