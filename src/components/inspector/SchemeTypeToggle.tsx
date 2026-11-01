import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import * as arguebuf from "arguebuf";
import type React from "react";
import * as model from "@/model.js";
import { useArgueActions, useArgueConfig, useStore } from "@/store.js";

interface Props {
  /** The scheme nodes to change together. */
  ids: readonly string[];
  types?: readonly arguebuf.SchemeType[];
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
}

/** Buttons to choose the type of relation, colored like the canvas renders them. */
export const SchemeTypeToggle: React.FC<Props> = ({
  ids,
  types = arguebuf.schemeTypes,
  size,
  fullWidth,
}) => {
  // the type of all nodes if they share it, null otherwise
  const current = useStore(
    ({ graph }) =>
      model.shared(
        ids.map((id) => {
          const node = graph.nodes[id];
          return node?.type === "scheme" ? node.scheme.case : undefined;
        }),
      ) ?? null,
  );
  const { readOnly } = useArgueConfig();
  const { editGraph } = useArgueActions();

  return (
    <ToggleButtonGroup
      exclusive
      value={current}
      size={size}
      fullWidth={fullWidth}
      disabled={readOnly}
      aria-label="Relation type"
      onChange={(_event, value: arguebuf.SchemeType | null) => {
        // choosing the current type again keeps it together with its scheme
        if (value !== null) {
          editGraph((graph) =>
            model.updateSchemes(graph, ids, () => ({ scheme: arguebuf.defaultScheme(value) })),
          );
        }
      }}
    >
      {types.map((type) => {
        const { bg, fg } = arguebuf.schemeColors[type];

        return (
          <ToggleButton
            key={type}
            value={type}
            sx={{ "&.Mui-selected, &.Mui-selected:hover": { bgcolor: bg, color: fg } }}
          >
            {arguebuf.schemeTypeLabels[type]}
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );
};
