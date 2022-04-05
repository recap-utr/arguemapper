import { JsonValue } from "@protobuf-ts/runtime";
import * as arguebuf from "@recap-utr/arg-services/arg_services/graph/v1/graph_pb";
import { Struct } from "@recap-utr/arg-services/google/protobuf/struct_pb";
import { v1 as uuid } from "uuid";
import * as date from "../services/date";
import * as aif from "./aif";
import {
  fromProtobuf as referenceFromProtobuf,
  Reference,
  toProtobuf as referenceToProtobuf,
} from "./reference";

export enum SchemeType {
  SUPPORT = "Support",
  ATTACK = "Attack",
  REPHRASE = "Rephrase",
  TRANSITION = "Transition",
  PREFERENCE = "Preference",
  ASSERTION = "Assertion",
}

const schemeType2Proto: {
  [key in SchemeType]: arguebuf.SchemeType;
} = {
  [SchemeType.SUPPORT]: arguebuf.SchemeType.SUPPORT,
  [SchemeType.ATTACK]: arguebuf.SchemeType.ATTACK,
  [SchemeType.REPHRASE]: arguebuf.SchemeType.REPHRASE,
  [SchemeType.TRANSITION]: arguebuf.SchemeType.TRANSITION,
  [SchemeType.PREFERENCE]: arguebuf.SchemeType.PREFERENCE,
  [SchemeType.ASSERTION]: arguebuf.SchemeType.ASSERTION,
};

const proto2schemeType: {
  [key in arguebuf.SchemeType]: SchemeType | undefined;
} = {
  [arguebuf.SchemeType.UNSPECIFIED]: undefined,
  [arguebuf.SchemeType.SUPPORT]: SchemeType.SUPPORT,
  [arguebuf.SchemeType.ATTACK]: SchemeType.ATTACK,
  [arguebuf.SchemeType.REPHRASE]: SchemeType.REPHRASE,
  [arguebuf.SchemeType.TRANSITION]: SchemeType.TRANSITION,
  [arguebuf.SchemeType.PREFERENCE]: SchemeType.PREFERENCE,
  [arguebuf.SchemeType.ASSERTION]: SchemeType.ASSERTION,
};

const schemeType2aif: { [key in SchemeType]: aif.SchemeType } = {
  Support: "RA",
  Attack: "CA",
  Rephrase: "MA",
  Transition: "TA",
  Preference: "PA",
  Assertion: "YA",
};

const aif2schemeType: {
  [key in aif.SchemeType]: SchemeType;
} = {
  RA: SchemeType.SUPPORT,
  CA: SchemeType.ATTACK,
  MA: SchemeType.REPHRASE,
  TA: SchemeType.TRANSITION,
  PA: SchemeType.PREFERENCE,
  YA: SchemeType.ASSERTION,
};

