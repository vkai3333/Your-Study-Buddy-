#!/usr/bin/env python3
"""Build a cleaned AP Psychology vocabulary collection grouped by the current CED."""

import json
import pathlib
import re
import sys

import pdfplumber


SOURCE_TITLE = "Myer's Psychology for AP Vocabulary"
SOURCE_URL = "https://www.bpsgroverteacher.com/uploads/1/4/8/4/14847764/myer_s_psychology_for_ap_vocab.pdf"
CED_TITLE = "AP Psychology Course and Exam Description - Effective Fall 2025"
CED_URL = "https://apcentral.collegeboard.org/media/pdf/ap-psychology-course-and-exam-description.pdf"

SECTION_NAMES = {
    "0": "Science Practices and Research Methods",
    "1": "Biological Bases of Behavior",
    "2": "Cognition",
    "3": "Development and Learning",
    "4": "Social Psychology and Personality",
    "5": "Mental and Physical Health",
}

FEYNMAN_TOPICS = {
    "0": ["Experimental design", "Correlation and causation", "Sampling and generalizability", "Descriptive and inferential statistics", "Ethics in psychological research"],
    "1": ["Neural communication", "The nervous and endocrine systems", "Brain structure and function", "Heredity and environment", "Sleep and circadian rhythms", "Sensation and transduction", "Psychoactive drugs and dependence"],
    "2": ["Perceptual organization", "Attention and consciousness", "Encoding and storing memories", "Retrieval and forgetting", "Thinking and problem solving", "Language and cognition", "Intelligence and achievement testing"],
    "3": ["Prenatal and physical development", "Cognitive development across the lifespan", "Social and emotional development", "Language development", "Classical conditioning", "Operant conditioning", "Observational and cognitive learning"],
    "4": ["Attribution and person perception", "Attitudes and persuasion", "Conformity, obedience, and group behavior", "Prejudice and prosocial behavior", "Psychoanalytic theories of personality", "Humanistic and trait theories", "Social-cognitive theories", "Motivation", "Emotion"],
    "5": ["Stress and health", "Positive psychology and well-being", "Classifying psychological disorders", "Anxiety and trauma-related disorders", "Mood and psychotic disorders", "Personality and neurodevelopmental disorders", "Psychotherapy", "Biomedical treatments"],
}

MANUAL_CARDS = {
    "0": [
        ("Descriptive statistics", "Numerical methods that organize and summarize a data set, including measures of central tendency, variability, and distributions."),
        ("Inferential statistics", "Methods that use sample data to draw conclusions about a larger population and estimate whether an observed result is likely due to chance."),
        ("Positive correlation", "A relationship in which two variables tend to increase together or decrease together; it does not by itself establish causation."),
        ("Negative correlation", "A relationship in which one variable tends to increase as the other decreases; it does not by itself establish causation."),
        ("Skewed distribution", "A distribution in which scores extend farther on one side than the other, often pulling the mean toward the long tail."),
        ("Percentile rank", "The percentage of scores in a distribution that are at or below a particular score."),
        ("Generalizability", "The extent to which findings from a sample and research setting can reasonably apply to other people, populations, or situations."),
        ("Institutional review board", "A committee that evaluates proposed research involving human participants to protect their rights, safety, and welfare."),
        ("Confidentiality", "The ethical duty to protect participants' private information and limit access to identifiable research data."),
        ("Protection from harm", "The ethical requirement that researchers minimize physical and psychological risk and stop a study when participant welfare is threatened."),
        ("Right to withdraw", "The ethical principle that participants may leave a study at any time without penalty."),
        ("Deception in research", "Withholding or misrepresenting information only when scientifically justified, risk is minimized, alternatives are unavailable, and participants are debriefed afterward."),
    ],
}

