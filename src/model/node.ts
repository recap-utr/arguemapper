import { JsonObject } from "@protobuf-ts/runtime";
import * as arguebuf from "arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "arg-services/google/protobuf/struct_pb";
import { startCase } from "lodash";
import { Node as FlowNode, NodeProps, XYPosition } from "reactflow";
import { v1 as uuid } from "uuid";
import * as date from "../services/date";
import * as aif from "./aif";
import * as meta from "./metadata";
import * as ref from "./reference";

const NO_SCHEME_LABEL = "Unknown Inference";

export type Node = FlowNode<NodeData>;
export type AtomNode = FlowNode<AtomData>;
export type SchemeNode = FlowNode<SchemeData>;

export enum Support {
  DEFAULT = "Default",
  POSITION_TO_KNOW = "Position to Know",
  EXPERT_OPINION = "Expert Opinion",
  WITNESS_TESTIMONY = "Witness Testimony",
  POPULAR_OPINION = "Popular Opinion",
  POPULAR_PRACTICE = "Popular Practice",
  EXAMPLE = "Example",
  ANALOGY = "Analogy",
  PRACTICAL_REASONING_FROM_ANALOGY = "Practical Resoning from Analogy",
  COMPOSITION = "Composition",
  DIVISION = "Division",
  OPPOSITIONS = "Oppositions",
  RHETORICAL_OPPOSITIONS = "Rhetorical Oppositions",
  ALTERNATIVES = "Alternatives",
  VERBAL_CLASSIFICATION = "Verbal Classification",
  VERBAL_CLASSIFICATION_DEFINITION = "Definition to Verbal Classification",
  VERBAL_CLASSIFICATION_VAGUENESS = "Vagueness of a Verbal Classification",
  VERBAL_CLASSIFICATION_ARBITRARINESS = "Arbitrariness of a Verbal Classification",
  INTERACTION_OF_ACT_AND_PERSON = "Interaction of Act and Person",
  VALUES = "Values",
  POSITIVE_VALUES = "Positive Values",
  NEGATIVE_VALUES = "Negative Values",
  SACRIFICE = "Sacrifice",
  THE_GROUP_AND_ITS_MEMBERS = "The Group and its Members",
  PRACTICAL_REASONING = "Practical Reasoning",
  TWO_PERSON_PRACTICAL_REASONING = "Two-Person Practical Reasoning",
  WASTE = "Waste",
  SUNK_COSTS = "Sunk Costs",
  IGNORANCE = "Ignorance",
  EPISTEMIC_IGNORANCE = "Epistemic Ignorance",
  CAUSE_TO_EFFECT = "Cause to Effect",
  CORRELATION_TO_CAUSE = "Correlation to Cause",
  SIGN = "Sign",
  ABDUCTIVE = "Abductive",
  EVIDENCE_TO_HYPOTHESIS = "Evidence to Hypothesis",
  CONSEQUENCES = "Consequences",
  POSITIVE_CONSEQUENCES = "Positive Consequences",
  NEGATIVE_CONSEQUENCES = "Negative Consequences",
  PRAGMATIC_ALTERNATIVES = "Pragmatic Alternatives",
  THREAT = "Threat",
  FEAR_APPEAL = "Fear Appeal",
  DANGER_APPEAL = "Danger Appeal",
  NEED_FOR_HELP = "Need for Help",
  DISTRESS = "Distress",
  COMMITMENT = "Commitment",
  ETHOTIC = "Ethotic",
  GENERIC_AD_HOMINEM = "Generic ad Hominem",
  PRAGMATIC_INCONSISTENCY = "Pragmatic Inconsistency",
  INCONSISTENT_COMMITMENT = "Inconsistent Commitment",
  CIRCUMSTANTIAL_AD_HOMINEM = "Circumstantial Ad Hominem",
  BIAS = "Bias",
  BIAS_AD_HOMINEM = "Bias Ad Hominem",
  GRADUALISM = "Gradualism",
  SLIPPERY_SLOPE = "Slippery Slope",
  PRECEDENT_SLIPPERY_SLOPE = "Precedent Slippery Slope",
  SORITES_SLIPPERY_SLOPE = "Sorites Slippery Slope",
  VERBAL_SLIPPERY_SLOPE = "Verbal Slippery Slope",
  FULL_SLIPPERY_SLOPE = "Full Slippery Slope",
  CONSTITUTIVE_RULE_CLAIMS = "Constitutive Rule Claims",
  RULES = "Rules",
  EXCEPTIONAL_CASE = "Exceptional Case",
  PRECEDENT = "Precedent",
  PLEA_FOR_EXCUSE = "Plea for Excuse",
  PERCEPTION = "Perception",
  MEMORY = "Memory",
  // AUTHORITY = "Authority",
  // DILEMMA = "Dilemma",
  // MODUS_PONENS = "Modus Ponens",
  // DEFINITION = "Definition",
}

