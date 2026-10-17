(() => {
  const sourceUrl = "https://www.usmle.org/exam-resources";
  const parse = (text) => text.trim().split("\n").filter(Boolean).map((line) => line.split("|"));
  const unit = (index, name, step1, step2, prompts) => {
    const cards = [
      ...parse(step1).map(([front, back]) => ({ front, back, courseLevel: "Step 1" })),
      ...parse(step2).map(([front, back]) => ({ front, back, courseLevel: "Step 2 CK" })),
    ].map((card, cardIndex) => ({ ...card, id: `usmle-${index}-c${cardIndex + 1}` }));
    return {
      id: `usmle-system-${index}`,
      name: `USMLE · ${name}`,
      shortName: name,
      description: `${name} review aligned to the USMLE integrated content outline.`,
      builtIn: true,
      sourceTitle: "USMLE Content Outline and Physician Tasks/Competencies",
      sourceUrl,
      cards,
      questions: [],
      feynmanPrompts: prompts.map((prompt, promptIndex) => ({ id: `usmle-${index}-f${promptIndex + 1}`, prompt })),
    };
  };

  window.USMLE_DECKS = [
    unit(1, "Foundational pathology and pharmacology", `
Cellular adaptation|Hypertrophy increases cell size; hyperplasia increases cell number; atrophy decreases cell size; metaplasia replaces one mature cell type with another.
Reversible cell injury|ATP depletion produces cellular swelling, membrane blebs, ribosomal detachment, and fatty change before irreversible membrane or mitochondrial injury occurs.
Apoptosis|Programmed cell death mediated by caspases; cells shrink and fragment without provoking the marked inflammation typical of necrosis.
Coagulative necrosis|Preserved tissue architecture with eosinophilic anucleate cells, classically caused by ischemia in solid organs except the brain.
Liquefactive necrosis|Enzymatic digestion producing liquid debris, classically seen in brain infarction and abscesses.
Type I hypersensitivity|Immediate IgE-mediated mast-cell degranulation causing allergy, anaphylaxis, and atopic disease.
Type II hypersensitivity|IgG or IgM targets cell-surface or extracellular-matrix antigens, causing dysfunction, complement activation, or cell destruction.
Type III hypersensitivity|Immune-complex deposition activates complement and inflammation in tissues such as vessels, joints, and glomeruli.
Type IV hypersensitivity|Delayed T-cell-mediated injury, including contact dermatitis, granulomatous inflammation, and many autoimmune reactions.
Drug clearance|Volume of plasma cleared of drug per unit time; total clearance determines maintenance dosing and elimination rate.
Volume of distribution|Apparent volume relating the amount of drug in the body to its plasma concentration; a large value suggests tissue distribution.
Competitive antagonist|Reversibly competes at the receptor, shifting the agonist dose-response curve right without reducing maximal efficacy.
Noncompetitive antagonist|Reduces maximal agonist effect and generally cannot be overcome by increasing agonist concentration.
Cytochrome P450 induction|Increases metabolism of susceptible drugs, often lowering their concentration; common inducers include rifampin, carbamazepine, and phenytoin.
Cytochrome P450 inhibition|Decreases metabolism of susceptible drugs, often raising toxicity risk; important inhibitors include macrolides, azoles, and ritonavir.
`, `
Selecting empiric antimicrobial therapy|Use the suspected site, likely organisms, illness severity, local resistance, allergies, organ function, and recent exposures, then narrow when cultures return.
Recognizing an adverse drug reaction|Relate symptom timing to drug exposure, identify known toxicities and interactions, assess competing causes, and stop or reverse dangerous agents.
Managing anaphylaxis|Give intramuscular epinephrine promptly, support airway and circulation, provide fluids when needed, and observe for recurrence.
Interpreting sensitivity and specificity|Highly sensitive tests help rule out disease when negative; highly specific tests help rule in disease when positive.
Absolute risk reduction|Control event rate minus treatment event rate; its reciprocal is the number needed to treat.
Confounding|A third variable associated with both exposure and outcome distorts their observed relationship; restriction, matching, stratification, or adjustment can reduce it.
`, ["Explain how to distinguish reversible injury, apoptosis, and necrosis from a clinical or pathology description.", "Explain how pharmacokinetics and pharmacodynamics guide loading dose, maintenance dose, and toxicity management."]),

    unit(2, "Cardiovascular system", `
Cardiac output|Heart rate multiplied by stroke volume; it rises with increased preload or contractility and falls with severe afterload or pump failure.
Preload|Ventricular wall stretch at end diastole, approximated clinically by end-diastolic volume and influenced by venous return.
Afterload|Resistance the ventricle must overcome to eject blood; systemic vascular resistance is a major determinant for the left ventricle.
Frank–Starling relationship|Within physiologic limits, increased ventricular filling increases contraction force and stroke volume.
Pressure-volume loop: aortic stenosis|Increased afterload produces higher systolic pressure, reduced stroke volume, and concentric left-ventricular hypertrophy.
Pressure-volume loop: mitral regurgitation|Loss of isovolumetric phases and regurgitant flow increase total stroke volume while reducing effective forward output.
Stable angina|Predictable exertional chest pressure from fixed coronary narrowing that improves with rest or nitroglycerin.
Acute pericarditis|Sharp pleuritic chest pain relieved by leaning forward, diffuse ST elevation, and PR depression.
Cardiac tamponade|Pericardial pressure impairs diastolic filling, causing hypotension, elevated jugular venous pressure, and muffled heart sounds.
Left-sided heart failure|Pulmonary congestion, orthopnea, paroxysmal nocturnal dyspnea, crackles, and possible S3 result from impaired left-ventricular function.
`, `
Initial evaluation of suspected acute coronary syndrome|Obtain an ECG within minutes, measure serial troponins, give indicated antiplatelet therapy, and identify patients needing urgent reperfusion.
ST-elevation myocardial infarction treatment|Activate immediate reperfusion with PCI when timely; use fibrinolysis only when PCI is unavailable and no contraindication exists.
Heart failure with reduced ejection fraction|Disease-modifying therapy generally combines an ARNI or ACE inhibitor/ARB, evidence-based beta blocker, mineralocorticoid antagonist, and SGLT2 inhibitor as tolerated.
Unstable tachyarrhythmia|Hypotension, ischemic pain, shock, or acute heart failure generally requires synchronized cardioversion; pulseless rhythms follow cardiac-arrest algorithms.
Aortic dissection|Sudden tearing pain with pulse or pressure asymmetry warrants urgent aortic imaging and rapid heart-rate/blood-pressure control; ascending dissections require surgery.
Infective endocarditis diagnosis|Obtain multiple blood-culture sets before antibiotics when stable and use echocardiography to evaluate vegetations and complications.
`, ["Explain how preload, afterload, contractility, and heart rate alter a pressure-volume loop.", "Explain a safe diagnostic and treatment pathway for acute chest pain."]),

    unit(3, "Respiratory system", `
V/Q mismatch|Ventilation and perfusion are unequally distributed; it is a common cause of hypoxemia and usually improves with supplemental oxygen.
Shunt|Perfusion reaches poorly ventilated or unventilated alveoli, producing hypoxemia that responds incompletely to oxygen.
Dead space|Ventilated lung receives little or no perfusion, as in pulmonary embolism.
Obstructive lung disease|Reduced expiratory flow causes a low FEV1/FVC ratio and air trapping.
Restrictive lung disease|Reduced lung volumes with a normal or increased FEV1/FVC ratio; causes may be parenchymal or extrapulmonary.
Asthma pathophysiology|Reversible bronchoconstriction, airway inflammation, and hyperresponsiveness produce episodic wheeze, cough, and dyspnea.
Emphysema|Alveolar-wall destruction reduces elastic recoil and diffusion surface area, causing air trapping and decreased DLCO.
Chronic bronchitis|Productive cough for at least three months in each of two consecutive years reflects mucus-gland enlargement and airway inflammation.
ARDS|Diffuse inflammatory alveolar injury causes noncardiogenic pulmonary edema, severe hypoxemia, and bilateral opacities.
`, `
Suspected pulmonary embolism|Estimate pretest probability, use D-dimer for appropriate low-risk patients, and obtain CT pulmonary angiography when indicated.
Severe asthma exacerbation|Give repeated inhaled short-acting bronchodilator, systemic corticosteroid, oxygen, and add therapies such as ipratropium or magnesium based on severity.
COPD exacerbation|Use bronchodilators, systemic steroids, controlled oxygen, and antibiotics when bacterial features or ventilatory support indications are present.
Tension pneumothorax|Hemodynamic instability with unilateral absent breath sounds requires immediate decompression before confirmatory imaging.
ARDS ventilation|Use lung-protective low tidal volumes, adequate PEEP, and prone positioning for appropriate severe cases while treating the cause.
`, ["Explain how to use V/Q concepts and the A–a gradient to classify hypoxemia.", "Explain how spirometry, lung volumes, and DLCO distinguish major pulmonary disorders."]),

    unit(4, "Renal, fluids, and electrolytes", `
Renal clearance|Clearance equals urine concentration multiplied by urine flow divided by plasma concentration.
Filtered load|Glomerular filtration rate multiplied by plasma solute concentration.
Proximal tubule|Reabsorbs most filtered sodium and water, nearly all glucose and amino acids, and most bicarbonate.
Thick ascending limb|Reabsorbs sodium, potassium, and chloride; it is impermeable to water and helps generate the medullary gradient.
ADH|Increases collecting-duct water permeability through V2-receptor signaling and aquaporin-2 insertion.
Prerenal azotemia|Reduced renal perfusion causes avid sodium and water retention, often producing low fractional sodium excretion and concentrated urine.
Nephritic syndrome|Glomerular inflammation causes hematuria, red-cell casts, hypertension, and reduced filtration.
Nephrotic syndrome|Heavy proteinuria causes hypoalbuminemia, edema, hyperlipidemia, lipiduria, and thrombotic risk.
Anion gap|Calculated as sodium minus chloride and bicarbonate; an increased gap reflects unmeasured anions in metabolic acidosis.
Winter formula|Expected PCO2 in metabolic acidosis is approximately 1.5 times bicarbonate plus 8, with a small allowable range.
`, `
Severe symptomatic hyponatremia|Treat urgently with carefully monitored hypertonic saline while avoiding overly rapid correction and osmotic demyelination.
Hyperkalemia with ECG changes|Stabilize myocardium with IV calcium, shift potassium intracellularly, and remove potassium from the body.
Acute kidney injury evaluation|Assess volume and hemodynamics, review nephrotoxins, examine urinalysis and sediment, and exclude obstruction.
Nephritic presentation after infection|Use timing, complement levels, serologies, and kidney function to distinguish postinfectious disease, IgA nephropathy, and other glomerulonephritides.
Kidney stone management|Control pain, assess infection and obstruction, encourage appropriate hydration, and urgently decompress an infected obstructed system.
`, ["Explain a systematic approach to mixed acid–base disorders.", "Explain how urine findings distinguish prerenal, intrinsic, and postrenal acute kidney injury."]),

    unit(5, "Gastrointestinal and hepatobiliary systems", `
Portal hypertension|Increased portal resistance produces varices, splenomegaly, ascites, and portosystemic collateral vessels.
Bilirubin metabolism|Heme becomes unconjugated bilirubin, is transported bound to albumin, conjugated in liver, and excreted in bile.
Hepatocellular injury pattern|Aminotransferases rise disproportionately compared with alkaline phosphatase.
Cholestatic injury pattern|Alkaline phosphatase and gamma-glutamyl transferase rise disproportionately because bile flow is impaired.
Celiac disease|Gluten-triggered immune injury causes villous atrophy, crypt hyperplasia, malabsorption, and anti-tissue-transglutaminase antibodies.
Crohn disease|Transmural, discontinuous inflammation can occur anywhere from mouth to anus and causes fistulas, strictures, and granulomas.
Ulcerative colitis|Continuous mucosal inflammation begins in the rectum and increases colorectal cancer and toxic megacolon risk.
Acute pancreatitis|Premature pancreatic enzyme activation causes epigastric pain radiating to the back and elevated lipase.
`, `
Upper gastrointestinal bleeding|Stabilize airway and circulation, obtain access and laboratory studies, start indicated acid suppression, and arrange timely endoscopy.
Acute variceal bleeding|Resuscitate, give vasoactive therapy and antibiotics, then perform urgent endoscopic band ligation.
Acute cholangitis|Fever, jaundice, and right-upper-quadrant pain with obstruction require antibiotics and urgent biliary drainage when severe.
Acute pancreatitis management|Give early isotonic fluids, analgesia, nutrition as tolerated, and treat the cause; antibiotics are not routine without infection.
Spontaneous bacterial peritonitis|Ascitic neutrophils at or above the diagnostic threshold require prompt antibiotics and often albumin.
`, ["Explain how to interpret hepatocellular versus cholestatic liver-test patterns.", "Explain how symptoms, serology, endoscopy, and pathology distinguish common inflammatory bowel diseases."]),

    unit(6, "Endocrine and metabolism", `
Primary endocrine failure|Low target-gland hormone with elevated trophic hormone indicates failure of the target gland.
Secondary endocrine failure|Low target-gland hormone with low or inappropriately normal trophic hormone suggests pituitary or hypothalamic disease.
Diabetic ketoacidosis|Insulin deficiency causes hyperglycemia, ketone production, anion-gap acidosis, osmotic diuresis, and total-body potassium depletion.
Hyperosmolar hyperglycemic state|Severe hyperglycemia and dehydration cause high osmolality with little ketoacidosis, usually in type 2 diabetes.
Primary hyperparathyroidism|Excess PTH causes hypercalcemia, low phosphate, increased bone turnover, and kidney-stone risk.
Graves disease|TSH-receptor-stimulating antibodies cause hyperthyroidism, diffuse goiter, ophthalmopathy, and sometimes pretibial myxedema.
Cushing syndrome|Chronic cortisol excess causes central adiposity, muscle weakness, hypertension, glucose intolerance, bruising, and osteoporosis.
Primary adrenal insufficiency|Low cortisol and aldosterone with high ACTH cause hypotension, hyperkalemia, hyponatremia, and hyperpigmentation.
`, `
Diabetic ketoacidosis treatment|Give isotonic fluid, check and replace potassium appropriately, administer insulin, and treat the precipitating cause.
Thyroid storm|Treat with beta blockade, a thionamide followed by iodine, glucocorticoid, cooling, and management of the trigger.
Adrenal crisis|Give immediate IV glucocorticoid and isotonic fluids with dextrose as needed; do not delay treatment for testing.
Hypercalcemia evaluation|Confirm calcium, assess PTH, then distinguish PTH-mediated disease from malignancy, vitamin D, medication, and other causes.
Pituitary mass with visual symptoms|Evaluate hormones and visual fields and obtain sellar imaging; acute hemorrhage with instability is an emergency.
`, ["Explain how feedback loops localize primary versus central endocrine disease.", "Explain the order and rationale of treatment in diabetic ketoacidosis."]),

    unit(7, "Nervous system and special senses", `
Upper motor neuron lesion|Weakness with spasticity, hyperreflexia, and Babinski sign results from corticospinal tract injury above the anterior horn.
Lower motor neuron lesion|Weakness with atrophy, fasciculations, flaccidity, and reduced reflexes results from anterior-horn, root, plexus, or peripheral-nerve injury.
Broca aphasia|Nonfluent speech with relatively preserved comprehension and impaired repetition, usually from dominant inferior frontal injury.
Wernicke aphasia|Fluent but meaningless speech with impaired comprehension and repetition, usually from dominant posterior temporal injury.
Parkinson disease|Loss of substantia nigra dopaminergic neurons produces bradykinesia, rigidity, resting tremor, and postural instability.
Multiple sclerosis|Immune-mediated CNS demyelination creates neurologic deficits separated in time and space.
Myasthenia gravis|Postsynaptic acetylcholine-receptor dysfunction causes fatigable weakness that often affects ocular and bulbar muscles.
Guillain–Barré syndrome|Acute immune peripheral demyelination causes ascending weakness, areflexia, and possible respiratory or autonomic failure.
`, `
Suspected acute ischemic stroke|Establish last-known-well time, check glucose, obtain urgent noncontrast head CT, and assess eligibility for reperfusion.
Subarachnoid hemorrhage|Sudden maximal headache requires urgent CT; if suspicion remains after a negative appropriate CT, further testing is required.
Status epilepticus|Give a benzodiazepine promptly, follow with a longer-acting antiseizure drug, and address airway, glucose, and the cause.
Bacterial meningitis|Obtain cultures promptly and give empiric antibiotics and indicated dexamethasone without delaying treatment for imaging when unsafe.
Cauda equina syndrome|Urinary retention, saddle anesthesia, or progressive bilateral deficits require emergency spinal MRI and surgical evaluation.
`, ["Explain how lesion localization uses weakness pattern, reflexes, sensory findings, and cranial nerves.", "Explain the time-critical diagnostic and treatment pathway for acute focal neurologic deficit."]),

    unit(8, "Hematology and oncology", `
Iron deficiency anemia|Microcytosis with low ferritin, increased iron-binding capacity, and elevated red-cell distribution width often reflects blood loss.
Anemia of chronic inflammation|Inflammatory hepcidin traps iron, causing low serum iron, low or normal binding capacity, and normal or high ferritin.
Hemolysis markers|Reticulocytosis, elevated LDH and unconjugated bilirubin, and reduced haptoglobin support red-cell destruction.
Disseminated intravascular coagulation|Systemic coagulation activation consumes platelets and factors, causing thrombosis and bleeding with elevated D-dimer.
Thrombotic thrombocytopenic purpura|Severe ADAMTS13 deficiency causes thrombocytopenia, microangiopathic hemolysis, and organ ischemia with usually normal coagulation tests.
Acute leukemia|Marrow replacement by blasts causes anemia, infection, bleeding, bone pain, and sometimes leukostasis.
Tumor suppressor gene|Loss of function removes a growth restraint; both alleles commonly must be inactivated at the cellular level.
Oncogene|Gain-of-function alteration promotes growth and acts dominantly at the cellular level.
`, `
Febrile neutropenia|Obtain cultures and give prompt empiric antipseudomonal antibiotics; do not wait for culture results.
Suspected TTP|Begin urgent plasma exchange and glucocorticoids when strongly suspected; platelet transfusion is generally avoided without life-threatening bleeding.
Venous thromboembolism treatment|Anticoagulate when safe, choose agent based on stability, organ function, cancer, pregnancy, and bleeding risk, and consider reperfusion for unstable PE.
Tumor lysis syndrome|Prevent or treat with hydration and urate-lowering therapy while urgently correcting dangerous potassium, phosphate, calcium, and kidney abnormalities.
Transfusion reaction|Stop the transfusion immediately, maintain IV access, verify identification, notify the blood bank, and evaluate the specific reaction.
`, ["Explain how MCV, reticulocytes, iron studies, and hemolysis markers narrow an anemia differential.", "Explain how to recognize and manage oncologic emergencies."]),

    unit(9, "Musculoskeletal, skin, and rheumatology", `
Osteoarthritis|Degenerative cartilage loss causes activity-related pain, brief morning stiffness, osteophytes, and asymmetric joint-space narrowing.
Rheumatoid arthritis|Autoimmune symmetric inflammatory polyarthritis causes prolonged morning stiffness, erosions, and systemic manifestations.
Gout|Monosodium urate crystals are needle-shaped and strongly negatively birefringent.
Pseudogout|Calcium pyrophosphate crystals are rhomboid-shaped and weakly positively birefringent.
Systemic lupus erythematosus|Immune-complex disease can affect skin, joints, blood, kidneys, nervous system, heart, and lungs.
Dermatomyositis|Inflammatory myopathy causes proximal weakness with findings such as heliotrope rash and Gottron papules.
Pemphigus vulgaris|Autoantibodies disrupt desmosomes, producing flaccid bullae and mucosal involvement.
Bullous pemphigoid|Autoantibodies target hemidesmosomes, producing tense bullae that usually spare mucosa.
`, `
Acute monoarthritis|Perform urgent arthrocentesis to exclude septic arthritis; send cell count, Gram stain, culture, and crystal analysis.
Suspected giant cell arteritis|Start high-dose glucocorticoids immediately when vision is threatened and arrange confirmatory evaluation without delaying treatment.
Compartment syndrome|Pain out of proportion and pain with passive stretch require urgent pressure assessment and surgical fasciotomy.
Necrotizing soft-tissue infection|Rapid pain, toxicity, bullae, or crepitus requires immediate surgical exploration plus broad antibiotics.
Melanoma evaluation|Use asymmetry, border, color, diameter, and evolution to identify concerning lesions; excisional biopsy establishes diagnosis and depth.
`, ["Explain how inflammatory and noninflammatory joint disease differ clinically and in synovial fluid.", "Explain how skin layer and immune target determine blister morphology."]),

    unit(10, "Reproductive, pregnancy, and pediatrics", `
Menstrual cycle|FSH recruits follicles, estrogen builds endometrium, the LH surge triggers ovulation, and progesterone stabilizes secretory endometrium.
Ectopic pregnancy|Implantation outside the uterine cavity causes pain and bleeding and may rupture with life-threatening intraperitoneal hemorrhage.
Preeclampsia|New hypertension after 20 weeks with proteinuria or end-organ dysfunction results from abnormal placentation and endothelial dysfunction.
Placental abruption|Painful bleeding, uterine tenderness, and fetal distress result from premature placental separation.
Placenta previa|Painless third-trimester bleeding arises from placenta over or near the cervical opening; digital examination is avoided until localization.
Turner syndrome|45,X causes short stature, gonadal dysgenesis, congenital heart disease, and possible neonatal lymphedema.
Down syndrome|Trisomy 21 is associated with characteristic features, intellectual disability, congenital heart disease, and increased leukemia and Alzheimer risk.
`, `
Ectopic pregnancy evaluation|Use pregnancy testing, quantitative hCG trends, and transvaginal ultrasound; instability or rupture requires urgent surgery.
Severe preeclampsia|Control severe blood pressure, give magnesium for seizure prevention, assess mother and fetus, and deliver when indicated.
Postpartum hemorrhage|Immediately assess uterine tone and trauma, provide uterotonics and resuscitation, and escalate to procedures or surgery when bleeding continues.
Febrile infant|Age, appearance, source, and risk stratification determine urine, blood, CSF testing and empiric antibiotics; young or ill infants need aggressive evaluation.
Developmental regression|Loss of attained milestones is always concerning and warrants prompt neurologic, metabolic, sensory, and psychosocial evaluation.
`, ["Explain a safe approach to first-trimester pain and bleeding.", "Explain how developmental milestones and growth patterns identify pediatric disease."]),

    unit(11, "Infectious disease", `
Gram-positive cocci in clusters|Staphylococci characteristically form clusters; coagulase helps distinguish S. aureus from common coagulase-negative species.
Gram-positive cocci in chains|Streptococci and enterococci commonly form chains or pairs and are separated by hemolysis and biochemical testing.
Encapsulated bacteria|Polysaccharide capsules inhibit phagocytosis; splenic function and opsonizing antibody are especially important for clearance.
Endotoxin|Gram-negative lipopolysaccharide activates innate immunity and can cause fever, vasodilation, capillary leak, and septic shock.
Exotoxin|Secreted bacterial protein produces specific cellular effects and may be converted into a vaccine toxoid.
HIV screening|Modern initial antigen-antibody testing detects p24 antigen and antibodies; supplemental differentiation and nucleic-acid testing resolve results.
Latent tuberculosis|Immune evidence of infection without symptoms, radiographic active disease, or contagious organisms.
`, `
Sepsis management|Recognize organ dysfunction, obtain cultures without major delay, give prompt antibiotics and fluids, measure perfusion, and use vasopressors when hypotension persists.
Empiric bacterial meningitis therapy|Cover likely organisms by age and risk, add ampicillin when Listeria risk is present, and use dexamethasone when indicated.
Needlestick exposure|Immediately wash the site, assess source and exposure, begin HIV prophylaxis promptly when indicated, and address hepatitis B and C follow-up.
C. difficile infection|Stop unnecessary antibiotics, confirm appropriate symptomatic testing, treat with recommended oral therapy, and use infection-control precautions.
Osteomyelitis evaluation|Use inflammatory markers, cultures, and MRI when appropriate; obtain bone culture when feasible and combine antimicrobial and surgical management as needed.
`, ["Explain how organism structure and virulence factors predict disease and treatment.", "Explain how to choose empiric antibiotics without losing opportunities for culture-directed therapy."]),

    unit(12, "Psychiatry, ethics, and patient safety", `
Major depressive episode|At least two weeks of depressed mood or anhedonia with associated neurovegetative, cognitive, or suicidal symptoms causing impairment.
Manic episode|At least one week of elevated or irritable mood with increased energy and characteristic symptoms, or any duration requiring hospitalization.
Delirium|Acute fluctuating disturbance of attention and awareness caused by a medical condition, substance, medication, or multiple factors.
Dementia|Chronic acquired cognitive decline that interferes with independence and is not occurring exclusively during delirium.
Decision-making capacity|Ability to communicate a choice, understand relevant information, appreciate consequences, and reason about options; it is decision-specific.
Informed consent|A patient with capacity voluntarily agrees after receiving understandable information about nature, benefits, risks, alternatives, and no treatment.
`, `
Suicidal patient assessment|Assess intent, plan, means, past attempts, substance use, supports, and protective factors; ensure immediate safety and appropriate level of care.
Agitated patient|Prioritize safety and verbal de-escalation, identify medical causes, and use medication or restraints only when necessary with monitoring.
Patient lacks capacity|Use an authorized surrogate guided first by the patient’s known wishes and values, then by best interests when wishes are unknown.
Medical error disclosure|Tell the patient what occurred and its known consequences honestly, apologize appropriately, address harm, and follow reporting and prevention procedures.
Breaking confidentiality|Disclosure without consent is limited to legally or ethically recognized situations such as imminent danger, abuse reporting, or certain public-health duties.
Root-cause analysis|A systems-focused review identifies contributing process failures and develops durable prevention strategies rather than assigning individual blame alone.
`, ["Explain how to assess capacity and select a surrogate decision-maker.", "Explain how to distinguish delirium, dementia, depression, mania, and psychosis in a clinical vignette."]),
  ];
})();