TERM_REPAIRS = {
    "acommodation": "Accommodation (vision)",
    "accommodation": "Accommodation (Piaget)",
    "cochela": "Cochlea",
    "young-helmhotz trichromatic": "Young-Helmholtz trichromatic theory",
    "top- down processing": "Top-down processing",
    "antisocial personality disorder": "Antisocial personality disorder",
    "anxiety disorders": "Anxiety disorders",
    "bipolar disorder": "Bipolar disorder",
    "circadian rhythm": "Circadian rhythm",
    "consciousness": "Consciousness",
    "conversion disorder": "Conversion disorder",
    "delusions": "Delusions",
    "dissociative disorders": "Dissociative disorders",
    "dissociative identity disorder (did)": "Dissociative identity disorder",
    "major depressive disorder": "Major depressive disorder",
    "obsessive-compulsive disorder (ocd)": "Obsessive-compulsive disorder",
    "panic disorder": "Panic disorder",
    "post-traumatic stress disorder (ptsd)": "Posttraumatic stress disorder",
    "schizophrenia": "Schizophrenia",
    "sleep": "Sleep",
    "somatoform disorder": "Somatic symptom disorder",
    "ecstacy (mdma)": "Ecstasy (MDMA)",
    "hierarchy of neds": "hierarchy of needs",
    "hypochonriasis": "illness anxiety disorder",
    "indicisualism": "individualism",
    "menemonics": "mnemonics",
    "perceptual consistency": "perceptual constancy",
    "sensorieneural hearing loss": "sensorineural hearing loss",
    "dsm-iv-tr": "DSM-5-TR",
    "client centered therapy": "client-centered therapy",
}

# Definitions whose one-digit facts are indistinguishable from the source
# PDF's injected one-digit layout markers. Keeping the reviewed wording here
# makes regeneration deterministic and prevents facts from disappearing.
DEFINITION_OVERRIDES = {
    "night terrors": "A sleep disorder involving high arousal and an appearance of being terrified. Unlike nightmares, night terrors usually occur during deep NREM-3 sleep and are seldom remembered.",
    "sensorimotor stage": "In Piaget's theory, the stage from birth to about 2 years of age during which infants understand the world mainly through sensory impressions and motor activities.",
    "iconic vs. echoic memory": "Iconic memory is a momentary sensory memory of visual stimuli lasting a few tenths of a second. Echoic memory is a momentary sensory memory of auditory stimuli that can last about 3 to 4 seconds.",
    "fetus": "The developing human organism from about 9 weeks after conception to birth.",
    "preoperational stage": "In Piaget's theory, the stage from about ages 2 to 6 or 7 during which children learn to use language but do not yet understand concrete logical operations.",
    "babbling stage": "The stage of speech development beginning at about 4 months when an infant spontaneously produces speech-like sounds that are initially unrelated to the household language.",
    "concrete operational stage": "In Piaget's theory, the stage from about ages 6 or 7 to 11 during which children develop mental operations that support logical thinking about concrete events.",
    "embryo": "The developing human organism from about 2 weeks after fertilization through the second month.",
    "one-word, two-word, and telegraphic speech": "The one-word stage typically spans about ages 1 to 2 and uses single words. The two-word stage begins around age 2 and combines words. Telegraphic speech uses mostly nouns and verbs in brief, sentence-like sequences.",
    "stranger anxiety": "The fear of unfamiliar people that infants commonly begin displaying at about 8 months of age.",
    "attention-deficit hyperactivity disorder (adhd)": "A neurodevelopmental disorder involving persistent inattention and/or hyperactivity-impulsivity, with several symptoms present before age 12 and impairment in more than one setting.",
    "panic disorder": "A disorder involving recurrent, unexpected panic attacks: sudden episodes of intense fear that peak within minutes and can include chest pain, choking sensations, or other frightening symptoms.",
}

SKIP_TERMS = {
    "sq3r", "myer's psychology for ap* vocabulary [all 14 units]",
    "donald meichenbaum", "extrasensory perception", "near-death experience",
    "parapsychology", "terror-management theory",
}

