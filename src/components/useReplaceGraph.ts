import * as arguebuf from "arguebuf";
import { useConfirm } from "material-ui-confirm";
import { enqueueSnackbar } from "notistack";
import { useCallback } from "react";
import * as model from "@/model.js";
import * as convert from "@/services/convert.js";
import { useArgueActions } from "@/store.js";

/**
 * Replace the graph (an empty one by default), confirming it if the current one has content.
 * Graphs given as JSON are loaded first, their repairs are shown to the user.
 */
export function useReplaceGraph(): (graph?: model.Graph | arguebuf.load.JsonGraph) => void {
  const confirm = useConfirm();
  const { getState, resetState } = useArgueActions();

  return useCallback(
    (source) => {
      const issues: arguebuf.Issue[] = [];
      const graph =
        source === undefined || source instanceof arguebuf.Graph
          ? source
          : convert.importGraph(source, (issue) => issues.push(issue));
      const replace = () => {
        resetState(graph);

        if (issues.length > 0) {
          enqueueSnackbar(
            `The graph was repaired while loading it: ${issues.map(model.describeIssue).join(" ")}`,
            { variant: "warning" },
          );
        }
      };
      const { nodes, resources } = getState().graph;

      if (Object.keys(nodes).length === 0 && Object.keys(resources).length === 0) {
        replace();

        return;
      }

      void confirm({
        title: "Replace the current graph?",
        description: "You can undo this afterwards.",
        confirmationText: "Replace",
      }).then(({ confirmed }) => {
        if (confirmed) replace();
      });
    },
    [confirm, getState, resetState],
  );
}
