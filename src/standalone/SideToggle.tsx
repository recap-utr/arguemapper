import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useArgueActions, useStore } from "../store.js";

/** Standalone-only control to dock the sidebar on the left or right (the lib uses the `side` prop). */
export const SideToggle: React.FC = () => {
  const side = useStore((state) => state.sidebarSide);
  const { setState } = useArgueActions();

  return (
    <FormControl fullWidth>
      <InputLabel>Sidebar Side</InputLabel>
      <Select
        value={side}
        label="Sidebar Side"
        onChange={(event) => {
          setState({ sidebarSide: event.target.value as "left" | "right" });
        }}
      >
        <MenuItem value="left">Left</MenuItem>
        <MenuItem value="right">Right</MenuItem>
      </Select>
    </FormControl>
  );
};
