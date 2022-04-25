declare module "cytoscape-elk" {
  import cy from "cytoscape";
  const elk: cy.Ext;

  export interface ElkLayoutOptions extends cy.BaseLayoutOptions {
    nodeDimensionsIncludeLabels?: boolean;
    fit?: boolean;
    padding?: number;
    animate?: boolean;
    animateFilter?: (node: cy.NodeSingular, i: number) => boolean;
    animationDuration?: number;
    animationEasing?: number;
    transform?: (node: cy.NodeSingular, pos: cy.Position) => cy.Position;
    ready?: () => void;
    stop?: () => void;
    elk?: { [key: string]: any };
    priority?: (edge: cy.EdgeSingular) => null | number;
  }

  export default elk;
}
declare module "cytoscape-navigator" {
  import cy from "cytoscape";
  const nav: cy.Ext;
  export default nav;
}