# These concepts are normally learned together. A single comparison card keeps
# every definition while avoiding several nearly repetitive reviews.
COMBINE_GROUPS = {
    "0": [
        ("mean, median, and mode", ["mean", "median", "mode"]),
        ("positive vs. negative correlation", ["Positive correlation", "Negative correlation"]),
        ("applied vs. basic research", ["applied research", "basic research"]),
        ("experimental vs. control group", ["experimental group", "control group"]),
        ("independent vs. dependent variable", ["independent variable", "dependent variable"]),
        ("random sampling vs. random assignment", ["random sample", "random assignment"]),
        ("cross-sectional vs. longitudinal study", ["cross-sectional study", "longitudinal study"]),
        ("descriptive vs. inferential statistics", ["Descriptive statistics", "Inferential statistics"]),
        ("content vs. predictive validity", ["content validity", "predictive validity"]),
    ],
    "1": [
        ("sympathetic vs. parasympathetic nervous system", ["sympathetic nervous system", "parasympathetic nervous system"]),
        ("sensory neurons, motor neurons, and interneurons", ["sensory neurons", "motor neurons", "interneurons"]),
        ("rods vs. cones", ["rods", "cones"]),
        ("EEG, CT, PET, MRI, and fMRI", ["electroencephalogram", "CT (computed tomography) scan", "PET (positron emission tomography) scan", "MRI (magnetic resonance imaging)", "fMRI (functional MRI)"]),
        ("identical vs. fraternal twins", ["identical twins", "fraternal twins"]),
        ("physical vs. psychological dependence", ["physical dependence", "psychological dependence"]),
        ("place theory vs. frequency theory", ["place theory", "frequency theory"]),
        ("X vs. Y chromosome", ["X chromosome", "Y chromosome"]),
        ("stimulants, depressants, hallucinogens, and opiates", ["stimulants", "depressants", "hallucinogens", "opiates"]),
        ("tolerance vs. withdrawal", ["tolerance", "withdrawal"]),
    ],
    "2": [
        ("algorithm vs. heuristic", ["algorithm", "heuristic"]),
        ("availability vs. representativeness heuristic", ["availability heuristic", "representativeness heuristic"]),
        ("fluid vs. crystallized intelligence", ["fluid intelligence", "crystallized intelligence"]),
        ("proactive vs. retroactive interference", ["proactive interference", "retroactive interference"]),
        ("recall, recognition, and relearning", ["recall", "recognition", "relearning"]),
        ("iconic vs. echoic memory", ["iconic memory", "echoic memory"]),
        ("explicit vs. implicit memory", ["explicit memory", "implicit memory"]),
        ("bottom-up vs. top-down processing", ["bottom-up processing", "Top-down processing"]),
        ("binocular vs. monocular cues", ["binocular cues", "monocular cues"]),
        ("phoneme, morpheme, semantics, and syntax", ["phoneme", "morpheme", "semantics", "syntax"]),
        ("encoding, storage, and retrieval", ["encoding", "storage", "retrieval"]),
    ],
    "3": [
        ("assimilation vs. accommodation", ["assimilation", "Accommodation (Piaget)"]),
        ("fixed and variable reinforcement schedules", ["fixed-interval schedule", "fixed-ratio schedule", "variable-interval schedule", "variable-ratio schedule"]),
        ("conditioned and unconditioned stimuli and responses", ["conditioned stimulus", "conditioned response", "unconditioned stimulus", "unconditioned response"]),
        ("positive vs. negative reinforcement", ["positive reinforcement", "negative reinforcement"]),
        ("primary vs. conditioned reinforcer", ["primary reinforcer", "conditioned reinforcer"]),
        ("one-word, two-word, and telegraphic speech", ["one-word stage", "two-word stage", "telegraphic speech"]),
    ],
    "4": [
        ("internal vs. external locus of control", ["internal locus of control", "external locus of control"]),
        ("id, ego, and superego", ["id", "ego", "superego"]),
        ("ingroup vs. outgroup", ["ingroup", "outgroup"]),
        ("central vs. peripheral route of persuasion", ["central route of persuasion", "peripheral route of persuasion"]),
        ("individualism vs. collectivism", ["individualism", "collectivism"]),
        ("manifest vs. latent content", ["manifest content", "latent content"]),
        ("James-Lange, Cannon-Bard, and two-factor theories", ["James-Lange theory", "Cannon-Bard theory", "two-factor theory"]),
    ],
    "5": [
        ("anorexia nervosa, bulimia nervosa, and binge-eating disorder", ["anorexia nervosa", "bulimia nervosa", "binge-eating disorder"]),
        ("hallucinations vs. delusions", ["hallucinations", "Delusions"]),
        ("antianxiety, antidepressant, and antipsychotic drugs", ["antianxiety drugs", "antidepressant drugs", "antipsychotic drugs"]),
        ("denial, repression, rationalization, and reaction formation", ["denial", "repression", "rationalization", "reaction formation"]),
    ],
}

