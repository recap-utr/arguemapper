import {
  CssBaseline,
  ScopedCssBaseline,
  StyledEngineProvider,
  type Theme,
  ThemeProvider,
  useMediaQuery,
} from "@mui/material";
import { ConfirmProvider } from "material-ui-confirm";
import { SnackbarProvider } from "notistack";
import type React from "react";
import defaultTheme from "@/theme.js";

export interface GraphProvidersProps extends React.PropsWithChildren {
  /** Force dark/light mode. Defaults to the OS `prefers-color-scheme`. */
  darkMode?: boolean;
  /** Provide a custom MUI theme. Overrides `darkMode`. */
  theme?: Theme;
  /**
   * Which MUI CSS reset to apply. Defaults to `"global"`. Use `"scoped"` to reset only this
   * subtree when the host page has its own reset (Tailwind's preflight, for example).
   */
  cssBaseline?: "global" | "scoped" | false;
  /**
   * Emit every MUI rule into an `@layer mui` cascade layer. Defaults to `false`. Needed for hosts
   * whose own styles live in layers, since unlayered CSS always wins. The host declares the layer
   * order, e.g. `@layer mui;` before importing its framework.
   */
  cssLayer?: boolean;
  /** Applied to the `"scoped"` baseline element, which is the only mode that renders one. */
  className?: string;
  /** Applied to the `"scoped"` baseline element, which is the only mode that renders one. */
  style?: React.CSSProperties;
}

/**
 * Bundles the providers the graph components expect from their host (MUI theme, plus the notistack
 * snackbars and confirm dialogs that `<GraphEditor>`'s editing/assistant features need).
 * `<GraphViewer>` needs only the theme. Embedding apps that already set these up don't need this.
 */
export const GraphProviders: React.FC<GraphProvidersProps> = ({
  darkMode,
  theme,
  cssBaseline = "global",
  cssLayer = false,
  className,
  style,
  children,
}) => {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const resolvedTheme = theme ?? defaultTheme(darkMode ?? prefersDark);

  const providers = (
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
  );

  return (
    <StyledEngineProvider enableCssLayer={cssLayer}>
      <ThemeProvider theme={resolvedTheme}>
        {cssBaseline === "global" && <CssBaseline />}
        {cssBaseline === "scoped" ? (
          <ScopedCssBaseline
            className={className}
            style={{ width: "100%", height: "100%", ...style }}
          >
            {providers}
          </ScopedCssBaseline>
        ) : (
          providers
        )}
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
