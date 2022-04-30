import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "arg-services/google/protobuf/struct_pb";
import { startCase } from "lodash";
import { v1 as uuid } from "uuid";
import * as date from "../services/date";
import * as aif from "./aif";
import * as meta from "./metadata";
import * as ref from "./reference";

const NO_SCHEME_LABEL = "Unknown";

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

export interface Node {
  id: string;
  type: "atom" | "scheme";
  metadata: meta.Metadata;
  userdata: JsonValue;
}

export interface AtomNode extends Node {
  type: "atom";
  text: string;
  reference?: ref.Reference;
  participant?: string;
}

export interface AtomProps {
  id?: string;
  metadata?: meta.Metadata;
  userdata?: JsonValue;
  text: string;
  reference?: ref.Reference;
  participant?: string;
}

export function initAtom({
  text,
  id,
  reference,
  participant,
  metadata,
  userdata,
}: AtomProps): AtomNode {
  return {
    id: id ?? uuid(),
    type: "atom",
    metadata: metadata ?? meta.init({}),
    userdata: userdata ?? {},
    text,
    reference,
    participant,
  };
}

export interface SchemeNode extends Node {
  scheme?: Scheme;
  premiseDescriptors: Array<string>;
}

export interface SchemeProps {
  id?: string;
  metadata?: meta.Metadata;
  userdata?: JsonValue;
  scheme?: Scheme;
  premiseDescriptors?: Array<string>;
}

export function initScheme({
  id,
  metadata,
  userdata,
  scheme,
  premiseDescriptors,
}: SchemeProps): SchemeNode {
  return {
    id: id ?? uuid(),
    type: "scheme",
    metadata: metadata ?? meta.init({}),
    userdata: userdata ?? {},
    scheme,
    premiseDescriptors: premiseDescriptors ?? [],
  };
}

export function isAtom(data: Node): data is AtomNode {
  return data.type === "atom";
}

export function isScheme(data: Node): data is SchemeNode {
  return data.type === "scheme";
}

export function label(data: Node): string {
  if (isAtom(data)) {
    return data.text;
  } else if (isScheme(data) && data.scheme) {
    if (data.scheme.value !== schemeMap[data.scheme.type].DEFAULT) {
      return data.scheme.value;
    }

    return startCase(data.scheme.type);
  }

  return NO_SCHEME_LABEL;
}

export function toProtobuf(data: Node): arguebuf.Node {
  if (isAtom(data)) {
    return {
      metadata: meta.toProtobuf(data.metadata),
      userdata: Struct.fromJson(data.userdata),
      node: {
        oneofKind: "atom",
        atom: arguebuf.Atom.create({
          text: data.text,
          participant: data.participant,
          reference: data.reference
            ? ref.toProtobuf(data.reference)
            : undefined,
        }),
      },
    };
  } else if (isScheme(data)) {
    const type = data.scheme?.type;
    let scheme: arguebuf.Scheme["scheme"] = { oneofKind: undefined };

    if (data.scheme) {
      switch (type) {
        case SchemeType.SUPPORT: {
          scheme = {
            oneofKind: type,
            support: support2protobuf[data.scheme?.value],
          };
          break;
        }
        case SchemeType.ATTACK: {
          scheme = {
            oneofKind: type,
            attack: attack2protobuf[data.scheme?.value],
          };
          break;
        }
        case SchemeType.REPHRASE: {
          scheme = {
            oneofKind: type,
            rephrase: rephrase2protobuf[data.scheme?.value],
          };
          break;
        }
        case SchemeType.PREFERENCE: {
          scheme = {
            oneofKind: type,
            preference: preference2protobuf[data.scheme?.value],
          };
          break;
        }
      }
    }

    return {
      metadata: meta.toProtobuf(data.metadata),
      userdata: Struct.fromJson(data.userdata),
      node: {
        oneofKind: "scheme",
        scheme: arguebuf.Scheme.create({
          premiseDescriptors: data.premiseDescriptors,
          scheme,
        }),
      },
    };
  }

  throw new Error("Node type not supported.");
}

export function toAif(data: Node): aif.Node {
  if (isAtom(data)) {
    return {
      nodeID: data.id,
      text: data.text,
      type: "I",
      timestamp: date.format(data.metadata.updated, aif.DATE_FORMAT),
    };
  } else if (isScheme(data)) {
    return {
      nodeID: data.id,
      text: data.scheme ? data.scheme.value : NO_SCHEME_LABEL,
      type: data.scheme ? scheme2aif[data.scheme.type] : "",
      timestamp: date.format(data.metadata.updated, aif.DATE_FORMAT),
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
      userdata: {},
      metadata,
      type: "atom",
      text: obj.text,
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
      userdata: {},
      metadata,
      type: "scheme",
      scheme,
      premiseDescriptors: [],
    };

    return node;
  }

  return undefined;
}

export function fromProtobuf(id: string, obj: arguebuf.Node): Node {
  if (obj.node.oneofKind === "atom") {
    const node: AtomNode = {
      id,
      metadata: obj.metadata ? meta.fromProtobuf(obj.metadata) : meta.init({}),
      userdata: obj.userdata ? Struct.toJson(obj.userdata) : {},
      type: "atom",
      text: obj.node.atom.text,
      participant: obj.node.atom.participant,
      reference: obj.node.atom.reference
        ? ref.fromProtobuf(obj.node.atom.reference)
        : undefined,
    };

    return node;
  } else if (obj.node.oneofKind === "scheme") {
    const type = obj.node.scheme.scheme.oneofKind;
    let scheme: Scheme | undefined = undefined;

    switch (type) {
      case "support": {
        scheme = {
          type: SchemeType.SUPPORT,
          value: protobuf2support[obj.node.scheme.scheme.support],
        };
        break;
      }
      case "attack": {
        scheme = {
          type: SchemeType.ATTACK,
          value: protobuf2attack[obj.node.scheme.scheme.attack],
        };
        break;
      }
      case "rephrase": {
        scheme = {
          type: SchemeType.REPHRASE,
          value: protobuf2rephrase[obj.node.scheme.scheme.rephrase],
        };
        break;
      }
      case "preference": {
        scheme = {
          type: SchemeType.PREFERENCE,
          value: protobuf2preference[obj.node.scheme.scheme.preference],
        };
        break;
      }
    }

    const node: SchemeNode = {
      id,
      metadata: obj.metadata ? meta.fromProtobuf(obj.metadata) : meta.init({}),
      userdata: obj.userdata ? Struct.toJson(obj.userdata) : {},
      type: "scheme",
      scheme,
      premiseDescriptors: obj.node.scheme.premiseDescriptors,
    };

    return node;
  }

  // TODO: Handle this error at some point!
  throw new Error("Node is neither Atom nor Scheme.");
}