UNIT_TERMS = {
    "0": {
        "applied research", "basic research", "case study", "confounding variable", "control group",
        "correlation", "correlation coefficient", "cross-sectional study", "debriefing", "dependent variable",
        "descriptive statistics", "double-blind procedure", "experiment", "experimental group", "hindsight bias",
        "hypothesis", "illusory correlation", "independent variable", "informed consent", "longitudinal study",
        "mean", "median", "mode", "naturalistic observation", "normal curve", "operational definition",
        "population", "random assignment", "random sample", "range", "regression toward the mean", "replication",
        "scatterplot", "standard deviation", "statistical significance", "survey", "theory", "validity",
    },
    "1": {
        "absolute threshold", "action potential", "adrenal glands", "amygdala", "amphetamines", "axon",
        "autonomic nervous system", "barbiturates", "behavior genetics", "biological psychology", "blind spot",
        "brainstem", "cerebellum", "chromosomes", "circadian rhythm", "cochlea", "cochlear implant",
        "cones", "corpus callosum", "ct (computed tomography) scan", "delta waves", "dendrite", "depressants",
        "difference threshold", "dopamine", "eeg", "endocrine system", "endorphins", "epinephrine and norepinephrine",
        "fMRI", "frontal lobes", "genes", "glial cells", "hallucinogens", "heritability", "hippocampus",
        "hormones", "hypothalamus", "interneurons", "lesion", "limbic system", "lsd", "medulla", "motor cortex",
        "motor neurons", "myelin sheath", "natural selection", "nervous system", "neural networks", "neuron",
        "neurotransmitters", "occipital lobes", "opiates", "parasympathetic nervous system", "parietal lobes",
        "peripheral nervous system", "pituitary gland", "plasticity", "psychoactive drug", "pupil", "reflex",
        "refractory period", "REM sleep", "reticular formation", "retina", "reuptake", "rods", "sensory adaptation",
        "sensory cortex", "sensory interaction", "sensory neurons", "signal detection theory", "sleep apnea",
        "somatic nervous system", "split brain", "stimulants", "sympathetic nervous system", "synapse", "temporal lobes",
        "thalamus", "THC", "tolerance", "transduction", "vestibular sense", "wavelength", "Weber's law",
        "Wernicke's area", "X chromosome", "Y chromosome", "Young-Helmholtz trichromatic theory",
        "Accommodation (vision)", "audition", "sensation", "sensory receptors", "sleep",
    },
    "2": {
        "acoustic encoding", "achievement tests", "algorithm", "amnesia", "aphasia", "aptitude tests",
        "association areas", "automatic processing", "availability heuristic", "binocular cues", "bottom-up processing",
        "Broca's area", "change blindness", "chunking", "cognition", "cognitive map", "cognitive neuroscience",
        "cognitive psychology", "color constancy", "concept", "confirmation bias", "creativity", "crystallized intelligence",
        "depth perception", "echoic memory", "encoding", "episodic memory", "explicit memory", "fixation",
        "flashbulb memory", "fluid intelligence", "framing", "functional fixedness", "grammar", "heuristic",
        "iconic memory", "implicit memory", "intelligence", "intelligence quotient", "language", "linguistic determinism",
        "long-term memory", "memory", "mental set", "misinformation effect", "mnemonic", "monocular cues",
        "morpheme", "object permanence", "perception", "perceptual adaptation", "perceptual constancy", "perceptual set",
        "phoneme", "priming", "prototype", "proactive interference", "recall", "recognition", "rehearsal",
        "representativeness heuristic", "retrieval", "retroactive interference", "schema", "selective attention",
        "semantic encoding", "semantics", "sensory memory", "serial position effect", "short-term memory", "source amnesia",
        "spacing effect", "storage", "subliminal", "syntax", "top-down processing", "visual encoding", "working memory",
    },
    "3": {
        "Accommodation (Piaget)", "acquisition", "adolescence", "assimilation", "associative learning", "attachment",
        "babbling stage", "basic trust", "classical conditioning", "cognitive development", "concrete operational stage",
        "conditioned reinforcer", "conditioned response", "conditioned stimulus", "conservation", "continuous reinforcement",
        "critical period", "developmental psychology", "discrimination (classical conditioning)", "discriminative stimulus",
        "embryo", "extinction", "fixed-interval schedule", "fixed-ratio schedule", "formal operational stage",
        "habituation", "imprinting", "language acquisition", "latent learning", "law of effect", "learning", "maturation",
        "menarche", "modeling", "observational learning", "operant chamber", "operant conditioning", "partial reinforcement",
        "positive reinforcement", "primary reinforcer", "punishment", "respondent behavior", "secondary sex characteristics",
        "shaping", "social clock", "spontaneous recovery", "stranger anxiety", "telegraphic speech", "temperament",
        "teratogens", "theory of mind", "two-word stage", "unconditioned response", "unconditioned stimulus",
        "variable-interval schedule", "variable-ratio schedule", "visual cliff", "zygote", "negative reinforcement",
    },
    "4": {
        "adaptation-level phenomenon", "aggression", "altruism", "attitude", "attribution theory", "bystander effect",
        "Cannon-Bard theory", "catharsis", "central route of persuasion", "cognitive dissonance theory", "collectivism",
        "companionate love", "conformity", "culture", "deindividuation", "discrimination (social psychology)",
        "displacement", "drive-reduction theory", "ego", "emotion", "equity", "external locus of control",
        "facial feedback", "foot-in-the-door phenomenon", "frustration-aggression principle", "fundamental attribution error",
        "group polarization", "groupthink", "hierarchy of needs", "id", "individualism", "ingroup", "ingroup bias",
        "insight", "instinct", "internal locus of control", "James-Lange theory", "mere exposure effect", "motivation",
        "norm", "obedience", "outgroup", "peripheral route persuasion", "personality", "personal control", "prejudice",
        "projection", "projective test", "reciprocal determinism", "reciprocity norm", "relative deprivation", "role",
        "Rorschach inkblot test", "scapegoat theory", "self", "self-actualization", "self-concept", "self-disclosure",
        "self-esteem", "self-fulfilling prophecy", "self-serving bias", "social exchange theory", "social facilitation",
        "social identity", "social loafing", "social psychology", "social trap", "social-cognitive perspective",
        "social-cultural psychology", "social-responsibility norm", "stereotype", "stereotype threat", "sublimation",
        "superego", "superordinate goals", "trait", "two-factor theory", "unconditional positive regard",
    },
    "5": {
        "Aaron Beck", "active listening", "addiction", "anorexia nervosa", "antianxiety drugs", "antidepressant drugs",
        "antipsychotic drugs", "Antisocial personality disorder", "Anxiety disorders", "aversive conditioning", "behavior therapy",
        "behavioral medicine", "biofeedback", "biomedical therapy", "Bipolar disorder", "bulimia nervosa", "client centered therapy",
        "clinical psychology", "cognitive behavioral therapy", "cognitive therapy", "Conversion disorder", "coronary heart disease",
        "counseling psychology", "counterconditioning", "defense mechanisms", "Delusions", "denial", "Dissociative disorders",
        "Dissociative identity disorder", "eclectic approach", "electroconvulsive therapy", "exposure therapies", "free association",
        "generalized anxiety disorder", "hallucinations", "health psychology", "learned helplessness", "Major depressive disorder",
        "mania", "medical model", "mood disorders", "narcissistic personality disorder", "neurodevelopmental disorder",
        "neurotic disorders", "Obsessive-compulsive disorder", "Panic disorder", "personality disorders", "phobia",
        "positive psychology", "Posttraumatic stress disorder", "psychoanalysis", "psychodynamic therapy", "psychological disorder",
        "psychopharmacology", "psychotherapy", "rationalization", "reaction formation", "repetitive transcranial magnetic stimulation",
        "repression", "resilience", "resistance", "Schizophrenia", "Somatic symptom disorder", "stress",
        "systematic desensitization", "tardive dyskinesia", "token economy", "transference", "virtual reality exposure therapy", "well-being",
    },
}


