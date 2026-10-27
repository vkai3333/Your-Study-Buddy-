(() => {
  const card = (id, front, back, courseLevel = "SL") => ({ id, front, back, courseLevel });
  const p1a = (id, prompt, answer, distractors, explanation, courseLevel = "SL") => ({
    id, type: "mcq", examPaper: "1A", prompt, answer, options: [answer, ...distractors], explanation,
    courseLevel, marks: 1, source: "Original IB-style practice aligned to the current IB Physics guide",
  });
  const p1b = (id, stimulus, prompt, answer, explanation, courseLevel = "SL", marks = 2) => ({
    id, type: "short_answer", examPaper: "1B", stimulus, prompt, answer, explanation,
    courseLevel, marks, source: "Original IB-style practice aligned to the current IB Physics guide",
  });
  const p2 = (id, prompt, answer, explanation, courseLevel = "SL", marks = 3, stimulus = "") => ({
    id, type: "short_answer", examPaper: "2", stimulus, prompt, answer, explanation,
    courseLevel, marks, source: "Original IB-style practice aligned to the current IB Physics guide",
  });
  const unit = (id, name, cards, questions) => ({
    id, name: `IB Physics · ${name}`, shortName: name, builtIn: true,
    sourceTitle: "IB Physics guide, first assessment 2025",
    sourceUrl: "https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/subject-guides/physics-guide.pdf",
    cards, questions,
    feynmanPrompts: [
      { id: `${id}-f1`, prompt: `Explain the central models in ${name} and state the limits of each model.` },
      { id: `${id}-f2`, prompt: `Design an investigation connected to ${name}, including variables, uncertainty, and data analysis.` },
    ],
  });

  window.IB_PHYSICS_DECKS = [
    unit("ibphysics-theme-a", "A. Space, time and motion", [
      card("ibpa-c1", "Gradient of a position–time graph", "Instantaneous velocity."),
      card("ibpa-c2", "Area under a force–time graph", "Impulse, equal to the change in momentum."),
      card("ibpa-c3", "Conditions for mechanical-energy conservation", "Only conservative forces transfer energy; no dissipative work changes the system's mechanical energy."),
      card("ibpa-c4", "Angular velocity", "Rate of angular displacement: ω = Δθ/Δt, measured in rad s⁻¹."),
      card("ibpa-c5", "Gravitational field strength", "Force per unit test mass: g = F/m; outside a spherical mass, g = GM/r²."),
      card("ibpa-c6", "Relativistic time dilation", "A moving clock is measured to run slow: Δt = γΔt₀.", "HL"),
    ], [
      p1a("ibpa-q1", "A car travels east at 12 m s⁻¹ and then west at 8 m s⁻¹. What is the magnitude of its change in velocity?", "20 m s⁻¹", ["4 m s⁻¹", "10 m s⁻¹", "96 m s⁻¹"], "Taking east as positive, Δv = −8 − 12 = −20 m s⁻¹."),
      p1a("ibpa-q2", "A constant resultant force acts on an object. Which quantity must change at a constant rate?", "Momentum", ["Kinetic energy", "Speed", "Displacement"], "Newton's second law in momentum form is F = dp/dt."),
      p1a("ibpa-q3", "A satellite moves in a circular orbit. Which statement is correct?", "Its velocity changes because its direction changes", ["Its acceleration is zero", "Its speed increases continuously", "No resultant force acts"], "Centripetal acceleration changes velocity direction even at constant speed."),
      p1a("ibpa-q4", "Two events are simultaneous in one inertial frame. According to special relativity, observers in another inertial frame", "may measure the events at different times", ["must also find them simultaneous", "must measure zero separation", "cannot assign times to either event"], "Simultaneity depends on reference frame.", "HL"),
      p1b("ibpa-q5", "A trolley's velocity changes from 0.40 m s⁻¹ at 0.0 s to 1.60 m s⁻¹ at 3.0 s. The velocity–time graph is a straight line.", "Determine the acceleration and displacement during the interval.", "a = 0.40 m s⁻²; displacement = average velocity × time = 1.00 × 3.0 = 3.0 m.", "Use the gradient for acceleration and the area under the graph for displacement."),
      p1b("ibpa-q6", "A student measures g five times: 9.72, 9.81, 9.77, 9.84 and 9.76 m s⁻². The accepted value is 9.81 m s⁻².", "Calculate the mean and comment on accuracy and precision.", "Mean = 9.78 m s⁻². The measurements are reasonably precise because their spread is small, and reasonably accurate because the mean is close to 9.81 m s⁻².", "Accuracy concerns closeness to the accepted value; precision concerns spread.", "SL", 3),
      p1b("ibpa-q7", "Orbital radius r / 10⁷ m: 1.0, 1.5, 2.0. Orbital speed v / km s⁻¹: 6.3, 5.1, 4.5.", "State the expected linear graph that tests v ∝ r⁻¹ᐟ² and identify its gradient meaning.", "Plot v against 1/√r. A straight line through the origin supports the model; the gradient is √(GM) with consistent units.", "Linearization tests the inverse-square gravitational model.", "HL", 3),
      p2("ibpa-q8", "A 0.20 kg ball moving at 14 m s⁻¹ strikes a wall normally and rebounds at 10 m s⁻¹. The contact time is 0.040 s. Determine the magnitude of the average force on the ball.", "Change in momentum magnitude = 0.20(14 + 10) = 4.8 kg m s⁻¹. Average force = 4.8/0.040 = 120 N.", "The rebound reverses velocity, so the momentum changes add in magnitude."),
      p2("ibpa-q9", "Explain why astronauts in an orbiting spacecraft appear weightless even though Earth's gravitational field is not zero.", "The spacecraft and astronauts share the same gravitational acceleration and continuously fall around Earth. With no supporting normal force between astronaut and craft, apparent weight is zero.", "Weightlessness in orbit is free fall, not absence of gravity.", "SL", 3),
    ]),

    unit("ibphysics-theme-b", "B. The particulate nature of matter", [
      card("ibpb-c1", "Internal energy", "The sum of random microscopic kinetic energy and intermolecular potential energy."),
      card("ibpb-c2", "First law of thermodynamics", "ΔU = Q + W, when W is work done on the system."),
      card("ibpb-c3", "Ideal-gas assumptions", "Point particles, negligible intermolecular forces except during elastic collisions, and random motion."),
      card("ibpb-c4", "Specific latent heat", "Energy per unit mass required for a phase change at constant temperature: Q = mL."),
      card("ibpb-c5", "Entropy", "A state function related to the number of accessible microscopic arrangements and energy dispersal.", "HL"),
      card("ibpb-c6", "Black-body spectrum", "An ideal thermal-emission spectrum determined only by absolute temperature.", "HL"),
    ], [
      p1a("ibpb-q1", "An ideal gas is heated at constant volume. Which quantity remains zero?", "Work done by the gas", ["Change in internal energy", "Energy transferred by heating", "Change in pressure"], "Boundary work is pΔV, and ΔV = 0."),
      p1a("ibpb-q2", "During melting at constant pressure, the temperature remains constant because supplied energy", "increases intermolecular potential energy", ["reduces total internal energy", "increases only translational kinetic energy", "leaves the substance as work only"], "Latent heat changes molecular arrangement rather than average kinetic energy."),
      p1a("ibpb-q3", "For a fixed mass of ideal gas, the kelvin temperature doubles while volume is constant. The pressure", "doubles", ["halves", "quadruples", "is unchanged"], "From pV = nRT, p ∝ T at fixed n and V."),
      p1a("ibpb-q4", "Which process produces a positive total entropy change?", "Spontaneous heat transfer from a hot object to a cold object", ["A perfectly reversible cycle", "Heat moving spontaneously from cold to hot", "An isolated system becoming more ordered without compensation"], "Natural irreversible heat transfer increases total entropy.", "HL"),
      p1b("ibpb-q5", "A 0.50 kg metal block receives 9.0 kJ. Its temperature rises from 20 °C to 50 °C.", "Determine the specific heat capacity of the metal.", "c = Q/(mΔT) = 9000/(0.50 × 30) = 600 J kg⁻¹ K⁻¹.", "Temperature differences have the same numerical value in kelvin and Celsius."),
      p1b("ibpb-q6", "For a fixed amount of gas: V / dm³ = 1.0, 1.5, 2.0, 2.5; p / kPa = 300, 200, 150, 120.", "Use the data to test Boyle's law.", "pV = 300 kPa dm³ for every pair, so p is inversely proportional to V within the precision shown.", "A constant product supports pV = constant."),
      p1b("ibpb-q7", "A star's emission peak is measured at 500 nm. A second star peaks at 400 nm.", "Compare their surface temperatures and calculate the ratio T₂/T₁.", "By Wien's law T ∝ 1/λ, so T₂/T₁ = 500/400 = 1.25; the second star is hotter.", "Shorter peak wavelength corresponds to higher temperature.", "HL", 2),
      p2("ibpb-q8", "A gas absorbs 450 J of energy and expands, doing 170 J of work on its surroundings. Determine its change in internal energy.", "Using ΔU = Q + W_on, W_on = −170 J, so ΔU = 450 − 170 = 280 J.", "State the sign convention before substitution."),
      p2("ibpb-q9", "Explain, using molecular ideas, why evaporation cools a liquid.", "The faster molecules are more likely to escape. Their departure lowers the mean kinetic energy of the remaining molecules, so the liquid's temperature falls unless energy is supplied.", "Temperature tracks mean random kinetic energy."),
    ]),

    unit("ibphysics-theme-c", "C. Wave behaviour", [
      card("ibpc-c1", "Wave speed", "v = fλ."),
      card("ibpc-c2", "Superposition", "When waves overlap, the resultant displacement is the algebraic sum of individual displacements."),
      card("ibpc-c3", "Double-slit fringe spacing", "s = λD/d for small angles."),
      card("ibpc-c4", "Standing-wave node", "A point of persistent zero displacement produced by destructive interference."),
      card("ibpc-c5", "Single-slit diffraction minimum", "a sin θ = nλ for non-zero integer n.", "HL"),
      card("ibpc-c6", "Doppler effect", "Observed frequency changes because of relative motion between source and observer."),
    ], [
      p1a("ibpc-q1", "A wave has period 0.25 s and wavelength 1.5 m. Its speed is", "6.0 m s⁻¹", ["0.375 m s⁻¹", "1.25 m s⁻¹", "24 m s⁻¹"], "f = 1/T = 4.0 Hz and v = fλ = 6.0 m s⁻¹."),
      p1a("ibpc-q2", "Two coherent waves arrive in phase with equal amplitude A. The resultant amplitude is", "2A", ["A", "A/2", "zero"], "In-phase displacements add constructively."),
      p1a("ibpc-q3", "Light passes from air into glass. Which quantity is unchanged?", "Frequency", ["Speed", "Wavelength", "Direction in every case"], "Frequency is fixed by the source; speed and wavelength change."),
      p1a("ibpc-q4", "The width of a single slit is reduced. The central diffraction maximum becomes", "wider", ["narrower", "unchanged", "zero intensity everywhere"], "Angular spread is inversely related to slit width.", "HL"),
      p1b("ibpc-q5", "In a double-slit experiment, λ = 600 nm, slit separation = 0.30 mm and screen distance = 2.0 m.", "Calculate the fringe spacing.", "s = λD/d = (600×10⁻⁹ × 2.0)/(0.30×10⁻³) = 4.0×10⁻³ m = 4.0 mm.", "Convert all quantities to SI units."),
      p1b("ibpc-q6", "A stationary wave on a string has adjacent nodes separated by 0.40 m. The driving frequency is 75 Hz.", "Determine the wavelength and wave speed.", "Node separation is λ/2, so λ = 0.80 m and v = fλ = 60 m s⁻¹.", "Adjacent nodes are half a wavelength apart."),
      p1b("ibpc-q7", "Measured intensity versus angle shows first minima at ±12°. The light wavelength is 520 nm.", "Estimate the slit width.", "For the first minimum, a sinθ = λ, so a = 520×10⁻⁹/sin12° ≈ 2.5×10⁻⁶ m.", "Use the first single-slit minimum condition.", "HL", 3),
      p2("ibpc-q8", "Explain how a standing wave forms in a pipe open at both ends and state the end conditions.", "A wave and its reflection superpose at the same frequency, producing fixed nodes and antinodes. Displacement antinodes occur at both open ends; allowed lengths satisfy L = nλ/2.", "Both open ends are displacement antinodes.", "SL", 4),
      p2("ibpc-q9", "An ambulance approaches a stationary observer. Explain why the observed sound frequency is higher than the emitted frequency.", "Successive wavefronts are emitted from progressively closer positions, reducing their spacing in front of the source. Since sound speed in the medium is essentially fixed, f = v/λ increases.", "The source motion compresses the wavelength ahead of it."),
    ]),

    unit("ibphysics-theme-d", "D. Fields", [
      card("ibpd-c1", "Field", "A physical quantity assigned to each point in space that determines the force on a suitable test object."),
      card("ibpd-c2", "Electric field strength", "Force per unit positive test charge: E = F/q."),
      card("ibpd-c3", "Electric potential", "Electric potential energy per unit charge: V = U/q."),
      card("ibpd-c4", "Magnetic force on a charge", "F = qvB sinθ."),
      card("ibpd-c5", "Gauss's law", "Electric flux through a closed surface equals enclosed charge divided by ε₀.", "HL"),
      card("ibpd-c6", "Electromagnetic induction", "An emf is induced when magnetic flux linkage changes: ε = −N dΦ/dt.", "HL"),
    ], [
      p1a("ibpd-q1", "At a point where electric potential is constant with position, the electric field is", "zero", ["maximum", "infinite", "necessarily directed upward"], "The electric field is the negative potential gradient."),
      p1a("ibpd-q2", "A positive charge moves parallel to a uniform magnetic field. The magnetic force is", "zero", ["qvB", "qvB/2", "opposite to the velocity"], "F = qvB sin0 = 0."),
      p1a("ibpd-q3", "The gravitational potential around an isolated spherical mass is", "negative and approaches zero at infinity", ["positive and increases without limit", "zero everywhere", "independent of distance"], "With zero chosen at infinity, work must be supplied to escape the attractive field."),
      p1a("ibpd-q4", "A changing magnetic flux through a coil induces an emf whose direction", "opposes the change producing it", ["always increases the original flux", "is independent of flux change", "is always clockwise"], "This is Lenz's law.", "HL"),
      p1b("ibpd-q5", "Two parallel plates have potential difference 600 V and separation 0.020 m.", "Determine the uniform electric field strength between the plates.", "E = V/d = 600/0.020 = 3.0×10⁴ V m⁻¹.", "For uniform parallel-plate fields, E = ΔV/d."),
      p1b("ibpd-q6", "A proton enters a 0.25 T magnetic field at 3.0×10⁶ m s⁻¹ perpendicular to the field.", "Calculate the magnetic force on the proton.", "F = qvB = 1.60×10⁻¹⁹ × 3.0×10⁶ × 0.25 = 1.2×10⁻¹³ N.", "The velocity is perpendicular, so sinθ = 1."),
      p1b("ibpd-q7", "Magnetic flux through a 200-turn coil falls uniformly from 4.0×10⁻⁴ Wb to zero in 0.020 s.", "Determine the magnitude of the induced emf.", "|ε| = N|ΔΦ/Δt| = 200(4.0×10⁻⁴/0.020) = 4.0 V.", "Use the rate of change of flux linkage.", "HL", 2),
      p2("ibpd-q8", "A small charged oil drop is stationary between horizontal plates. Draw or describe the forces and derive an expression for its charge magnitude.", "Weight mg acts downward and electric force qE upward. Equilibrium gives qE = mg, so |q| = mg/E = mgd/V. The sign depends on field direction.", "Resolve the force directions before using equilibrium.", "SL", 4),
      p2("ibpd-q9", "Explain why a transformer requires alternating current and why an ideal step-up transformer delivers a smaller secondary current.", "Alternating current creates changing flux and hence induced emf. For an ideal transformer, input and output power are equal, so increasing voltage requires decreasing current: VpIp = VsIs.", "Both induction and energy conservation are required.", "HL", 4),
    ]),

    unit("ibphysics-theme-e", "E. Nuclear and quantum physics", [
      card("ibpe-c1", "Photon energy", "E = hf = hc/λ."),
      card("ibpe-c2", "Photoelectric work function", "Minimum energy required to remove an electron from a material."),
      card("ibpe-c3", "Half-life", "Time for the number of undecayed nuclei or activity to fall to half its value."),
      card("ibpe-c4", "Mass defect", "Difference between constituent rest mass and bound-system mass; binding energy is Δmc²."),
      card("ibpe-c5", "de Broglie wavelength", "Matter wavelength λ = h/p.", "HL"),
      card("ibpe-c6", "Quantum tunnelling", "A particle has a non-zero probability of crossing a classically forbidden potential barrier.", "HL"),
    ], [
      p1a("ibpe-q1", "The frequency of light incident on a metal is increased above threshold while intensity is unchanged. The maximum photoelectron kinetic energy", "increases", ["decreases", "remains zero", "depends only on intensity"], "Kmax = hf − φ."),
      p1a("ibpe-q2", "After three half-lives, the fraction of undecayed nuclei is", "1/8", ["1/3", "1/6", "1/9"], "The remaining fraction is (1/2)³."),
      p1a("ibpe-q3", "Energy is released in nuclear fission because the products have", "greater binding energy per nucleon", ["more nucleons", "zero rest mass", "greater total rest mass"], "The more tightly bound products have less mass; the difference is released."),
      p1a("ibpe-q4", "If a particle's momentum doubles, its de Broglie wavelength", "halves", ["doubles", "quadruples", "is unchanged"], "λ = h/p.", "HL"),
      p1b("ibpe-q5", "A radioactive sample's count rate, after background correction, changes from 960 counts min⁻¹ to 120 counts min⁻¹ in 18 h.", "Determine the half-life.", "960 → 480 → 240 → 120 is three half-lives, so T½ = 18/3 = 6.0 h.", "Count repeated halvings after correcting for background."),
      p1b("ibpe-q6", "Light of wavelength 400 nm ejects electrons from a metal with work function 2.0 eV.", "Calculate the maximum kinetic energy in eV using hc = 1240 eV nm.", "Photon energy = 1240/400 = 3.10 eV; Kmax = 3.10 − 2.0 = 1.10 eV.", "Subtract the work function from photon energy."),
      p1b("ibpe-q7", "Electrons accelerated through a larger potential difference produce a diffraction pattern with smaller ring spacing.", "Explain the observation using the de Broglie relation.", "Greater accelerating voltage gives greater electron momentum. Since λ = h/p, wavelength decreases, producing smaller diffraction angles and ring spacing.", "Connect electrical energy to momentum and then wavelength.", "HL", 3),
      p2("ibpe-q8", "A nucleus has mass defect 0.030 u. Determine its binding energy in MeV using 1 u = 931.5 MeV/c².", "E = Δmc² = 0.030 × 931.5 = 27.9 MeV, approximately 28 MeV.", "The conversion already includes c²."),
      p2("ibpe-q9", "Describe two observations from the photoelectric effect that cannot be explained by a classical wave-only model.", "Emission occurs only above a threshold frequency, and electron maximum kinetic energy depends on frequency rather than intensity. Emission is also effectively immediate. These follow from photon energy E = hf.", "Any two correctly explained observations earn credit.", "SL", 4),
    ]),
  ];
})();