export enum Scheme {
  AD_HOMINEM = "Ad Hominem",
  ALTERNATIVE_MEANS = "Alternative Means",
  ALTERNATIVES = "Alternatives",
  ANALOGY = "Analogy",
  ARBITRARY_VERBAL_CLASSIFICATION = "Arbitrary Verbal Classification",
  AUTHORITY = "Authority",
  BIAS = "Bias",
  BIASED_CLASSIFICATION = "Biased Classification",
  CALLING_OUT = "Calling Out",
  CAUSAL_SLIPPERY_SLOPE = "Causal Slippery Slope",
  CAUSE_TO_EFFECT = "Cause To Effect",
  CIRCUMSTANTIAL_AD_HOMINEM = "Circumstantial Ad Hominem",
  COMMITMENT_EXCEPTION = "Commitment Exception",
  COMMITMENT = "Commitment",
  COMPOSITION = "Composition",
  CONFLICTING_GOALS = "Conflicting Goals",
  CONSEQUENCES = "Consequences",
  CORRELATION_TO_CAUSE = "Correlation To Cause",
  DANGER_APPEAL = "Danger Appeal",
  DEFINITION_TO_VERBAL_CLASSIFICATION = "Definition To Verbal Classification",
  DIFFERENCES_UNDERMINE_SIMILARITY = "Differences Undermine Similarity",
  DILEMMA = "Dilemma",
  DIRECT_AD_HOMINEM = "Direct Ad Hominem",
  DIVISION = "Division",
  ESTABLISHED_RULE = "Established Rule",
  ETHOTIC = "Ethotic",
  EVIDENCE_TO_HYPOTHESIS = "Evidence To Hypothesis",
  EXAMPLE = "Example",
  EXCEPTION_SIMILARITY_CASE = "Exception Similarity Case",
  EXCEPTIONAL_CASE = "Exceptional Case",
  EXPERT_OPINION = "Expert Opinion",
  EXPERTISE_INCONSISTENCY = "Expertise Inconsistency",
  FAIRNESS = "Fairness",
  FALSIFICATION_OF_HYPOTHESIS = "Falsification Of Hypothesis",
  FEAR_APPEAL = "Fear Appeal",
  FULL_SLIPPERY_SLOPE = "Full Slippery Slope",
  GENERAL_ACCEPTANCE_DOUBT = "General Acceptance Doubt",
  GENERIC_AD_HOMINEM = "Generic Ad Hominem",
  GOODWILL = "Goodwill",
  GRADUALISM = "Gradualism",
  IGNORANCE = "Ignorance",
  INCONSISTENT_COMMITMENT = "Inconsistent Commitment",
  INFORMANT_REPORT = "Informant Report",
  INTERACTION_OF_ACT_AND_PERSON = "Interaction Of Act And Person",
  IRRATIONAL_FEAR_APPEAL = "Irrational Fear Appeal",
  LACK_OF_COMPLETE_KNOWLEDGE = "Lack Of Complete Knowledge",
  LACK_OF_EXPERT_RELIABILITY = "Lack Of Expert Reliability",
  LOGICAL = "Logical",
  MISPLACED_PRIORITIES = "Misplaced Priorities",
  MODUS_PONENS = "Modus Ponens",
  MORAL_VIRTUE = "Moral Virtue",
  NEED_FOR_HELP = "Need For Help",
  NEGATIVE_CONSEQUENCES = "Negative Consequences",
  OPPOSED_COMMITMENT = "Opposed Commitment",
  OPPOSITIONS = "Oppositions",
  CAUSAL_FACTORS_INVOLVED = "Causal Factors Involved",
  PARAPHRASE = "Paraphrase",
  PERCEPTION = "Perception",
  POPULAR_OPINION = "Popular Opinion",
  POPULAR_PRACTICE = "Popular Practice",
  POSITION_TO_KNOW = "Position To Know",
  POSITIVE_CONSEQUENCES = "Positive Consequences",
  PRACTICAL_REASONING_FROM_ANALOGY = "Practical Reasoning From Analogy",
  PRACTICAL_REASONING = "Practical Reasoning",
  PRACTICAL_WISDOM = "Practical Wisdom",
  PRAGMATIC_ALTERNATIVES = "Pragmatic Alternatives",
  PRAGMATIC_INCONSISTENCY = "Pragmatic Inconsistency",
  PRECEDENT_SLIPPERY_SLOPE = "Precedent Slippery Slope",
  PROPERTY_NOT_EXISTANT = "Property Not Existant",
  REFRAMING = "Reframing",
  REQUIRED_STEPS = "Required Steps",
  RESOLVING_INCONSISTENCY = "Resolving Inconsistency",
  RULE = "Rule",
  RULES = "Rules",
  SIGN_FROM_OTHER_EVENTS = "Sign From Other Events",
  SIGN = "Sign",
  TWO_PERSON_PRACTICAL_REASONING = "Two Person Practical Reasoning",
  UNFAIRNESS = "Unfairness",
  VAGUE_VERBAL_CLASSIFICATION = "Vague Verbal Classification",
  VAGUENESS_OF_VERBAL_CLASSIFICATION = "Vagueness Of Verbal Classification",
  VALUE_BASED_PRACTICAL_REASONING = "Value Based Practical Reasoning",
  VALUES = "Values",
  VERBAL_CLASSIFICATION = "Verbal Classification",
  VERBAL_SLIPPERY_SLOPE = "Verbal Slippery Slope",
  VESTED_INTEREST = "Vested Interest",
  VIRTUE_GOODWILL = "Virtue Goodwill",
  WASTE = "Waste",
  WEAKEST_LINK = "Weakest Link",
  WISDOM_GOODWILL = "Wisdom Goodwill",
  WISDOM_VIRTUE = "Wisdom Virtue",
  WISDOM_VIRTUE_GOODWILL = "Wisdom Virtue Goodwill",
  WITNESS_TESTIMONY = "Witness Testimony",
}

export interface Node {
  id: string;
  kind: "atom" | "scheme";
  created: string;
  updated: string;
  metadata: JsonValue;
}

export interface AtomNode extends Node {
  kind: "atom";
  text: string;
  reference?: Reference;
  participant?: string;
}