def clean_line_artifacts(text):
    lines = []
    for line in text.splitlines():
        line = re.sub(r"\s+\d\s*$", "", line.rstrip())
        lines.append(line)
    text = re.sub(r"\s+", " ", " ".join(lines)).strip()
    # The source PDF inserts one-digit column/page markers between extracted
    # words. Remove those markers here; meaningful one-digit facts are restored
    # explicitly below so they cannot be confused with layout debris.
    text = re.sub(r"(?:\s+[1-9]\.)+\s*$", "", text)
    text = re.sub(r"(?<=\D)\s+[1-9](?=\s|[.,])", " ", text)
    text = re.sub(r"\s+[1-9]\.\s*$", "", text)
    return text


def clean_definition(text):
    text = re.sub(r"\s+", " ", clean_line_artifacts(text))
    replacements = {
        "resposne": "response", "fivers": "fibers", "commnicating": "communicating",
        "expendenture": "expenditure", "occurrin": "occurring", "to things": "two things",
        "body'd": "body's", "fo old": "of old", "o things": "of things", "math,": "match,",
        "the close the object": "the closer the object", "Jonson": "Johnson", "combing words": "combining words",
        "twof things": "two things", "occurringg": "occurring", "The slop of": "The slope of",
        "night terrors occur during Stage sleep": "night terrors occur during deep NREM-3 sleep",
        "from birth to about years of age": "from birth to about 2 years of age",
        "recalled within or seconds": "recalled within 3 or 4 seconds",
        "from weeks after conception to birth": "from 9 weeks after conception to birth",
        "from about to or years of age": "from about 2 to 6 or 7 years of age",
        "Beginning at about months": "Beginning at about 4 months",
        "from about or to 11 years of age": "from about 6 or 7 to 11 years of age",
        "from about weeks after fertilization": "from about 2 weeks after fertilization",
        "from about age to ,": "from about age 1 to 2,",
        "Beginning about age ,": "Beginning about age 2,",
        "beginning by about months of age": "beginning by about 8 months of age",
        "marked by the appearance by age of": "marked by symptoms that begin before age 12, including",
        "marked by unpredictable minutes-long episodes": "marked by sudden episodes lasting several minutes",
    }
    for wrong, right in replacements.items():
        text = text.replace(wrong, right)
    text = re.sub(r"\s+[1-9]\.\s*$", "", text)
    text = re.sub(r"\s+", " ", text).strip(" -.;")
    if text:
        text = text[0].upper() + text[1:]
    if text and text[-1] not in ".!?":
        text += "."
    return text