export enum Attack {
  DEFAULT = "Default",
}

export enum Preference {
  DEFAULT = "Default",
}

export enum Rephrase {
  DEFAULT = "Default",
}

export enum SchemeType {
  SUPPORT = "support",
  ATTACK = "attack",
  REPHRASE = "rephrase",
  PREFERENCE = "preference",
}

export type Scheme =
  | { type: SchemeType.SUPPORT; value: Support }
  | { type: SchemeType.ATTACK; value: Attack }
  | { type: SchemeType.REPHRASE; value: Rephrase }
  | { type: SchemeType.PREFERENCE; value: Preference };

export type SchemeValue = Support | Attack | Rephrase | Preference;

export const schemeMap: {
  [key in SchemeType]:
    | typeof Support
    | typeof Attack
    | typeof Rephrase
    | typeof Preference;
} = {
  support: Support,
  attack: Attack,
  rephrase: Rephrase,
  preference: Preference,
};

const support2protobuf = Object.fromEntries(
  Object.entries(Support).map(([key, value]) => [
    value,
    arguebuf.Support[key as keyof typeof arguebuf.Support],
  ])
) as { [k in Support]: arguebuf.Support };

const protobuf2support = Object.fromEntries(
  Object.entries(support2protobuf).map(([key, value]) => [value, key])
) as { [k in arguebuf.Support]: Support };

const attack2protobuf = Object.fromEntries(
  Object.entries(Attack).map(([key, value]) => [
    value,
    arguebuf.Attack[key as keyof typeof arguebuf.Attack],
  ])
) as { [k in Attack]: arguebuf.Attack };

const protobuf2attack = Object.fromEntries(
  Object.entries(attack2protobuf).map(([key, value]) => [value, key])
) as { [k in arguebuf.Attack]: Attack };

const rephrase2protobuf = Object.fromEntries(
  Object.entries(Rephrase).map(([key, value]) => [
    value,
    arguebuf.Rephrase[key as keyof typeof arguebuf.Rephrase],
  ])
) as { [k in Rephrase]: arguebuf.Rephrase };

const protobuf2rephrase = Object.fromEntries(
  Object.entries(rephrase2protobuf).map(([key, value]) => [value, key])
) as { [k in arguebuf.Rephrase]: Rephrase };

const preference2protobuf = Object.fromEntries(
  Object.entries(Preference).map(([key, value]) => [
    value,
    arguebuf.Preference[key as keyof typeof arguebuf.Preference],
  ])
) as { [k in Preference]: arguebuf.Preference };

const protobuf2preference = Object.fromEntries(
  Object.entries(preference2protobuf).map(([key, value]) => [value, key])
) as { [k in arguebuf.Preference]: Preference };

const scheme2aif: { [key in SchemeType]: aif.SchemeType } = {
  support: "RA",
  attack: "CA",
  rephrase: "MA",
  preference: "PA",
};

const aif2scheme: { [key in aif.SchemeType]: SchemeType | undefined } = {
  RA: SchemeType.SUPPORT,
  CA: SchemeType.ATTACK,
  MA: SchemeType.REPHRASE,
  PA: SchemeType.PREFERENCE,
  "": undefined,
};

