import { Stack, tabClasses, Tabs } from "@mui/material";
import type React from "react";

interface TabBarProps extends React.PropsWithChildren {
  /** Accessible name of the tabs. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Buttons right of the tabs. */
  actions?: React.ReactNode;
}

/** Row of compact scrollable tabs with actions on its right, e.g. of the graphs or the texts. */
export const TabBar: React.FC<TabBarProps> = ({ label, value, onChange, actions, children }) => (
  <Stack
    direction="row"
    sx={{ alignItems: "center", pr: 0.5, borderBottom: 1, borderColor: "divider" }}
  >
    <Tabs
      aria-label={label}
      value={value}
      onChange={(_event, next: string) => onChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        flexGrow: 1,
        minHeight: 40,
        [`& .${tabClasses.root}`]: { minHeight: 40, textTransform: "none" },
      }}
    >
      {children}
    </Tabs>
    {actions}
  </Stack>
);