def normalize_term(term, definition):
    raw = re.sub(r"\s+", " ", term).strip(" .")
    lower = raw.casefold()
    if lower == "accommodation":
        return "Accommodation (vision)" if "lens" in definition.casefold() else "Accommodation (Piaget)"
    if lower == "discrimination":
        return "Discrimination (classical conditioning)" if "classical conditioning" in definition.casefold() else "Discrimination (social psychology)"
    return TERM_REPAIRS.get(lower, raw)


def extract_entries(pdf_path):
    entries = []
    with pdfplumber.open(pdf_path) as pdf:
        for page_index, page in enumerate(pdf.pages):
            boxes = [(0, 0, 306, page.height), (306, 0, page.width, page.height)] if page_index < 16 else [(0, 0, page.width, page.height)]
            for box in boxes:
                text = page.crop(box).extract_text(x_tolerance=2, y_tolerance=3) or ""
                matches = list(re.finditer(r"(?m)^\s*(\d+)\.\s+([^:\n]{1,100}):\s*", text))
                for index, match in enumerate(matches):
                    end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
                    definition = clean_definition(text[match.end():end])
                    term = normalize_term(match.group(2), definition)
                    if term.casefold() not in SKIP_TERMS and len(definition) >= 35:
                        entries.append({"number": int(match.group(1)), "term": term, "definition": definition})
    return entries


def classify(entry):
    term = entry["term"]
    for unit, terms in UNIT_TERMS.items():
        if term in terms or term.casefold() in {item.casefold() for item in terms}:
            return unit
    text = f"{term} {entry['definition']}".casefold()
    keyword_groups = {
        "0": ["experiment", "sample", "correlat", "statistic", "variable", "research", "survey", "distribution"],
        "1": ["brain", "neuron", "nervous", "hormone", "sensory", "retina", "hearing", "drug", "sleep", "genetic"],
        "2": ["memory", "intelligence", "thinking", "language", "perception", "cognitive", "problem solving", "encoding"],
        "3": ["conditioning", "reinforce", "development", "infant", "child", "learning", "prenatal", "puberty"],
        "4": ["social", "personality", "attitude", "group", "emotion", "motivation", "Freud", "self-concept"],
        "5": ["disorder", "therapy", "treatment", "depression", "anxiety", "stress", "patient", "psychological health"],
    }
    scores = {unit: sum(1 for keyword in keywords if keyword.casefold() in text) for unit, keywords in keyword_groups.items()}
    winner = max(scores, key=scores.get)
    return winner if scores[winner] else "2"