const text2support: { [k: string]: Support } = {
  Alternatives: Support.ALTERNATIVES,
  Analogy: Support.ANALOGY,
  "Arbitrary Verbal Classification": Support.VERBAL_CLASSIFICATION,
  "Argument From Authority": Support.DEFAULT,
  "Argument From Goodwill": Support.DEFAULT,
  "Argument From Moral Virtue": Support.DEFAULT,
  "Argument From Practical Wisdom": Support.DEFAULT,
  "Argument From Virtue/Goodwill": Support.DEFAULT,
  "Argument From Wisdom/Goodwill": Support.DEFAULT,
  "Argument From Wisdom/Virtue": Support.DEFAULT,
  "Argument From Wisdom/Virtue/Goodwill": Support.DEFAULT,
  Authority: Support.DEFAULT,
  Bias: Support.BIAS,
  "Causal Slippery Slope": Support.SLIPPERY_SLOPE,
  "Cause To Effect": Support.CAUSE_TO_EFFECT,
  "Circumstantial Ad Hominem": Support.CIRCUMSTANTIAL_AD_HOMINEM,
  Commitment: Support.COMMITMENT,
  Composition: Support.COMPOSITION,
  Consequences: Support.CONSEQUENCES,
  "Correlation To Cause": Support.CORRELATION_TO_CAUSE,
  "Danger Appeal": Support.DANGER_APPEAL,
  "Default Inference": Support.DEFAULT,
  Definitional: Support.DEFAULT,
  "Definition To Verbal Classification": Support.VERBAL_CLASSIFICATION,
  Dilemma: Support.DEFAULT,
  "Direct Ad Hominem": Support.GENERIC_AD_HOMINEM,
  Division: Support.DIVISION,
  "Efficient Cause": Support.DEFAULT,
  "Established Rule": Support.DEFAULT,
  Ethotic: Support.ETHOTIC,
  "Evidence To Hypothesis": Support.EVIDENCE_TO_HYPOTHESIS,
  Example: Support.EXAMPLE,
  "Exceptional Case": Support.EXCEPTIONAL_CASE,
  "Expert Opinion": Support.EXPERT_OPINION,
  "Falsification Of Hypothesis": Support.DEFAULT,
  "Fear Appeal": Support.FEAR_APPEAL,
  "Final Cause": Support.DEFAULT,
  "Formal Cause": Support.DEFAULT,
  "From-all-the-more-so-OR-all-the-less-so": Support.DEFAULT,
  "From-alternatives": Support.ALTERNATIVES,
  "From-analogy": Support.ANALOGY,
  "From-authority": Support.DEFAULT,
  "From-conjugates-OR-derivates": Support.DEFAULT,
  "From-correlates": Support.DEFAULT,
  "From-definition": Support.DEFAULT,
  "From-description": Support.DEFAULT,
  "From-efficient-cause": Support.DEFAULT,
  "From-final-OR-instrumental-cause": Support.DEFAULT,
  "From-formal-cause": Support.DEFAULT,
  "From-genus-and-species": Support.DEFAULT,
  "From-material-cause": Support.DEFAULT,
  "From-ontological-implications": Support.DEFAULT,
  "From-opposition": Support.OPPOSITIONS,
  "From-parts-and-whole": Support.DIVISION,
  "From-place": Support.DEFAULT,
  "From-promising-and-warning": Support.DEFAULT,
  "From-termination-and-inception": Support.DEFAULT,
  "From-time": Support.DEFAULT,
  "Full Slippery Slope": Support.FULL_SLIPPERY_SLOPE,
  "Generic Ad Hominem": Support.GENERIC_AD_HOMINEM,
  Gradualism: Support.GRADUALISM,
  Ignorance: Support.IGNORANCE,
  "Inconsistent Commitment": Support.INCONSISTENT_COMMITMENT,
  "Informant Report": Support.DEFAULT,
  "Interaction Of Act And Person": Support.INTERACTION_OF_ACT_AND_PERSON,
  "Material Cause": Support.DEFAULT,
  Mereological: Support.DEFAULT,
  "Modus Ponens": Support.DEFAULT,
  "Need For Help": Support.NEED_FOR_HELP,
  "Negative Consequences": Support.NEGATIVE_CONSEQUENCES,
  Opposition: Support.OPPOSITIONS,
  Paraphrase: Support.DEFAULT,
  Perception: Support.PERCEPTION,
  "Popular Opinion": Support.POPULAR_OPINION,
  "Popular Practice": Support.POPULAR_PRACTICE,
  "Position To Know": Support.POSITION_TO_KNOW,
  "Positive Consequences": Support.POSITIVE_CONSEQUENCES,
  "Practical Evaluation": Support.DEFAULT,
  "Practical Reasoning": Support.PRACTICAL_REASONING,
  "Practical Reasoning From Analogy": Support.PRACTICAL_REASONING_FROM_ANALOGY,
  "Pragmatic Argument From Alternatives": Support.PRAGMATIC_ALTERNATIVES,
  "Pragmatic Inconsistency": Support.PRAGMATIC_INCONSISTENCY,
  "Precedent Slippery Slope": Support.PRECEDENT_SLIPPERY_SLOPE,
  Reframing: Support.DEFAULT,
  Rules: Support.RULES,
  Sign: Support.SIGN,
  "Two Person Practical Reasoning": Support.TWO_PERSON_PRACTICAL_REASONING,
  "Vagueness Of Verbal Classification": Support.VERBAL_CLASSIFICATION,
  "Vague Verbal Classification": Support.VERBAL_CLASSIFICATION,
  "Value Based Practical Reasoning": Support.PRACTICAL_REASONING,
  Values: Support.VALUES,
  "Verbal Classification": Support.VERBAL_CLASSIFICATION,
  "Verbal Slippery Slope": Support.VERBAL_SLIPPERY_SLOPE,
  Waste: Support.WASTE,
  "Witness Testimony": Support.WITNESS_TESTIMONY,
};

