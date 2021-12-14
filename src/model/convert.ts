import { graphModel as pb } from "arg-services";
import { SchemeType as ProtoSchemeType } from "arg-services/arg_services/graph/v1/graph_pb";
import { invert } from "lodash";
import * as cytoModel from "./cytoModel";

export const schemeType2Proto: {
  [key in cytoModel.node.SchemeType]: ProtoSchemeType;
} = {
  Support: ProtoSchemeType.SCHEME_TYPE_SUPPORT,
  Attack: ProtoSchemeType.SCHEME_TYPE_ATTACK,
  Rephrase: ProtoSchemeType.SCHEME_TYPE_REPHRASE,
  Transition: ProtoSchemeType.SCHEME_TYPE_TRANSITION,
  Preference: ProtoSchemeType.SCHEME_TYPE_PREFERENCE,
  Assertion: ProtoSchemeType.SCHEME_TYPE_ASSERTION,
};

export const proto2schemeType: {
  [key in ProtoSchemeType]?: cytoModel.node.SchemeType;
} = invert(schemeType2Proto);

export function cyto2protobuf(cyto: cytoModel.CytoGraph): pb.Graph {
  const proto = new pb.Graph();

  for (const [key, cytoResource] of Object.entries(cyto.data.resources)) {
    const protoResource = new pb.Resource();
    protoResource.setMetadata(cytoResource.metadata);
    protoResource.setText(cytoResource.text);

    proto.getResourcesMap[key] = protoResource;
  }

  return proto;
}