export function initAtom(text: string = "", id?: string | undefined): AtomNode {
  const now = date.now();

  return {
    id: id ?? uuid(),
    kind: "atom",
    created: now,
    updated: now,
    metadata: {},
    text: text,
    reference: undefined,
    participant: undefined,
  };
}

export interface SchemeNode extends Node {
  type?: SchemeType;
  argumentationScheme?: Scheme;
  descriptors: JsonValue;
}

export function initScheme(
  type?: SchemeType,
  argumentationScheme?: Scheme,
  id?: string
): SchemeNode {
  const now = date.now();

  return {
    id: id ?? uuid(),
    kind: "scheme",
    created: now,
    updated: now,
    metadata: {},
    type: type,
    argumentationScheme: argumentationScheme,
    descriptors: {},
  };
}

export function isAtom(data: Node): data is AtomNode {
  return data.kind === "atom";
}

export function isScheme(data: Node): data is SchemeNode {
  return data.kind === "scheme";
}

export function label(data: Node): string {
  if (isAtom(data)) {
    return data.text;
  } else if (isScheme(data)) {
    return data.argumentationScheme ?? data.type ?? "Unknown";
  }

  return "Unknown";
}

export function toProtobuf(data: Node): arguebuf.Node {
  const commonData = {
    created: date.toProtobuf(data.created),
    updated: date.toProtobuf(data.updated),
    metadata: Struct.fromJson(data.metadata),
  };

  if (isAtom(data)) {
    return {
      ...commonData,
      node: {
        oneofKind: "atom",
        atom: {
          text: data.text,
          participant: data.participant,
          reference: data.reference
            ? referenceToProtobuf(data.reference)
            : undefined,
        },
      },
    };
  } else if (isScheme(data)) {
    return {
      ...commonData,
      node: {
        oneofKind: "scheme",
        scheme: {
          descriptors: Struct.fromJson(data.descriptors),
          type: data.type ? schemeType2Proto[data.type] : undefined,
          argumentationScheme: undefined, // TODO
        },
      },
    };
  }

  throw new Error("Node type not supported.");
}

export function toAif(data: Node): aif.Node {
  let text = "Unknown";
  let type = "";

  if (isAtom(data)) {
    text = data.text;
    type = "I";
  } else if (isScheme(data)) {
    if (data.type) {
      text = data.type;
      type = schemeType2aif[data.type];
    }

    if (data.argumentationScheme) {
      text = data.argumentationScheme;
    }
  }

  return {
    nodeID: data.id,
    text: text,
    type: type,
    timestamp: date.format(data.updated, aif.DATE_FORMAT),
  };
}

export function fromAif(obj: aif.Node): Node {
  const commonProps: Omit<Node, "kind"> = {
    id: obj.nodeID,
    created: date.parse(obj.timestamp, aif.DATE_FORMAT),
    updated: date.parse(obj.timestamp, aif.DATE_FORMAT),
    metadata: {},
  };

  if (obj.type === "I") {
    const node: AtomNode = {
      ...commonProps,
      kind: "atom",
      text: obj.text,
    };

    return node;
  } else {
    const node: SchemeNode = {
      ...commonProps,
      kind: "scheme",
      type: obj.type ? aif2schemeType[obj.type as aif.SchemeType] : undefined,
      argumentationScheme: undefined, // TODO
      descriptors: {},
    };

    return node;
  }
}

export function fromProtobuf(id: string, obj: arguebuf.Node): Node {
  const commonProps: Omit<Node, "kind"> = {
    id,
    created: date.fromProtobuf(obj.created),
    updated: date.fromProtobuf(obj.updated),
    metadata: obj.metadata ? Struct.toJson(obj.metadata) : {},
  };

  if (obj.node.oneofKind === "atom") {
    const node: AtomNode = {
      ...commonProps,
      kind: "atom",
      text: obj.node.atom.text,
      participant: obj.node.atom.participant,
      reference: obj.node.atom.reference
        ? referenceFromProtobuf(obj.node.atom.reference)
        : undefined,
    };

    return node;
  } else if (obj.node.oneofKind === "scheme") {
    const node: SchemeNode = {
      ...commonProps,
      kind: "scheme",
      type: obj.node.scheme.type
        ? proto2schemeType[obj.node.scheme.type]
        : undefined,
      descriptors: obj.node.scheme.descriptors
        ? Struct.toJson(obj.node.scheme.descriptors)
        : {},
      argumentationScheme: undefined, // TODO
    };

    return node;
  }

  // TODO: Handle this error at some point!
  throw new Error("Node is neither Atom nor Scheme.");
}