const text2attack: { [k: string]: Attack } = {};
const text2rephrase: { [k: string]: Rephrase } = {};
const text2preference: { [k: string]: Preference } = {};

export interface NodeData {
  metadata: meta.Metadata;
  userdata: JsonObject;
  clickConnect?: boolean | undefined;
}

export interface AtomData extends NodeData {
  text: string;
  reference?: ref.Reference;
  participant?: string;
}

export interface AtomProps {
  id?: string;
  metadata?: meta.Metadata;
  userdata?: JsonObject;
  text: string;
  reference?: ref.Reference;
  participant?: string;
  position?: XYPosition;
}

export function initAtom({
  text,
  id,
  reference,
  participant,
  metadata,
  userdata,
  position,
}: AtomProps): AtomNode {
  return {
    id: id ?? uuid(),
    type: "atom",
    data: {
      metadata: metadata ?? meta.init({}),
      userdata: userdata ?? {},
      text,
      reference,
      participant,
    },
    position: position ?? { x: 0, y: 0 },
  };
}

export interface SchemeData extends NodeData {
  scheme?: Scheme;
  premiseDescriptors: Array<string>;
}

export interface SchemeProps {
  id?: string;
  metadata?: meta.Metadata;
  userdata?: JsonObject;
  scheme?: Scheme;
  premiseDescriptors?: Array<string>;
  position?: XYPosition;
}

export function initScheme({
  id,
  metadata,
  userdata,
  scheme,
  premiseDescriptors,
  position,
}: SchemeProps): SchemeNode {
  return {
    id: id ?? uuid(),
    type: "scheme",
    data: {
      metadata: metadata ?? meta.init({}),
      userdata: userdata ?? {},
      scheme,
      premiseDescriptors: premiseDescriptors ?? [],
    },
    position: position ?? { x: 0, y: 0 },
  };
}

export function isAtom(node: Node | NodeProps<NodeData>): node is AtomNode {
  return node.type === "atom";
}

export function isScheme(node: Node | NodeProps<NodeData>): node is SchemeNode {
  return node.type === "scheme";
}

export function label(node: Node | NodeProps<NodeData>): string {
  if (isAtom(node)) {
    return node.data.text;
  } else if (isScheme(node) && node.data.scheme) {
    if (node.data.scheme.value !== schemeMap[node.data.scheme.type].DEFAULT) {
      return node.data.scheme.value;
    }

    return startCase(node.data.scheme.type);
  }

  return NO_SCHEME_LABEL;
}

export function toProtobuf(node: Node): arguebuf.Node {
  const userdata: JsonObject = {
    ...node.data.userdata,
    arguebuf: {
      position: { ...node.position },
    },
  };

  if (isAtom(node)) {
    return {
      metadata: meta.toProtobuf(node.data.metadata),
      userdata: Struct.fromJson(userdata),
      type: {
        oneofKind: "atom",
        atom: arguebuf.Atom.create({
          text: node.data.text,
          participant: node.data.participant,
          reference: node.data.reference
            ? ref.toProtobuf(node.data.reference)
            : undefined,
        }),
      },
    };
  } else if (isScheme(node)) {
    const type = node.data.scheme?.type;
    let scheme: arguebuf.Scheme["type"] = { oneofKind: undefined };

    if (node.data.scheme) {
      switch (type) {
        case SchemeType.SUPPORT: {
          scheme = {
            oneofKind: type,
            support: support2protobuf[node.data.scheme?.value],
          };
          break;
        }
        case SchemeType.ATTACK: {
          scheme = {
            oneofKind: type,
            attack: attack2protobuf[node.data.scheme?.value],
          };
          break;
        }
        case SchemeType.REPHRASE: {
          scheme = {
            oneofKind: type,
            rephrase: rephrase2protobuf[node.data.scheme?.value],
          };
          break;
        }
        case SchemeType.PREFERENCE: {
          scheme = {
            oneofKind: type,
            preference: preference2protobuf[node.data.scheme?.value],
          };
          break;
        }
      }
    }

    return {
      metadata: meta.toProtobuf(node.data.metadata),
      userdata: Struct.fromJson(userdata),
      type: {
        oneofKind: "scheme",
        scheme: arguebuf.Scheme.create({
          premiseDescriptors: node.data.premiseDescriptors,
          type: scheme,
        }),
      },
    };
  }

  throw new Error("Node type not supported.");
}

