import * as common from "./common";

export enum SchemeType {
  SUPPORT = "Support",
  ATTACK = "Attack",
  REPHRASE = "Rephrase",
  TRANSITION = "Transition",
  PREFERENCE = "Preference",
  ASSERTION = "Assertion",
}

export enum Scheme {
  AD_HOMINEM = "Ad Hominem",
  ALTERNATIVE_MEANS = "Alternative Means",
  ALTERNATIVES = "Alternatives",
  ANALOGY = "Analogy",
  ARBITRARY_VERBAL_CLASSIFICATION = "Arbitrary Verbal Classification",
  AUTHORITY = "Authority",
  BIAS = "Bias",
  BIASED_CLASSIFICATION = "Biased_Classification",
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

export interface Data {
  id: string;
  kind: "atom" | "scheme";
  created: Date;
  updated: Date;
  metadata: common.Struct;
}

export interface AtomData extends Data {
  kind: "atom";
  text: string;
  reference?: Reference;
  participant?: string;
}

export function initAtomData(text: string, id?: string): AtomData {
  const date = new Date();

  return {
    id: id ?? common.uuid(),
    kind: "atom",
    created: date,
    updated: date,
    metadata: {},
    text: text,
    reference: null,
    participant: null,
  };
}

export interface SchemeData extends Data {
  type?: SchemeType;
  argumentationScheme?: Scheme;
  descriptors: common.Struct;
}

export function initSchemeData(
  type?: SchemeType,
  argumentationScheme?: Scheme,
  id?: string
): SchemeData {
  const date = new Date();

  return {
    id: id ?? common.uuid(),
    kind: "scheme",
    created: date,
    updated: date,
    metadata: {},
    type: type,
    argumentationScheme: argumentationScheme,
    descriptors: {},
  };
}

export interface Reference {
  resource: string;
  offset: number;
  text: string;
  metadata: common.Struct;
}

export function initReference(
  resource: string,
  offset: number,
  text: string
): Reference {
  return {
    resource,
    offset,
    text,
    metadata: {},
  };
}

export function isAtom(data: Data): data is AtomData {
  return data.kind === "atom";
}

export function isScheme(data: Data): data is SchemeData {
  return data.kind === "scheme";
}

export function label(data: Data): string {
  if (isAtom(data)) {
    return data.text;
  } else if (isScheme(data)) {
    return data.argumentationScheme ?? data.type;
  }

  return "Unknown";
}
