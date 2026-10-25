(() => {
  const sources = {
    apphysics1: {
      title: "AP Physics 1: Algebra-Based Course and Exam Description, Effective Fall 2024",
      url: "https://apcentral.collegeboard.org/media/pdf/ap-physics-1-course-and-exam-description.pdf",
    },
    apphysics2: {
      title: "AP Physics 2: Algebra-Based Course and Exam Description, Effective Fall 2024",
      url: "https://apcentral.collegeboard.org/media/pdf/ap-physics-2-course-and-exam-description.pdf",
    },
    apphysicscmechanics: {
      title: "AP Physics C: Mechanics Course and Exam Description, Effective Fall 2024",
      url: "https://apcentral.collegeboard.org/pdf/ap-physics-c-mechanics-course-and-exam-description.pdf",
    },
    apphysicscem: {
      title: "AP Physics C: Electricity and Magnetism Course and Exam Description, Effective Fall 2024",
      url: "https://apcentral.collegeboard.org/media/pdf/ap-physics-c-electricity-and-magnetism-course-and-exam-description.pdf",
    },
  };

  const specs = {
    apphysics1: {
      global: "AP_PHYSICS_1_DECKS",
      name: "AP Physics 1",
      units: [
        [1, "Kinematics", [["1.1", "Scalars and Vectors in One Dimension"], ["1.2", "Displacement, Velocity, and Acceleration"], ["1.3", "Representing Motion"], ["1.4", "Reference Frames and Relative Motion"], ["1.5", "Vectors and Motion in Two Dimensions"]]],
        [2, "Force and Translational Dynamics", [["2.1", "Systems and Center of Mass"], ["2.2", "Forces and Free-Body Diagrams"], ["2.3", "Newton’s Third Law"], ["2.4", "Newton’s First Law"], ["2.5", "Newton’s Second Law"], ["2.6", "Gravitational Force"], ["2.7", "Kinetic and Static Friction"], ["2.8", "Spring Forces"], ["2.9", "Circular Motion"]]],
        [3, "Work, Energy, and Power", [["3.1", "Translational Kinetic Energy"], ["3.2", "Work"], ["3.3", "Potential Energy"], ["3.4", "Conservation of Energy"], ["3.5", "Power"]]],
        [4, "Linear Momentum", [["4.1", "Linear Momentum"], ["4.2", "Change in Momentum and Impulse"], ["4.3", "Conservation of Linear Momentum"], ["4.4", "Elastic and Inelastic Collisions"]]],
        [5, "Torque and Rotational Dynamics", [["5.1", "Rotational Kinematics"], ["5.2", "Connecting Linear and Rotational Motion"], ["5.3", "Torque"], ["5.4", "Rotational Inertia"], ["5.5", "Rotational Equilibrium and Newton’s First Law in Rotational Form"], ["5.6", "Newton’s Second Law in Rotational Form"]]],
        [6, "Energy and Momentum of Rotating Systems", [["6.1", "Rotational Kinetic Energy"], ["6.2", "Torque and Work"], ["6.3", "Angular Momentum and Angular Impulse"], ["6.4", "Conservation of Angular Momentum"], ["6.5", "Rolling"], ["6.6", "Motion of Orbiting Satellites"]]],
        [7, "Oscillations", [["7.1", "Defining Simple Harmonic Motion (SHM)"], ["7.2", "Frequency and Period of SHM"], ["7.3", "Representing and Analyzing SHM"], ["7.4", "Energy of Simple Harmonic Oscillators"]]],
        [8, "Fluids", [["8.1", "Internal Structure and Density"], ["8.2", "Pressure"], ["8.3", "Fluids and Newton’s Laws"], ["8.4", "Fluids and Conservation Laws"]]],
      ],
    },
    apphysics2: {
      global: "AP_PHYSICS_2_DECKS",
      name: "AP Physics 2",
      units: [
        [9, "Thermodynamics", [["9.1", "Kinetic Theory of Temperature and Pressure"], ["9.2", "The Ideal Gas Law"], ["9.3", "Thermal Energy Transfer and Equilibrium"], ["9.4", "The First Law of Thermodynamics"], ["9.5", "Specific Heat and Thermal Conductivity"], ["9.6", "Entropy and the Second Law of Thermodynamics"]]],
        [10, "Electric Force, Field, and Potential", [["10.1", "Electric Charge and Electric Force"], ["10.2", "Conservation of Electric Charge and the Process of Charging"], ["10.3", "Electric Fields"], ["10.4", "Electric Potential Energy"], ["10.5", "Electric Potential"], ["10.6", "Capacitors"], ["10.7", "Conservation of Electric Energy"]]],
        [11, "Electric Circuits", [["11.1", "Electric Current"], ["11.2", "Simple Circuits"], ["11.3", "Resistance, Resistivity, and Ohm’s Law"], ["11.4", "Electric Power"], ["11.5", "Compound Direct Current Circuits"], ["11.6", "Kirchhoff’s Loop Rule"], ["11.7", "Kirchhoff’s Junction Rule"], ["11.8", "Resistor-Capacitor (RC) Circuits"]]],
        [12, "Magnetism and Electromagnetism", [["12.1", "Magnetic Fields"], ["12.2", "Magnetism and Moving Charges"], ["12.3", "Magnetism and Current-Carrying Wires"], ["12.4", "Electromagnetic Induction and Faraday’s Law"]]],
        [13, "Geometric Optics", [["13.1", "Reflection"], ["13.2", "Images Formed by Mirrors"], ["13.3", "Refraction"], ["13.4", "Images Formed by Lenses"]]],
        [14, "Waves, Sound, and Physical Optics", [["14.1", "Properties of Wave Pulses and Waves"], ["14.2", "Periodic Waves"], ["14.3", "Boundary Behavior of Waves and Polarization"], ["14.4", "Electromagnetic Waves"], ["14.5", "The Doppler Effect"], ["14.6", "Wave Interference and Standing Waves"], ["14.7", "Diffraction"], ["14.8", "Double-Slit Interference and Diffraction Gratings"], ["14.9", "Thin-Film Interference"]]],
        [15, "Modern Physics", [["15.1", "Quantum Theory and Wave-Particle Duality"], ["15.2", "The Bohr Model of Atomic Structure"], ["15.3", "Emission and Absorption Spectra"], ["15.4", "Blackbody Radiation"], ["15.5", "The Photoelectric Effect"], ["15.6", "Compton Scattering"], ["15.7", "Fission, Fusion, and Nuclear Decay"], ["15.8", "Types of Radioactive Decay"]]],
      ],
    },
    apphysicscmechanics: {
      global: "AP_PHYSICS_C_MECHANICS_DECKS",
      name: "AP Physics C: Mechanics",
      units: [
        [1, "Kinematics", [["1.1", "Scalars and Vectors"], ["1.2", "Displacement, Velocity, and Acceleration"], ["1.3", "Representing Motion"], ["1.4", "Reference Frames and Relative Motion"], ["1.5", "Motion in Two or Three Dimensions"]]],
        [2, "Force and Translational Dynamics", [["2.1", "Systems and Center of Mass"], ["2.2", "Forces and Free-Body Diagrams"], ["2.3", "Newton’s Third Law"], ["2.4", "Newton’s First Law"], ["2.5", "Newton’s Second Law"], ["2.6", "Gravitational Force"], ["2.7", "Kinetic and Static Friction"], ["2.8", "Spring Forces"], ["2.9", "Resistive Forces"], ["2.10", "Circular Motion"]]],
        [3, "Work, Energy, and Power", [["3.1", "Translational Kinetic Energy"], ["3.2", "Work"], ["3.3", "Potential Energy"], ["3.4", "Conservation of Energy"], ["3.5", "Power"]]],
        [4, "Linear Momentum", [["4.1", "Linear Momentum"], ["4.2", "Change in Momentum and Impulse"], ["4.3", "Conservation of Linear Momentum"], ["4.4", "Elastic and Inelastic Collisions"]]],
        [5, "Torque and Rotational Dynamics", [["5.1", "Rotational Kinematics"], ["5.2", "Connecting Linear and Rotational Motion"], ["5.3", "Torque"], ["5.4", "Rotational Inertia"], ["5.5", "Rotational Equilibrium and Newton’s First Law in Rotational Form"], ["5.6", "Newton’s Second Law in Rotational Form"]]],
        [6, "Energy and Momentum of Rotating Systems", [["6.1", "Rotational Kinetic Energy"], ["6.2", "Torque and Work"], ["6.3", "Angular Momentum and Angular Impulse"], ["6.4", "Conservation of Angular Momentum"], ["6.5", "Rolling"], ["6.6", "Motion of Orbiting Satellites"]]],
        [7, "Oscillations", [["7.1", "Defining Simple Harmonic Motion (SHM)"], ["7.2", "Frequency and Period of SHM"], ["7.3", "Representing and Analyzing SHM"], ["7.4", "Energy of Simple Harmonic Oscillators"], ["7.5", "Simple and Physical Pendulums"]]],
      ],
    },
    apphysicscem: {
      global: "AP_PHYSICS_C_ELECTRICITY_MAGNETISM_DECKS",
      name: "AP Physics C: Electricity and Magnetism",
      units: [
        [8, "Electric Charges, Fields, and Gauss’s Law", [["8.1", "Electric Charge and Electric Force"], ["8.2", "Conservation of Electric Charge and the Process of Charging"], ["8.3", "Electric Fields"], ["8.4", "Electric Fields of Charge Distributions"], ["8.5", "Electric Flux"], ["8.6", "Gauss’s Law"]]],
        [9, "Electric Potential", [["9.1", "Electric Potential Energy"], ["9.2", "Electric Potential"], ["9.3", "Conservation of Electric Energy"]]],
        [10, "Conductors and Capacitors", [["10.1", "Electrostatics with Conductors"], ["10.2", "Redistribution of Charge Between Conductors"], ["10.3", "Capacitors"], ["10.4", "Dielectrics"]]],
        [11, "Electric Circuits", [["11.1", "Electric Current"], ["11.2", "Simple Circuits"], ["11.3", "Resistance, Resistivity, and Ohm’s Law"], ["11.4", "Electric Power"], ["11.5", "Compound Direct Current Circuits"], ["11.6", "Kirchhoff’s Loop Rule"], ["11.7", "Kirchhoff’s Junction Rule"], ["11.8", "Resistor-Capacitor (RC) Circuits"]]],
        [12, "Magnetic Fields and Electromagnetism", [["12.1", "Magnetic Fields"], ["12.2", "Magnetism and Moving Charges"], ["12.3", "Magnetic Fields of Current-Carrying Wires and the Biot-Savart Law"], ["12.4", "Ampère’s Law"]]],
        [13, "Electromagnetic Induction", [["13.1", "Magnetic Flux"], ["13.2", "Electromagnetic Induction"], ["13.3", "Induced Currents and Magnetic Forces"], ["13.4", "Inductance"], ["13.5", "Circuits with Resistors and Inductors (LR Circuits)"], ["13.6", "Circuits with Capacitors and Inductors (LC Circuits)"]]],
      ],
    },
  };

  // Profiles are matched to scientific content names, never to organizational unit labels.
  const profiles = [
    [/Scalars and Vectors/, "Scalars have magnitude only; vectors have magnitude and direction and combine component by component.", "Resolve vectors into signed components before adding them.", "A sign convention and coordinate axes must be declared consistently."],
    [/Displacement, Velocity, and Acceleration/, "Displacement is change in position, velocity is its time rate of change, and acceleration is the time rate of change of velocity.", "v_avg=Δx/Δt; a_avg=Δv/Δt; in calculus, v=dx/dt and a=dv/dt.", "Distinguish instantaneous quantities from averages over a finite interval."],
    [/Representing Motion/, "Position, velocity, and acceleration graphs encode motion through slopes and signed areas.", "The slope of x versus t is v; the slope of v versus t is a; area under v versus t is displacement.", "Graph slope and graph height represent different physical quantities."],
    [/Reference Frames and Relative Motion/, "Position and velocity are measured relative to a chosen reference frame.", "v_A/B=v_A/C−v_B/C for one-dimensional relative velocity.", "All velocities in a calculation must be expressed in compatible frames."],
    [/(Vectors and Motion in Two Dimensions|Motion in Two or Three Dimensions)/, "Independent vector components describe multidimensional motion; projectile components share the same time.", "For ideal projectiles, a_x=0 and a_y=−g while horizontal velocity remains constant.", "Neglect air resistance only when the model makes it reasonable."],
    [/Systems and Center of Mass/, "A system boundary determines which forces are internal; the center of mass is the mass-weighted average position.", "r_cm=(Σm_i r_i)/(Σm_i), or its integral form for a continuous body.", "Choose the system before labeling external force, energy transfer, or momentum change."],
    [/Forces and Free-Body Diagrams/, "A free-body diagram shows only forces exerted on the selected object or system.", "Add force vectors to obtain the net force; do not include forces exerted by the object on others.", "Every force must identify a real interaction and its direction."],
    [/Newton’s Third Law/, "Two interacting objects exert equal-magnitude, opposite-direction forces on each other.", "F_AonB=−F_BonA.", "Third-law partners act on different objects and therefore do not cancel on one free-body diagram."],
    [/Newton’s First Law/, "An object has constant velocity when the net external force on it is zero.", "ΣF=0 implies a=0, not necessarily v=0.", "An inertial frame is required for the usual form of Newton’s laws."],
    [/Newton’s Second Law(?! in Rotational)/, "Net external force determines the acceleration of a constant-mass system.", "ΣF=ma, applied separately along chosen coordinate axes.", "Use the net force, not one selected force, and keep vector directions consistent."],
    [/Gravitational Force/, "Every pair of masses attracts with an inverse-square force directed along their separation.", "F_g=Gm_1m_2/r²; near a planet’s surface weight is approximately mg.", "The inverse-square law uses center-to-center separation and treats bodies as pointlike or spherical."],
    [/Kinetic and Static Friction/, "Kinetic friction opposes sliding; static friction adjusts up to a maximum to prevent slipping.", "f_k=μ_kN and 0≤f_s≤μ_sN.", "Static friction is not automatically equal to μ_sN."],
    [/Spring Forces/, "An ideal spring exerts a restoring force proportional to displacement from equilibrium.", "F_s=−kx.", "Hooke’s law applies within the spring’s approximately linear elastic range."],
    [/Resistive Forces/, "Drag opposes relative motion through a medium and may depend on speed linearly or quadratically.", "A common model is F_d=−bv at low speed or F_d=−cv² in turbulent flow.", "Choose a drag model appropriate to the speed and flow regime."],
    [/Circular Motion/, "Circular motion requires inward centripetal acceleration supplied by the radial component of real forces.", "a_c=v²/r=ω²r and ΣF_radial=mv²/r.", "Centripetal force is not an extra force; identify the interactions providing the net radial force."],
    [/Translational Kinetic Energy/, "Translational kinetic energy depends on mass and the square of speed.", "K=½mv².", "Kinetic energy is scalar and depends on the chosen reference frame."],
    [/^Work$/, "Work is energy transferred by a force acting through displacement.", "W=∫F·dr; for a constant force, W=Fd cosθ.", "Only the force component parallel to displacement contributes to work."],
    [/Potential Energy/, "Potential energy belongs to a system and represents energy stored by conservative interactions.", "ΔU=−W_conservative; common forms include U_g=mgy, U_s=½kx², and U=−GMm/r.", "A reference level may shift U but cannot change physically meaningful energy differences."],
    [/Conservation of Energy/, "Energy changes form or crosses a system boundary, but total energy is conserved.", "ΔK+ΔU=E_transferred; mechanical energy is constant when no nonconservative transfer changes it.", "Include thermal or other internal energy when friction or deformation is present."],
    [/^Power$|Electric Power/, "Power is the rate at which energy is transferred or work is done.", "P=dE/dt; mechanically P=F·v, and electrically P=IV=I²R=V²/R.", "Average power and instantaneous power are not interchangeable."],
    [/^Linear Momentum$/, "Linear momentum is a vector equal to mass times velocity.", "p=mv; for a system, P=Σp_i.", "Momentum depends on reference frame and must be added vectorially."],
    [/Change in Momentum and Impulse/, "Impulse equals change in momentum and is the time integral of net force.", "J=Δp=∫F_net dt.", "Area under a force-time graph gives impulse, not work."],
    [/Conservation of Linear Momentum/, "Total momentum of a system stays constant when net external impulse is zero.", "P_i=P_f when J_external=0.", "Define the system so collision forces are internal before invoking conservation."],
    [/Elastic and Inelastic Collisions/, "Momentum is conserved in an isolated collision; kinetic energy is conserved only in an elastic collision.", "For perfectly inelastic motion, objects share a final velocity after sticking.", "Do not assume kinetic energy conservation merely because momentum is conserved."],
    [/Rotational Kinematics/, "Angular position, angular velocity, and angular acceleration describe rotation about an axis.", "ω=dθ/dt and α=dω/dt; constant-α equations parallel constant-acceleration kinematics.", "Angular quantities must use radians when connected to linear measures."],
    [/Connecting Linear and Rotational Motion/, "Points on a rigid body share angular motion while their linear speed and acceleration depend on radius.", "s=rθ, v_t=rω, a_t=rα, and a_c=rω².", "These relations use distance perpendicular to the rotation axis."],
    [/^Torque$/, "Torque measures the rotational effect of a force about a chosen axis.", "τ=r×F and |τ|=rF sinθ=Fℓ.", "Torque depends on the selected axis and on the perpendicular lever arm."],
    [/Rotational Inertia/, "Rotational inertia measures resistance to angular acceleration and depends on mass distribution about an axis.", "I=Σm_ir_i² or I=∫r²dm.", "The same object has different rotational inertia about different axes."],
    [/Rotational Equilibrium/, "Rotational equilibrium requires zero net torque and therefore constant angular velocity.", "Στ=0; complete static equilibrium also requires ΣF=0.", "Translational equilibrium does not by itself guarantee rotational equilibrium."],
    [/Newton’s Second Law in Rotational Form/, "Net external torque produces angular acceleration according to rotational inertia.", "Στ=Iα for a rigid body about a fixed axis.", "All torques and I must be evaluated about the same axis."],
    [/Rotational Kinetic Energy/, "A rigid body rotating about a fixed axis has kinetic energy set by rotational inertia and angular speed.", "K_rot=½Iω².", "For rolling objects, include both translational and rotational kinetic energy."],
    [/Torque and Work/, "A torque transfers energy when acting through angular displacement.", "W=∫τdθ and P=τω for a torque parallel to angular velocity.", "Use radians and the torque component about the chosen axis."],
    [/Angular Momentum and Angular Impulse/, "Angular momentum changes when an external torque acts over time.", "L=r×p; for fixed-axis rigid rotation L=Iω; ΔL=∫τ_extdt.", "Angular momentum and torque must be calculated about the same origin or axis."],
    [/Conservation of Angular Momentum/, "Angular momentum remains constant when the net external torque about the chosen axis is zero.", "L_i=L_f; for a changing rigid distribution, I_iω_i=I_fω_f.", "Internal forces can redistribute angular momentum but cannot change the system total."],
    [/^Rolling$/, "Rolling without slipping combines translation of the center of mass with rotation about it.", "v_cm=Rω and a_cm=Rα when there is no slipping.", "The no-slip constraint does not mean static friction must be nonzero."],
    [/Motion of Orbiting Satellites/, "Gravity supplies orbital acceleration while orbital energy and angular momentum constrain the path.", "For circular orbit v=√(GM/r), T²=4π²r³/(GM), and E=−GMm/(2r).", "Circular-orbit formulas cannot be applied at every point of an elliptical orbit."],
    [/Defining Simple Harmonic Motion/, "Simple harmonic motion occurs when acceleration is proportional and opposite to displacement.", "a=−ω²x; equivalently F=−kx for a mass-spring oscillator.", "The restoring relation must be approximately linear about stable equilibrium."],
    [/Frequency and Period of SHM/, "Period is time per cycle and frequency is cycles per second.", "T=1/f=2π/ω; for a spring T=2π√(m/k).", "Ideal SHM period is amplitude-independent only within the model’s range."],
    [/Representing and Analyzing SHM/, "Displacement, velocity, and acceleration in SHM are sinusoidal and phase-shifted.", "x=A cos(ωt+φ), v=−Aω sin(ωt+φ), and a=−ω²x.", "Initial conditions determine amplitude and phase; maxima of x and v occur at different times."],
    [/Energy of Simple Harmonic Oscillators/, "Ideal SHM exchanges kinetic and potential energy while total mechanical energy stays constant.", "E=½kA²=½mv²+½kx².", "The conservation model excludes dissipative forces unless their energy transfer is included."],
    [/Simple and Physical Pendulums/, "Small-angle pendulums execute approximate SHM; a physical pendulum’s mass distribution matters.", "T_simple=2π√(L/g); T_physical=2π√(I/(mgd)).", "The standard period expressions require small angular amplitude."],
    [/Internal Structure and Density/, "Density is mass per volume and reflects how matter is distributed within a substance.", "ρ=m/V.", "Uniform-density assumptions should be checked before using one density for an entire object."],
    [/^Pressure$/, "Pressure is perpendicular force per area and in a static fluid rises with depth.", "P=F_perp/A and ΔP=ρgΔh.", "Use absolute or gauge pressure consistently and compare points in a connected static fluid."],
    [/Fluids and Newton’s Laws/, "Fluid forces include pressure forces and buoyancy; equilibrium or acceleration follows Newton’s laws.", "F_B=ρ_fluid gV_displaced.", "Buoyant force depends on displaced fluid, not directly on the object’s mass."],
    [/Fluids and Conservation Laws/, "Steady ideal-fluid flow obeys mass continuity and mechanical-energy conservation along a streamline.", "A_1v_1=A_2v_2 and P+½ρv²+ρgy=constant.", "Bernoulli’s equation assumes steady, incompressible, nonviscous flow along a streamline."],
    [/Kinetic Theory of Temperature and Pressure/, "Gas pressure results from particle collisions, while absolute temperature tracks average molecular kinetic energy.", "For a monatomic ideal gas, average translational kinetic energy is 3k_BT/2 and v_rms=√(3RT/M).", "Use absolute temperature and distinguish molecular mass from molar mass."],
    [/The Ideal Gas Law/, "An ideal gas links pressure, volume, amount, and absolute temperature through a simple state equation.", "PV=nRT=Nk_BT.", "The ideal-gas model works best for dilute gases far from condensation."],
    [/Thermal Energy Transfer and Equilibrium/, "Heat transfers because of temperature difference until interacting systems reach thermal equilibrium.", "For isolated calorimetry, ΣQ=0.", "Include every exchanging object and phase change inside the chosen thermal system."],
    [/The First Law of Thermodynamics/, "The first law relates internal-energy change to heating and work done on or by a system.", "Using work done by the gas, ΔU=Q−W_by.", "State the work sign convention before applying the first law."],
    [/Specific Heat and Thermal Conductivity/, "Specific heat controls temperature change during heating; conductivity controls the rate of heat flow through matter.", "Q=mcΔT and P_conduction=kAΔT/L for a uniform slab.", "The simple conduction relation assumes steady flow and approximately constant material properties."],
    [/Entropy and the Second Law of Thermodynamics/, "Entropy measures energy dispersal and the number of accessible microscopic arrangements; isolated-system entropy does not decrease.", "For a reversible transfer, ΔS=∫dQ_rev/T; ΔS_universe≥0.", "Entropy change must include the full system and surroundings when testing spontaneity."],
    [/Electric Charge and Electric Force/, "Electric charge is conserved and quantized; point charges exert inverse-square forces along their separation.", "F=(1/4πε)q_1q_2/r², with direction set by charge signs.", "Superpose force vectors and use a permittivity appropriate to the medium."],
    [/Conservation of Electric Charge and the Process of Charging/, "Charging redistributes electrons while the total charge of an isolated system stays constant.", "Σq_initial=Σq_final and q=ne.", "Grounding allows charge transfer across the selected system boundary."],
    [/^Electric Fields$/, "Electric field is force per positive test charge and superposes vectorially.", "E=F/q_test; for a point charge E=(1/4πε)q/r².", "The test charge must be small enough not to rearrange the source charges."],
    [/Electric Fields of Charge Distributions/, "A continuous charge distribution produces a field found by integrating the contributions of differential charge elements.", "dE=(1/4πε_0)dq r_hat/r² and E=∫dE.", "Exploit symmetry before integrating and keep vector components that do not cancel."],
    [/Electric Flux/, "Electric flux measures the electric field passing through an oriented surface.", "Φ_E=∫E·dA; for a uniform field and flat area, Φ_E=EA cosθ.", "The angle is measured between the field and the area vector, not the surface itself."],
    [/Gauss’s Law/, "The net electric flux through a closed surface equals enclosed charge divided by permittivity.", "∮E·dA=Q_enclosed/ε_0.", "Gauss’s law always holds, but it directly finds E only when symmetry makes the flux integral simple."],
    [/Electric Potential Energy/, "Electric potential energy belongs to a charge configuration and changes oppositely to work by the electric force.", "For two point charges, U=(1/4πε)q_1q_2/r and ΔU=−W_electric.", "Potential energy depends on the chosen zero and includes every interacting pair once."],
    [/^Electric Potential$/, "Electric potential is potential energy per unit charge and is a scalar field.", "V=U/q; ΔV=−∫E·dl; for a point charge V=(1/4πε)q/r.", "Add potentials algebraically and distinguish potential from potential energy."],
    [/Capacitors/, "A capacitor stores separated charge and electric-field energy for a potential difference.", "C=Q/ΔV; parallel plates give C=εA/d; U_C=½C(ΔV)².", "Whether charge or voltage stays constant depends on whether a battery remains connected."],
    [/Conservation of Electric Energy/, "Electric potential energy, kinetic energy, and externally transferred energy balance within a chosen system.", "ΔK+ΔU_electric=W_external.", "Include source or battery energy when it is part of the physical process."],
    [/Electrostatics with Conductors/, "At electrostatic equilibrium a conductor has zero internal electric field, constant potential, and excess charge on its surface.", "E_inside=0 and the field just outside is perpendicular to the surface.", "These results require electrostatic equilibrium, not a conductor carrying a steady current."],
    [/Redistribution of Charge Between Conductors/, "Connected conductors exchange charge until they reach a common electric potential.", "At equilibrium V_1=V_2; for isolated spheres kQ_1/R_1=kQ_2/R_2.", "Conserve total charge and use the final equal-potential condition."],
    [/Dielectrics/, "A dielectric polarizes in an electric field, reducing the internal field and increasing capacitance.", "C=κC_0 and ε=κε_0.", "Battery-connected and isolated capacitors respond differently when a dielectric is inserted."],
    [/Electric Current/, "Electric current is the rate of net charge flow through a cross section.", "I=dQ/dt=nqAv_d for uniform carrier density and drift speed.", "Conventional current points in the direction positive charge would move."],
    [/Simple Circuits/, "Ideal wires connect equipotential nodes, and series or parallel structure determines current and voltage relationships.", "Series resistances add; parallel conductances add.", "Identify nodes and branches before labeling components as series or parallel."],
    [/Resistance, Resistivity, and Ohm’s Law/, "Resistance relates voltage to current; resistivity is a material property that also depends on temperature.", "V=IR and R=ρL/A for a uniform conductor.", "Ohm’s law applies to ohmic behavior under approximately constant physical conditions."],
    [/Compound Direct Current Circuits/, "Multi-loop DC circuits require consistent node voltages, branch currents, and equivalent-resistance reasoning.", "Reduce genuine series and parallel groups before applying Kirchhoff’s rules to the remaining network.", "Components are in series only if they carry the same current with no intervening branch."],
    [/Kirchhoff’s Loop Rule/, "The algebraic sum of potential changes around any closed circuit loop is zero.", "ΣΔV_loop=0.", "Choose a loop direction and keep resistor and source signs consistent with current directions."],
    [/Kirchhoff’s Junction Rule/, "Charge conservation requires current entering a junction to equal current leaving it.", "ΣI_in=ΣI_out.", "A negative solved current means the actual direction is opposite the assumed arrow."],
    [/Resistor-Capacitor \(RC\) Circuits/, "An RC circuit charges or discharges exponentially with time constant RC.", "During discharge Q=Q_0e^(−t/RC); during charging Q=Cε(1−e^(−t/RC)).", "Initial and long-time circuit behavior provide essential checks on exponential solutions."],
    [/^Magnetic Fields$|Magnetic Fields and Electromagnetism/, "Magnetic fields are produced by moving charge and exert forces on moving charges and magnetic dipoles.", "Field direction follows right-hand rules; magnetic field lines form closed loops.", "A magnetic field alone does no work on an ideal point charge."],
    [/Magnetism and Moving Charges/, "A magnetic field exerts a velocity-dependent force perpendicular to both velocity and field.", "F_B=qv×B and |F_B|=|q|vB sinθ.", "Reverse the right-hand-rule direction for a negative charge."],
    [/Magnetism and Current-Carrying Wires/, "A current-carrying wire in a magnetic field experiences a force from its moving charges.", "F=IL×B; for a straight perpendicular segment, F=ILB.", "Use the current direction and the wire length within the field."],
    [/Magnetic Fields of Current-Carrying Wires and the Biot-Savart Law/, "The Biot-Savart law adds differential magnetic-field contributions from current elements.", "dB=(μ_0/4π)I dℓ×r_hat/r².", "Integrate vector components and use symmetry to identify cancellations."],
    [/Ampère’s Law/, "The circulation of magnetic field around a closed path is set by the enclosed current.", "∮B·dℓ=μ_0I_enclosed for steady currents.", "Ampère’s law directly finds B only when symmetry makes B constant or perpendicular terms vanish."],
    [/Electromagnetic Induction and Faraday’s Law|^Electromagnetic Induction$/, "Changing magnetic flux induces an emf whose direction opposes the flux change.", "ε=−dΦ_B/dt; for N turns, ε=−N dΦ_B/dt.", "Flux can change through field strength, area, or orientation; the minus sign encodes Lenz’s law."],
    [/^Magnetic Flux$/, "Magnetic flux measures magnetic field through an oriented surface.", "Φ_B=∫B·dA; for a uniform field Φ_B=BA cosθ.", "Measure θ from the surface normal and distinguish flux from field magnitude."],
    [/Induced Currents and Magnetic Forces/, "An induced current creates magnetic effects that oppose the change producing it and can create drag or restoring forces.", "I_induced=ε/R together with Lenz’s law determines magnitude and direction.", "Opposition is to the change in flux, not necessarily to the external field itself."],
    [/^Inductance$/, "An inductor stores magnetic energy and produces a self-induced emf that opposes changes in current.", "ε_L=−L dI/dt and U_L=½LI².", "Current through an ideal inductor cannot change instantaneously."],
    [/Circuits with Resistors and Inductors/, "An LR circuit’s current changes exponentially with time constant L/R.", "For current growth I=(ε/R)(1−e^(−tR/L)); for decay I=I_0e^(−tR/L).", "Check the initial-current continuity and the long-time steady-current limit."],
    [/Circuits with Capacitors and Inductors/, "An ideal LC circuit exchanges energy between capacitor electric field and inductor magnetic field.", "ω=1/√(LC) and U=Q²/(2C)+½LI².", "The ideal model neglects resistance; real circuits exhibit damping."],
    [/^Reflection$/, "Reflection redirects a wave so the angle of reflection equals the angle of incidence.", "θ_i=θ_r, measured from the normal.", "Angles must be measured relative to the surface normal."],
    [/Images Formed by Mirrors/, "Mirrors form images according to geometry, focal length, and sign conventions.", "1/f=1/d_o+1/d_i and m=h_i/h_o=−d_i/d_o.", "Use a consistent sign convention and distinguish real from virtual images."],
    [/^Refraction$/, "Refraction occurs because wave speed changes across a boundary while frequency remains constant.", "n_1 sinθ_1=n_2 sinθ_2 and n=c/v.", "Snell’s-law angles are measured from the normal; total internal reflection requires travel toward lower n."],
    [/Images Formed by Lenses/, "Thin lenses form images according to focal length and object position.", "1/f=1/d_o+1/d_i and m=−d_i/d_o.", "Use ray diagrams to check algebraic sign and image orientation."],
    [/Properties of Wave Pulses and Waves/, "A wave transports energy and momentum without net transport of the medium over a cycle.", "Pulse speed depends on medium properties; for a string v=√(T/μ).", "Separate wave propagation direction from particle-motion direction."],
    [/Periodic Waves/, "A periodic wave repeats with frequency, period, wavelength, and speed related by one cycle per wavelength.", "v=fλ and T=1/f.", "Frequency is set by the source while wave speed is set primarily by the medium."],
    [/Boundary Behavior of Waves and Polarization/, "At a boundary waves may reflect, transmit, invert, or change speed; polarization identifies transverse behavior.", "String pulses invert on reflection from a fixed end but not from an ideal free end.", "Only transverse waves can be linearly polarized."],
    [/Electromagnetic Waves/, "Electromagnetic waves are coupled oscillating electric and magnetic fields that travel at light speed in vacuum.", "c=fλ and E/B=c in vacuum.", "Frequency remains constant when light enters a new medium while speed and wavelength change."],
    [/The Doppler Effect/, "Relative radial motion between a source and observer changes the observed frequency.", "For sound, f_observed=f_source(v±v_o)/(v∓v_s), with signs chosen from approach or separation.", "Use motion relative to the medium for sound and determine whether separation is increasing or decreasing."],
    [/Wave Interference and Standing Waves/, "Superposition produces constructive or destructive interference; standing waves have fixed nodes and antinodes.", "For a string fixed at both ends, f_n=nv/(2L).", "Boundary conditions determine the allowed wavelengths and harmonics."],
    [/^Diffraction$/, "Diffraction is wave spreading through an opening or around an obstacle and is strongest when sizes are comparable to wavelength.", "For a single slit, minima satisfy a sinθ=mλ for nonzero integer m.", "Do not confuse single-slit minima with double-slit bright-fringe conditions."],
    [/Double-Slit Interference and Diffraction Gratings/, "Path difference creates regularly spaced interference maxima for coherent sources.", "Bright fringes satisfy d sinθ=mλ.", "The small-angle screen formula requires the screen distance to be much larger than fringe spacing."],
    [/Thin-Film Interference/, "Reflections from a thin film interfere according to path difference and possible phase reversals.", "At normal incidence the path difference is 2nt, adjusted for π phase shifts on reflection.", "Count phase reversals at each boundary before selecting constructive or destructive conditions."],
    [/Quantum Theory and Wave-Particle Duality/, "Light and matter exhibit both wave-like and particle-like behavior with quantized energy and momentum.", "E=hf=hc/λ and λ_deBroglie=h/p.", "Classical models fail when wavelength or energy quantization is comparable to the system scale."],
    [/The Bohr Model of Atomic Structure/, "The Bohr model assigns discrete energies and angular momenta to hydrogen-like electron states.", "For hydrogen E_n=−13.6 eV/n² and photon energy equals |ΔE|.", "The simple Bohr energy formula applies directly only to hydrogen-like atoms."],
    [/Emission and Absorption Spectra/, "Atoms emit or absorb photons whose energies match differences between allowed energy levels.", "hf=|E_f−E_i|.", "Emission moves to lower energy; absorption requires an available higher state and matching photon energy."],
    [/Blackbody Radiation/, "A blackbody’s thermal spectrum shifts to shorter wavelength and greater total intensity as temperature rises.", "λ_maxT=b and P/A=σT⁴.", "Temperature must be in kelvins and emissivity matters for nonideal emitters."],
    [/The Photoelectric Effect/, "Electrons are emitted when photon energy exceeds a material’s work function; frequency controls maximum kinetic energy.", "K_max=hf−φ and eV_stop=K_max.", "Increasing intensity below threshold frequency does not eject electrons."],
    [/Compton Scattering/, "Photon-electron scattering changes photon wavelength and demonstrates photon momentum.", "Δλ=(h/m_ec)(1−cosθ) and p_photon=h/λ.", "Apply both energy and momentum conservation; the shift depends on scattering angle."],
    [/Fission, Fusion, and Nuclear Decay/, "Nuclear reactions release energy when products have greater binding energy per nucleon and less total mass.", "Q=(m_initial−m_final)c².", "Conserve charge, nucleon number, energy, and momentum in every reaction."],
    [/Types of Radioactive Decay/, "Alpha, beta, and gamma processes change nuclei in characteristic ways while obeying conservation laws.", "N=N_0e^(−λt) and T_1/2=ln2/λ.", "Identify daughter nuclei by conserving mass number and atomic number."],
  ];

  const findProfile = (title) => {
    const match = profiles.find(([pattern]) => pattern.test(title));
    if (match) return { summary: match[1], relation: match[2], limit: match[3], matched: true };
    return {
      summary: `${title} connects physical models, measurable quantities, and evidence used to predict a system’s behavior.`,
      relation: `Represent ${title.toLowerCase()} with an appropriate diagram, graph, or symbolic relationship before calculating.`,
      limit: "State the system boundary, assumptions, sign convention, and range over which the selected model applies.",
      matched: false,
    };
  };

  const unique = (values) => [...new Set(values.filter(Boolean))];
  const rotateChoices = (answer, distractors, seed) => {
    const choices = unique([answer, ...distractors]).slice(0, 4);
    while (choices.length < 4) choices.push(["Not enough information is needed", "The quantity must always be zero", "Only the object’s mass matters"][choices.length - 1] || "No physical model applies");
    const offset = [...String(seed)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % choices.length;
    return [...choices.slice(offset), ...choices.slice(0, offset)];
  };

  const topicDepth = (title) => {
    if (/(Conservation|Compound Direct Current Circuits|Kirchhoff|RC Circuits|LR Circuits|LC Circuits|Electric Fields of Charge Distributions|Gauss’s Law|Electromagnetic Induction|Collisions|Motion in Two or Three Dimensions|Motion of Orbiting Satellites|Vectors and Motion in Two Dimensions|Representing and Analyzing|Rotational Dynamics|Interference|Photoelectric Effect|Thermodynamics)/.test(title)) return "extended";
    if (/^(Scalars and Vectors(?: in One Dimension)?|Newton’s Third Law|Newton’s First Law|Translational Kinetic Energy|Linear Momentum|Rotational Kinetic Energy|Power|Electric Current|Reflection|Refraction|Periodic Waves|Electromagnetic Waves|Magnetic Flux)$/.test(title)) return "focused";
    return "standard";
  };

  const physicsDiagrams = {
    atwood: {
      image: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Atwood_machine.svg",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Atwood_machine.svg",
      imageCredit: "Indolences / Wikimedia Commons / public domain",
      imageAlt: "Atwood machine with two masses connected over a pulley",
    },
    incline: {
      image: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Free_body_diagram_1.svg",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Free_body_diagram_1.svg",
      imageCredit: "Wikimedia Commons",
      imageAlt: "Free-body diagram of a block on an inclined plane",
    },
    circuits: {
      image: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Series_and_parallel_circuits.svg",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Series_and_parallel_circuits.svg",
      imageCredit: "Theresa Knott / Wikimedia Commons",
      imageAlt: "Comparison of series and parallel electrical circuits",
    },
    lens: {
      image: "https://upload.wikimedia.org/wikipedia/commons/b/bb/Convex_lens_-_converging_light_rays.png",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Convex_lens_-_converging_light_rays.png",
      imageCredit: "Wikimedia Commons",
      imageAlt: "Converging light rays passing through a convex lens",
    },
  };

  const numericQuestion = (prompt, answer, options, difficulty = "Medium", stimulus = "") => ({
    type: "mcq", prompt, answer, options: unique([answer, ...options]).slice(0, 4), difficulty, ...(stimulus ? { stimulus } : {}),
  });

  const authenticProblemSet = (title, courseId) => {
    if (/(Scalars and Vectors|Displacement, Velocity|Representing Motion|Reference Frames|Motion in Two|Vectors and Motion)/.test(title)) return { category: "kinematics", questions: [
      numericQuestion("A runner moves 120 m east in 10 s. What is the runner’s average velocity?", "12 m/s east", ["1.2 m/s east", "12 m/s west", "1,200 m/s east"], "Easy"),
      numericQuestion("A car’s velocity increases uniformly from 5 m/s to 25 m/s in 4 s. What is its acceleration?", "5 m/s²", ["4 m/s²", "6.25 m/s²", "20 m/s²"]),
      numericQuestion("A ball is launched horizontally at 20 m/s and remains airborne for 2.0 s. Neglecting air resistance, how far does it travel horizontally?", "40 m", ["10 m", "20 m", "80 m"]),
      numericQuestion("Car A travels east at 30 m/s while Car B travels east at 20 m/s. What is A’s velocity relative to B?", "10 m/s east", ["10 m/s west", "20 m/s east", "50 m/s east"], "Hard"),
    ] };
    if (/Systems and Center of Mass/.test(title)) {
      const questions = [
        numericQuestion("A 2.0 kg mass is at x = 0 m and a 3.0 kg mass is at x = 4.0 m. Where is their center of mass?", "2.4 m", ["1.6 m", "2.0 m", "3.0 m"], "Easy"),
        numericQuestion("Two skaters initially at rest push apart. A 50 kg skater moves left at 3 m/s. What velocity must a 75 kg skater have?", "2 m/s right", ["2 m/s left", "4.5 m/s right", "4.5 m/s left"]),
        numericQuestion("A 1 kg cart at x = 2 m is added to a 3 kg cart at x = 6 m. What is the two-cart center-of-mass position?", "5 m", ["3 m", "4 m", "8 m"]),
        numericQuestion("An isolated system’s center of mass moves at 4 m/s. Internal forces act for 3 s. What is its final center-of-mass velocity?", "4 m/s", ["0 m/s", "7 m/s", "12 m/s"], "Hard"),
      ];
      if (courseId === "apphysicscmechanics") {
        questions.push(
          { ...numericQuestion("A thin rod extends from x = 0 to x = L and has linear density λ(x) = λ₀(1 + x/L). Using x_cm = (∫xλ dx)/(∫λ dx), where is its center of mass?", "5L/9", ["L/2", "2L/3", "3L/4"], "Hard", "An engineering team models an antenna boom whose material becomes progressively denser toward its outer end."), type: "stimulus_mcq" },
          { ...numericQuestion("A thin rod extends from x = 0 to x = L with linear density λ(x) = kx². Using x_cm = (∫₀ᴸxλ(x)dx)/(∫₀ᴸλ(x)dx), what is the x-coordinate of its center of mass?", "3L/4", ["L/3", "L/2", "2L/3"], "Hard", "A student must determine the balance point of a nonuniform rod by treating each infinitesimal segment as dm = λ(x)dx."), type: "stimulus_mcq" },
        );
      }
      return { category: "center-of-mass", questions };
    }
    if (/(Forces and Free-Body|Newton’s|Gravitational Force|Friction|Spring Forces|Circular Motion|Resistive Forces)/.test(title)) {
      const questions = [
        numericQuestion("A 4.0 kg object has a net horizontal force of 12 N. What is its acceleration?", "3.0 m/s²", ["0.33 m/s²", "8.0 m/s²", "48 m/s²"], "Easy"),
        numericQuestion("A 10 kg block slides on a level surface with coefficient of kinetic friction 0.20. Using g = 9.8 m/s², what is the friction magnitude?", "19.6 N", ["2.0 N", "49 N", "98 N"]),
        numericQuestion("A spring with k = 200 N/m is stretched 0.050 m. What restoring-force magnitude does it exert?", "10 N", ["2.5 N", "40 N", "4,000 N"]),
        numericQuestion("A 2.0 kg object moves at 6.0 m/s in a circle of radius 3.0 m. What net inward force is required?", "24 N", ["4 N", "12 N", "72 N"], "Hard"),
      ];
      if (/Forces and Free-Body/.test(title)) questions.push({ ...numericQuestion("The diagram represents an ideal Atwood machine with masses 2.0 kg and 5.0 kg. What is the magnitude of the acceleration? Use g = 9.8 m/s².", "4.2 m/s²", ["1.4 m/s²", "6.9 m/s²", "9.8 m/s²"], "Hard", "Two hanging laboratory masses are connected by a light string over a low-friction pulley and released from rest."), ...physicsDiagrams.atwood, type: "stimulus_mcq" });
      if (/Kinetic and Static Friction/.test(title)) questions.push({ ...numericQuestion("A block slides down the 30° incline represented in the diagram. If the coefficient of kinetic friction is 0.20, what is its acceleration? Use g = 9.8 m/s².", "About 3.2 m/s²", ["About 1.7 m/s²", "About 4.9 m/s²", "About 6.6 m/s²"], "Hard", "A student releases a block from rest on a rough ramp and models the block as a particle."), ...physicsDiagrams.incline, type: "stimulus_mcq" });
      return { category: "dynamics", questions };
    }
    if (/(Linear Momentum|Impulse|Collisions)/.test(title)) return { category: "momentum", questions: [
      numericQuestion("What is the momentum of a 3.0 kg cart moving east at 4.0 m/s?", "12 kg·m/s east", ["0.75 kg·m/s east", "7 kg·m/s east", "12 kg·m/s west"], "Easy"),
      numericQuestion("A constant 10 N force acts on a ball for 0.20 s. What impulse does the ball receive?", "2.0 N·s", ["0.020 N·s", "10.2 N·s", "50 N·s"]),
      numericQuestion("A 2.0 kg cart moving at 6.0 m/s sticks to a stationary 1.0 kg cart. What is their common speed?", "4.0 m/s", ["2.0 m/s", "3.0 m/s", "6.0 m/s"]),
      numericQuestion("A 0.15 kg ball reverses from +20 m/s to −10 m/s. What is its change in momentum?", "−4.5 kg·m/s", ["−1.5 kg·m/s", "+1.5 kg·m/s", "+4.5 kg·m/s"], "Hard"),
    ] };
    if (/Motion of Orbiting Satellites|Gravitational/.test(title)) return { category: "orbits", questions: [
      numericQuestion("A satellite travels in a circular orbit of radius 7.0 × 10⁶ m at 7.0 × 10³ m/s. Approximately how long is one orbit?", "6.3 × 10³ s", ["1.0 × 10³ s", "4.9 × 10³ s", "4.4 × 10⁴ s"]),
      numericQuestion("At an orbital radius where the gravitational acceleration is 8.0 m/s², what circular speed is required if the radius is 8.0 × 10⁶ m?", "8.0 × 10³ m/s", ["1.0 × 10³ m/s", "4.0 × 10³ m/s", "6.4 × 10⁷ m/s"]),
      numericQuestion("A satellite moves from a circular orbit of radius r to one of radius 4r. How does its circular speed change?", "It becomes one-half as large", ["It doubles", "It becomes one-fourth as large", "It is unchanged"]),
      numericQuestion("A satellite’s orbital radius doubles. By what factor does its period change?", "2√2", ["√2", "2", "4"], "Hard"),
    ] };
    if (/Torque and Work/.test(title)) return { category: "torque-work", questions: [
      numericQuestion("A constant torque of 12 N·m turns a shaft through 3.0 rad. How much work does the torque do?", "36 J", ["4 J", "15 J", "108 J"], "Easy"),
      numericQuestion("A motor supplies a torque of 8.0 N·m while rotating at 5.0 rad/s. What mechanical power does it deliver?", "40 W", ["1.6 W", "13 W", "64 W"]),
      numericQuestion("A 20 N force acts perpendicular to a 0.30 m wrench and turns it through 2.0 rad. How much work is done?", "12 J", ["3 J", "6 J", "40 J"]),
      numericQuestion("Torque increases linearly from 0 to 10 N·m while a wheel turns through 4.0 rad. What work is done?", "20 J", ["10 J", "40 J", "80 J"], "Hard"),
    ] };
    if (/(Rotational|Torque|Angular Momentum|Rolling|Connecting Linear and Rotational)/.test(title)) return { category: "rotation", questions: [
      numericQuestion("A point on the rim of a wheel of radius 0.50 m rotates at 8.0 rad/s. What is its tangential speed?", "4.0 m/s", ["0.063 m/s", "8.5 m/s", "16 m/s"], "Easy"),
      numericQuestion("A 15 N force acts perpendicular to a lever arm 0.40 m long. What torque magnitude is produced?", "6.0 N·m", ["0.375 N·m", "15.4 N·m", "37.5 N·m"]),
      numericQuestion("A rigid body with rotational inertia 0.20 kg·m² spins at 10 rad/s. What is its rotational kinetic energy?", "10 J", ["1 J", "20 J", "100 J"]),
      numericQuestion("A skater reduces rotational inertia from 4.0 to 2.0 kg·m² with negligible external torque. If the initial angular speed is 3.0 rad/s, what is the final angular speed?", "6.0 rad/s", ["1.5 rad/s", "3.0 rad/s", "12 rad/s"], "Hard"),
    ] };
    if (/(Simple Harmonic|SHM|Pendulums|Oscillators)/.test(title)) return { category: "oscillations", questions: [
      numericQuestion("A 1.0 kg mass oscillates on a spring with k = 100 N/m. What is its period?", "0.63 s", ["0.10 s", "1.0 s", "6.3 s"], "Easy"),
      numericQuestion("An oscillator has angular frequency 4.0 rad/s and amplitude 0.15 m. What is its maximum speed?", "0.60 m/s", ["0.038 m/s", "4.15 m/s", "26.7 m/s"]),
      numericQuestion("A spring with k = 80 N/m oscillates with amplitude 0.10 m. What is its total mechanical energy?", "0.40 J", ["0.08 J", "0.80 J", "4.0 J"]),
      numericQuestion("Using g = 9.8 m/s², what is the approximate period of a 1.0 m simple pendulum at small amplitude?", "2.0 s", ["0.32 s", "1.0 s", "6.3 s"], "Hard"),
    ] };
    if (/(Internal Structure and Density|Pressure|Fluids)/.test(title)) return { category: "fluids", questions: [
      numericQuestion("A sample has mass 0.60 kg and volume 5.0 × 10⁻⁴ m³. What is its density?", "1.2 × 10³ kg/m³", ["3.0 × 10⁻⁴ kg/m³", "300 kg/m³", "3.0 × 10³ kg/m³"], "Easy"),
      numericQuestion("What gauge pressure is produced by a 3.0 m column of water? Use ρ = 1000 kg/m³ and g = 9.8 m/s².", "2.94 × 10⁴ Pa", ["2.94 × 10³ Pa", "9.8 × 10³ Pa", "3.0 × 10⁶ Pa"]),
      numericQuestion("An object displaces 2.0 × 10⁻³ m³ of water. What buoyant force acts on it? Use g = 9.8 m/s².", "19.6 N", ["1.96 N", "9.8 N", "196 N"]),
      numericQuestion("Water flows at 2.0 m/s through area 0.040 m² and enters a section of area 0.010 m². What is the new speed?", "8.0 m/s", ["0.50 m/s", "2.0 m/s", "4.0 m/s"], "Hard"),
    ] };
    if (/(Temperature and Pressure|Ideal Gas|Thermal|Thermodynamics|Specific Heat|Entropy)/.test(title)) return { category: "thermodynamics", questions: [
      numericQuestion("One mole of ideal gas is at 300 K in a volume of 0.0246 m³. Using R = 8.31 J/(mol·K), what is its pressure?", "1.01 × 10⁵ Pa", ["1.01 × 10³ Pa", "2.49 × 10³ Pa", "7.47 × 10⁵ Pa"], "Easy"),
      numericQuestion("How much energy heats 2.0 kg of aluminum by 10°C if c = 900 J/(kg·°C)?", "1.8 × 10⁴ J", ["1.8 × 10³ J", "4.5 × 10³ J", "9.0 × 10⁴ J"]),
      numericQuestion("A gas absorbs 500 J of heat and does 200 J of work on its surroundings. What is its change in internal energy?", "+300 J", ["−300 J", "+700 J", "−700 J"]),
      numericQuestion("A heat engine absorbs 1000 J and produces 600 J of work. What is its thermal efficiency?", "60%", ["40%", "67%", "167%"], "Hard"),
    ] };
    if (/(Electric Current|Simple Circuits|Resistance|Electric Power|Compound Direct Current|Kirchhoff|Resistor-Capacitor|RC Circuits|LR Circuits|LC Circuits|Inductance)/.test(title)) return { category: "circuits", questions: [
      numericQuestion("A 12 V battery is connected across a 4.0 Ω resistor. What current flows?", "3.0 A", ["0.33 A", "4.0 A", "48 A"], "Easy"),
      numericQuestion("A 2.0 Ω resistor and a 4.0 Ω resistor are in series across 12 V. What is the circuit current?", "2.0 A", ["0.50 A", "3.0 A", "6.0 A"]),
      numericQuestion("A 6.0 Ω resistor and a 3.0 Ω resistor are connected in parallel. What is their equivalent resistance?", "2.0 Ω", ["3.0 Ω", "4.5 Ω", "9.0 Ω"]),
      numericQuestion("A 6.0 Ω resistor has 12 V across it. What power does it dissipate?", "24 W", ["2 W", "12 W", "72 W"], "Hard"),
      numericQuestion("A 1000 Ω resistor and 100 μF capacitor form an RC circuit. What is the time constant?", "0.10 s", ["0.001 s", "10 s", "100 s"], "Hard"),
    ] };
    if (/(Electric Charge|Electric Force|Electric Fields|Electric Flux|Gauss|Electric Potential|Capacitors|Electric Energy|Electrostatics|Conductors|Dielectrics)/.test(title)) return { category: "electrostatics", questions: [
      numericQuestion("Charges +2.0 μC and +3.0 μC are 0.20 m apart. Using k = 9.0 × 10⁹ N·m²/C², what is the electric-force magnitude?", "1.35 N", ["0.27 N", "2.7 N", "6.75 N"], "Easy"),
      numericQuestion("What electric-field magnitude is 0.30 m from a +4.0 μC point charge? Use k = 9.0 × 10⁹ N·m²/C².", "4.0 × 10⁵ N/C", ["1.2 × 10⁴ N/C", "1.3 × 10⁵ N/C", "4.0 × 10⁶ N/C"]),
      numericQuestion("What electric potential is 0.30 m from a +2.0 μC point charge? Use k = 9.0 × 10⁹ N·m²/C².", "6.0 × 10⁴ V", ["6.0 × 10³ V", "1.8 × 10⁴ V", "1.35 × 10⁵ V"]),
      numericQuestion("A 5.0 μF capacitor is connected to 12 V. What charge is stored?", "60 μC", ["0.42 μC", "5 μC", "17 μC"], "Hard"),
    ] };
    if (/(Magnetic|Magnetism|Faraday|Electromagnetic Induction|Induced Currents|Ampère)/.test(title)) return { category: "magnetism", questions: [
      numericQuestion("A 2.0 μC charge moves perpendicular to a 0.50 T field at 3.0 × 10⁴ m/s. What magnetic-force magnitude acts on it?", "0.030 N", ["0.0030 N", "0.30 N", "3.0 N"], "Easy"),
      numericQuestion("A 0.20 m wire carries 4.0 A perpendicular to a 0.30 T field. What magnetic-force magnitude acts on it?", "0.24 N", ["0.024 N", "0.60 N", "2.4 N"]),
      numericQuestion("A uniform 0.50 T field is perpendicular to a loop of area 0.040 m². What is the magnetic flux?", "0.020 Wb", ["0.0020 Wb", "0.080 Wb", "12.5 Wb"]),
      numericQuestion("The flux through each turn of a 50-turn coil changes by 0.010 Wb in 0.20 s. What is the induced-emf magnitude?", "2.5 V", ["0.025 V", "0.50 V", "10 V"], "Hard"),
    ] };
    if (/(Reflection|Mirrors|Refraction|Lenses)/.test(title)) return { category: "optics", questions: [
      numericQuestion("A concave mirror has focal length 10 cm and an object is 30 cm away. Where is the image?", "15 cm in front of the mirror", ["7.5 cm behind the mirror", "20 cm in front of the mirror", "30 cm behind the mirror"], "Easy"),
      numericQuestion("A converging lens has focal length 20 cm and an object distance of 60 cm. What is the image distance?", "30 cm", ["15 cm", "20 cm", "40 cm"]),
      numericQuestion("Light enters glass of n = 1.50 from air at 30°. What is the refracted angle?", "About 19.5°", ["About 30°", "About 41.8°", "About 48.6°"]),
      numericQuestion("A lens forms an image 30 cm away for an object 60 cm away. What is the lateral magnification?", "−0.50", ["−2.0", "+0.50", "+2.0"], "Hard"),
      { ...numericQuestion("The diagram shows rays converging through a convex lens. An object is 60 cm from a lens of focal length 20 cm. What image is formed?", "A real, inverted image 30 cm from the lens with magnification −0.50", ["A virtual, upright image 30 cm from the lens", "A real image 40 cm from the lens with magnification −2.0", "No image is formed"], "Hard"), ...physicsDiagrams.lens },
    ] };
    if (/(Wave|Diffraction|Doppler|Interference|Thin-Film|Polarization)/.test(title)) return { category: "waves", questions: [
      numericQuestion("A wave has frequency 5.0 Hz and wavelength 2.0 m. What is its speed?", "10 m/s", ["0.40 m/s", "2.5 m/s", "25 m/s"], "Easy"),
      numericQuestion("A string has tension 100 N and linear density 0.010 kg/m. What is the wave speed?", "100 m/s", ["10 m/s", "31.6 m/s", "1000 m/s"]),
      numericQuestion("A 500 Hz source moves toward a stationary observer at 20 m/s. Using 340 m/s for sound speed, what frequency is heard?", "About 531 Hz", ["About 471 Hz", "500 Hz", "850 Hz"]),
      numericQuestion("In a double-slit experiment, λ = 600 nm, screen distance = 2.0 m, and slit spacing = 0.50 mm. What is the spacing between adjacent bright fringes?", "2.4 mm", ["0.24 mm", "1.2 mm", "4.8 mm"], "Hard"),
    ] };
    if (/(Quantum|Bohr|Emission|Blackbody|Photoelectric|Compton|Fission|Fusion|Radioactive)/.test(title)) return { category: "modern-physics", questions: [
      numericQuestion("A photon has wavelength 620 nm. Using hc = 1240 eV·nm, what is its energy?", "2.0 eV", ["0.50 eV", "6.2 eV", "7.7 × 10⁵ eV"], "Easy"),
      numericQuestion("Photons of energy 3.0 eV strike a metal with work function 2.2 eV. What is the maximum photoelectron kinetic energy?", "0.8 eV", ["1.5 eV", "2.2 eV", "5.2 eV"]),
      numericQuestion("A radioactive sample starts at 80 mg and passes through three half-lives. How much remains?", "10 mg", ["20 mg", "30 mg", "40 mg"]),
      numericQuestion("A nuclear reaction has a mass defect of 0.0020 u. Using 931.5 MeV/u, approximately how much energy is released?", "1.86 MeV", ["0.47 MeV", "4.66 MeV", "1863 MeV"], "Hard"),
    ] };
    if (/(Work|Energy|Power)/.test(title)) return { category: "energy", questions: [
      numericQuestion("What is the kinetic energy of a 4.0 kg object moving at 6.0 m/s?", "72 J", ["12 J", "24 J", "144 J"], "Easy"),
      numericQuestion("A 20 N force acts through 5.0 m at 60° to the displacement. How much work does it do?", "50 J", ["10 J", "100 J", "500 J"]),
      numericQuestion("An object falls 5.0 m from rest. Neglect air resistance and use g = 9.8 m/s². What is its speed just before landing?", "9.9 m/s", ["4.9 m/s", "7.0 m/s", "49 m/s"]),
      numericQuestion("A machine transfers 600 J of energy in 3.0 s. What is its average power?", "200 W", ["20 W", "180 W", "1,800 W"], "Hard"),
    ] };
    return { category: "unmatched", questions: [] };
  };

  const apStyleChallenge = (category) => ({
    kinematics: numericQuestion("A particle moves along the x-axis according to x(t) = 2 + 3t + 2t², with SI units. What is its instantaneous velocity at t = 2.0 s?", "11 m/s", ["7 m/s", "13 m/s", "21 m/s"], "Hard", "Use the mathematical model to distinguish position, average velocity, and instantaneous velocity."),
    dynamics: { ...numericQuestion("A block slides down a 30° incline with coefficient of kinetic friction 0.20. Using g = 9.8 m/s², what is its acceleration down the incline?", "About 3.2 m/s²", ["About 1.7 m/s²", "About 4.9 m/s²", "About 6.6 m/s²"], "Hard", "Resolve gravity parallel and perpendicular to the incline before applying Newton’s second law."), ...physicsDiagrams.incline },
    momentum: numericQuestion("A 0.020 kg projectile moving at 200 m/s embeds in a stationary 0.980 kg block. The combined object then rises without friction. Approximately how high does it rise?", "0.82 m", ["0.20 m", "2.0 m", "4.1 m"], "Hard", "Use momentum conservation during the collision, then mechanical-energy conservation during the rise."),
    orbits: numericQuestion("Satellite B orbits the same planet at 3 times Satellite A’s orbital radius. What is the ratio T_B/T_A?", "3√3", ["√3", "3", "9"], "Hard", "Apply the orbital-period relationship rather than assuming period is proportional to radius."),
    "torque-work": numericQuestion("A flywheel with rotational inertia 0.50 kg·m² starts from rest under a constant 6.0 N·m torque for 4.0 s. How much work does the torque do?", "576 J", ["48 J", "96 J", "1,152 J"], "Hard", "First determine angular acceleration and angular displacement, then connect torque to work."),
    rotation: numericQuestion("A uniform disk with rotational inertia 0.40 kg·m² speeds up from 5 to 15 rad/s. What net work is done on it?", "40 J", ["20 J", "50 J", "80 J"], "Hard", "Use the change in rotational kinetic energy, not the change in angular speed alone."),
    oscillations: numericQuestion("A 2.0 kg block oscillates on a spring with k = 50 N/m and amplitude 0.20 m. What is its speed when x = 0.12 m?", "0.80 m/s", ["0.40 m/s", "1.0 m/s", "1.6 m/s"], "Hard", "Equate the total spring energy at the amplitude to kinetic plus potential energy at the stated position."),
    fluids: numericQuestion("Water flows horizontally from a 0.040 m² section at 2.0 m/s into a 0.010 m² section. Ignoring viscosity, how much lower is the pressure in the narrow section?", "3.0 × 10⁴ Pa", ["7.5 × 10³ Pa", "6.0 × 10⁴ Pa", "1.2 × 10⁵ Pa"], "Hard", "Use continuity to find the second speed, then apply Bernoulli’s equation at equal height."),
    thermodynamics: numericQuestion("A gas expands at constant pressure 2.0 × 10⁵ Pa from 0.010 m³ to 0.030 m³ while absorbing 6.5 kJ of heat. What is ΔU?", "+2.5 kJ", ["−2.5 kJ", "+4.0 kJ", "+10.5 kJ"], "Hard", "Calculate the work from the area under the P–V path, then apply the first law."),
    circuits: { ...numericQuestion("A 2.0 Ω resistor is in series with a parallel combination of 6.0 Ω and 3.0 Ω across a 12 V battery. What current flows through the 6.0 Ω branch?", "1.0 A", ["0.50 A", "2.0 A", "3.0 A"], "Hard", "Reduce the parallel section, find total current, then use the voltage across the parallel branches."), ...physicsDiagrams.circuits },
    electrostatics: numericQuestion("A 10 μF capacitor is charged to 100 V, disconnected, and then completely filled with dielectric of κ = 5. What is its new stored energy?", "0.010 J", ["0.0020 J", "0.050 J", "0.25 J"], "Hard", "Because the capacitor is disconnected, charge remains constant while capacitance changes."),
    magnetism: numericQuestion("A proton passes undeflected through crossed fields E = 3.0 × 10⁴ N/C and B = 0.20 T, then enters the magnetic field alone. What is the radius of its circular path?", "7.8 mm", ["0.78 mm", "31 mm", "78 mm"], "Hard", "First use the velocity-selector condition, then set magnetic force equal to centripetal force."),
    optics: { ...numericQuestion("An object is 60 cm from a converging lens of focal length 20 cm. What image is formed?", "A real, inverted image 30 cm from the lens with magnification −0.50", ["A virtual, upright image 30 cm from the lens", "A real image 40 cm from the lens with magnification −2.0", "No image is formed"], "Hard", "Use the thin-lens equation, then use image and object distances to determine magnification."), ...physicsDiagrams.lens },
    waves: numericQuestion("A 1.20 m string fixed at both ends supports waves at 120 m/s. What is the frequency of its third harmonic?", "150 Hz", ["50 Hz", "100 Hz", "300 Hz"], "Hard", "Use the fixed-end boundary condition to determine the allowed wavelength before applying v = fλ."),
    "modern-physics": numericQuestion("Light of wavelength 400 nm strikes a metal with work function 2.2 eV. Using hc = 1240 eV·nm, what stopping potential is required?", "0.90 V", ["0.45 V", "2.2 V", "3.1 V"], "Hard", "Convert wavelength to photon energy, subtract the work function, and relate maximum kinetic energy to stopping potential."),
    energy: numericQuestion("A 2.0 kg block starts from rest 5.0 m above a frictionless track, then enters a horizontal rough surface with μₖ = 0.25. Using g = 9.8 m/s², how far does it slide before stopping?", "20 m", ["5 m", "10 m", "40 m"], "Hard", "Use energy conservation on the track and the work done by friction on the horizontal surface."),
    "center-of-mass": numericQuestion("A 60 kg person walks 3.0 m to the right on a stationary 240 kg raft. Neglect horizontal external forces. How far does the raft move relative to shore?", "0.60 m left", ["0.60 m right", "0.75 m left", "2.4 m left"], "Hard", "Keep the system’s center of mass fixed while relating the person’s motion to the raft’s motion."),
  }[category] || null);

  const questionBank = (courseId, unitNumber, topicNumber, title, profile, peers) => {
    const peerProfiles = peers.filter((item) => item.number !== topicNumber).map((item) => item.profile);
    const relationChoices = rotateChoices(profile.relation, peerProfiles.map((item) => item.relation), `${courseId}-${topicNumber}-relation`);
    const limitChoices = rotateChoices(profile.limit, peerProfiles.map((item) => item.limit), `${courseId}-${topicNumber}-limit`);
    const conceptChoices = rotateChoices(title, peers.filter((item) => item.number !== topicNumber).map((item) => item.title), `${courseId}-${topicNumber}-concept`);
    const source = `Original practice aligned to ${sources[courseId].title}`;
    const base = { topicId: `${courseId}-${topicNumber}`, source, sourceUrl: sources[courseId].url };
    const problemSet = authenticProblemSet(title, courseId);
    const questions = [
      { ...base, id: `${courseId}-${topicNumber}-q1`, type: "mcq", prompt: `Which concept is described? ${profile.summary}`, answer: title, options: conceptChoices, difficulty: "Easy" },
      { ...base, id: `${courseId}-${topicNumber}-q2`, type: "mcq", prompt: `Which relationship correctly represents ${title.toLowerCase()}?`, answer: profile.relation, options: relationChoices, difficulty: "Easy" },
      ...problemSet.questions.map((question, index) => ({ ...base, ...question, id: `${courseId}-${topicNumber}-q${index + 3}` })),
    ];
    const challenge = topicDepth(title) === "extended" ? apStyleChallenge(problemSet.category) : null;
    if (challenge) questions.push({ ...base, ...challenge, id: `${courseId}-${topicNumber}-q${questions.length + 1}`, type: "stimulus_mcq" });
    return questions;
  };

  const buildCourse = (courseId, spec) => {
    const topics = spec.units.flatMap(([unitNumber, unitTitle, topicRows]) => topicRows.map(([number, title]) => ({ unitNumber, unitTitle, number, title, profile: findProfile(title) })));
    const cardsByTopic = new Map(topics.map((topic) => [topic.number, []]));
    const variants = [
      (topic) => [topic.title, topic.profile.summary],
      (topic) => [`${topic.title}: key relationship`, topic.profile.relation, topic.profile.relation],
      (topic) => [`${topic.title}: model limits and checks`, topic.profile.limit],
    ];
    for (const topic of topics) {
      const cardTarget = topicDepth(topic.title) === "extended" ? 3 : 2;
      for (const variant of variants.slice(0, cardTarget)) {
        const [front, back, equation] = variant(topic);
        const cards = cardsByTopic.get(topic.number);
        cards.push({ id: `${courseId}-${topic.number.replace(".", "-")}-c${cards.length + 1}`, front, back, ...(equation ? { equation } : {}), topicId: `${courseId}-${topic.number}` });
      }
    }
    return spec.units.map(([unitNumber, unitTitle, topicRows]) => {
      const peers = topicRows.map(([number, title]) => ({ number, title, profile: findProfile(title) }));
      const subtopics = peers.map((topic) => ({
        id: `${courseId}-${topic.number}`,
        number: topic.number,
        label: `${topic.number} ${topic.title}`,
        cards: cardsByTopic.get(topic.number),
        questions: questionBank(courseId, unitNumber, topic.number, topic.title, topic.profile, peers),
        feynmanPrompts: [],
      }));
      return {
        id: `${courseId}-unit-${unitNumber}`,
        name: `${spec.name} · Unit ${unitNumber}`,
        shortName: `Unit ${unitNumber}: ${unitTitle}`,
        builtIn: true,
        sourceTitle: sources[courseId].title,
        sourceUrl: sources[courseId].url,
        subtopics,
        cards: subtopics.flatMap((topic) => topic.cards),
        questions: subtopics.flatMap((topic) => topic.questions),
        feynmanPrompts: [],
      };
    });
  };

  Object.entries(specs).forEach(([courseId, spec]) => { window[spec.global] = buildCourse(courseId, spec); });
  window.AP_PHYSICS_CONTENT_DIAGNOSTICS = Object.fromEntries(Object.entries(specs).map(([courseId, spec]) => {
    const units = window[spec.global];
    const topics = units.flatMap((unit) => unit.subtopics);
    return [courseId, {
      cards: units.flatMap((unit) => unit.cards).length,
      topics: topics.length,
      questions: topics.reduce((sum, topic) => sum + topic.questions.length, 0),
      unmatchedProfiles: topics.filter((topic) => !findProfile(topic.label.replace(/^\d+\.\d+\s+/, "")).matched).map((topic) => topic.label),
    }];
  }));
})();