export function toAif(node: Node): aif.Node {
  if (isAtom(node)) {
    return {
      nodeID: node.id,
      text: node.data.text,
      type: "I",
      timestamp: date.format(node.data.metadata.updated, aif.DATE_FORMAT),
    };
  } else if (isScheme(node)) {
    return {
      nodeID: node.id,
      text: node.data.scheme ? node.data.scheme.value : NO_SCHEME_LABEL,
      type: node.data.scheme ? scheme2aif[node.data.scheme.type] : "",
      timestamp: date.format(node.data.metadata.updated, aif.DATE_FORMAT),
    };
  }

  throw new Error("Node type not supported");
}

export function fromAif(obj: aif.Node): Node | undefined {
  const timestamp = date.parse(obj.timestamp, aif.DATE_FORMAT);
  const metadata: meta.Metadata = { created: timestamp, updated: timestamp };

  if (obj.type === "I") {
    const node: AtomNode = {
      id: obj.nodeID,
      type: "atom",
      data: {
        userdata: {},
        metadata,
        text: obj.text,
      },
      position: { x: 0, y: 0 },
    };

    return node;
  } else if (obj.type in aif2scheme) {
    const aifType = obj.type as aif.SchemeType;
    const aifScheme: string = obj.scheme ?? obj.text;
    const type = aif2scheme[aifType];
    let scheme: Scheme | undefined = undefined;

    if (type) {
      switch (type) {
        case "support": {
          scheme = { type, value: text2support[aifScheme] ?? Support.DEFAULT };
          break;
        }
        case "attack": {
          scheme = { type, value: text2attack[aifScheme] ?? Attack.DEFAULT };
          break;
        }
        case "rephrase": {
          scheme = {
            type,
            value: text2rephrase[aifScheme] ?? Rephrase.DEFAULT,
          };
          break;
        }
        case "preference": {
          scheme = {
            type,
            value: text2preference[aifScheme] ?? Preference.DEFAULT,
          };
          break;
        }
      }
    }

    const node: SchemeNode = {
      id: obj.nodeID,
      type: "scheme",
      data: {
        userdata: {},
        metadata,
        scheme,
        premiseDescriptors: [],
      },
      position: { x: 0, y: 0 },
    };

    return node;
  }

  return undefined;
}

export function fromProtobuf(id: string, obj: arguebuf.Node): Node {
  const metadata = obj.metadata
    ? meta.fromProtobuf(obj.metadata)
    : meta.init({});
  const userdata = obj.userdata
    ? (Struct.toJson(obj.userdata) as JsonObject)
    : {};
  const position = ((userdata.arguebuf as JsonObject | undefined)?.position as
    | XYPosition
    | undefined) ?? { x: 0, y: 0 };

  if (obj.type.oneofKind === "atom") {
    const node: AtomNode = {
      id,
      type: "atom",
      data: {
        metadata,
        userdata,
        text: obj.type.atom.text,
        participant: obj.type.atom.participant,
        reference: obj.type.atom.reference
          ? ref.fromProtobuf(obj.type.atom.reference)
          : undefined,
      },
      position,
    };

    return node;
  } else if (obj.type.oneofKind === "scheme") {
    const type = obj.type.scheme.type.oneofKind;
    let scheme: Scheme | undefined = undefined;

    switch (type) {
      case "support": {
        scheme = {
          type: SchemeType.SUPPORT,
          value: protobuf2support[obj.type.scheme.type.support],
        };
        break;
      }
      case "attack": {
        scheme = {
          type: SchemeType.ATTACK,
          value: protobuf2attack[obj.type.scheme.type.attack],
        };
        break;
      }
      case "rephrase": {
        scheme = {
          type: SchemeType.REPHRASE,
          value: protobuf2rephrase[obj.type.scheme.type.rephrase],
        };
        break;
      }
      case "preference": {
        scheme = {
          type: SchemeType.PREFERENCE,
          value: protobuf2preference[obj.type.scheme.type.preference],
        };
        break;
      }
    }

    const node: SchemeNode = {
      id,
      type: "scheme",
      data: {
        metadata,
        userdata,
        scheme,
        premiseDescriptors: obj.type.scheme.premiseDescriptors,
      },
      position,
    };

    return node;
  }

  // TODO: Handle this error at some point!
  throw new Error("Node is neither Atom nor Scheme.");
}