def combine_related_cards(items, unit):
    by_term = {item["term"].casefold(): item for item in items}
    consumed = set()
    combined = []
    for front, member_terms in COMBINE_GROUPS.get(unit, []):
        members = [by_term.get(term.casefold()) for term in member_terms]
        members = [member for member in members if member]
        if len(members) < 2:
            continue
        consumed.update(member["term"].casefold() for member in members)
        back = " ".join(f'{member["term"]}: {member["definition"]}' for member in members)
        combined.append({"number": "combined", "term": front, "definition": back})
    return [item for item in items if item["term"].casefold() not in consumed] + combined


def finalized_definition(term, definition):
    override = DEFINITION_OVERRIDES.get(term.casefold())
    if override:
        return override
    # Remove source column/page markers that survived inside combined cards.
    definition = re.sub(r"\s+[1-9]\.(?=\s|$)", "", definition)
    definition = re.sub(r"\s+", " ", definition).strip()
    if definition and definition[-1] not in ".!?":
        definition += "."
    return definition


def build_decks(entries):
    unique = {}
    for entry in entries:
        key = entry["term"].casefold()
        if key not in unique or len(entry["definition"]) > len(unique[key]["definition"]):
            unique[key] = entry
    grouped = {unit: [] for unit in SECTION_NAMES}
    for entry in unique.values():
        grouped[classify(entry)].append(entry)

    for unit, cards in MANUAL_CARDS.items():
        for index, (term, definition) in enumerate(cards, 1):
            if term.casefold() not in unique:
                grouped[unit].append({"number": f"supplement-{index}", "term": term, "definition": definition})

    decks = []
    for unit, name in SECTION_NAMES.items():
        items = combine_related_cards(grouped[unit], unit)
        items = sorted(items, key=lambda item: item["term"].casefold())
        deck_id = f"appsych-unit-{unit}"
        decks.append({
            "id": deck_id,
            "name": f"AP Psychology - {'Unit ' + unit if unit != '0' else 'Unit 0'}",
            "shortName": f"Unit {unit}: {name}",
            "builtIn": True,
            "sourceTitle": SOURCE_TITLE,
            "sourceUrl": SOURCE_URL,
            "cedTitle": CED_TITLE,
            "cedUrl": CED_URL,
            "cards": [{"id": f"{deck_id}-c{index}", "front": item["term"], "back": finalized_definition(item["term"], item["definition"]), "sourceNumber": item["number"]} for index, item in enumerate(items, 1)],
            "questions": [],
            "feynmanPrompts": [{"id": f"{deck_id}-f{index}", "prompt": prompt} for index, prompt in enumerate(FEYNMAN_TOPICS[unit], 1)],
        })
    return decks


def validate(decks):
    cards = [card for deck in decks for card in deck["cards"]]
    assert len(cards) >= 500
    assert len(cards) == len({card["front"].casefold() for card in cards})
    assert all(len(card["back"]) >= 35 and card["back"][-1] in ".!?" for card in cards)
    assert all("?" not in card["front"] for card in cards)
    assert all(not re.search(r"\b(?:unit|part)\s*\d", card["front"], re.I) for card in cards)
    assert all(not re.search(r"\b(?:Stage|age|about|within|from)\s{2,}", card["back"], re.I) for card in cards)
    assert all(not re.search(r"\s[1-9]\.(?:\s|$)", card["back"]) for card in cards)


def main():
    if len(sys.argv) != 3:
        raise SystemExit("usage: generate-appsych-data.py SOURCE_PDF OUTPUT_JS")
    decks = build_decks(extract_entries(pathlib.Path(sys.argv[1])))
    validate(decks)
    pathlib.Path(sys.argv[2]).write_text("window.AP_PSYCHOLOGY_DECKS = " + json.dumps(decks, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Wrote {sum(len(deck['cards']) for deck in decks)} cards and {sum(len(deck['feynmanPrompts']) for deck in decks)} Feynman topics")
    for deck in decks:
        print(f"  {deck['shortName']}: {len(deck['cards'])} cards, {len(deck['feynmanPrompts'])} topics")


if __name__ == "__main__":
    main()
