import { CssBaseline, type Theme, ThemeProvider, useMediaQuery } from "@mui/material";
import { ConfirmProvider } from "material-ui-confirm";
import { SnackbarProvider } from "notistack";
import type React from "react";
import { useMemo } from "react";
import defaultTheme from "@/theme.js";

export interface GraphProvidersProps extends React.PropsWithChildren {
  /** Force dark/light mode. Defaults to the OS `prefers-color-scheme`. */
  darkMode?: boolean;
  /** Provide a custom MUI theme. Overrides `darkMode`. */
  theme?: Theme;
}

/**
 * Bundles the providers the graph components expect from their host (MUI theme, plus the notistack
 * snackbars and confirm dialogs that `<GraphEditor>`'s editing/assistant features need).
 * `<GraphViewer>` needs only the theme. Embedding apps that already set these up don't need this.
 */
export const GraphProviders: React.FC<GraphProvidersProps> = ({
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
