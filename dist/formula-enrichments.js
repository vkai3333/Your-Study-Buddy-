(() => {
  const normalize = (value) => String(value || "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const formulas = new Map(Object.entries({
    // Mechanics, fluids, electricity, waves, and optics (MCAT and shared science decks)
    "newtons second law": String.raw`\sum F=ma`,
    "work": String.raw`W=Fd\cos\theta`,
    "kinetic energy": String.raw`K=\frac{1}{2}mv^2`,
    "gravitational potential energy": String.raw`U_g=mgh`,
    "power": String.raw`P=\frac{W}{t}=Fv`,
    "momentum": String.raw`p=mv`,
    "impulse": String.raw`J=\Delta p=F_{avg}\Delta t`,
    "torque": String.raw`\tau=rF\sin\theta`,
    "static equilibrium": String.raw`\sum F=0\quad\text{and}\quad\sum\tau=0`,
    "density": String.raw`\rho=\frac{m}{V}`,
    "pressure": String.raw`P=\frac{F}{A}`,
    "hydrostatic pressure": String.raw`P=P_0+\rho gh`,
    "archimedes principle": String.raw`F_B=\rho_{fluid}V_{displaced}g`,
    "continuity equation": String.raw`A_1v_1=A_2v_2`,
    "bernoulli equation": String.raw`P+\frac{1}{2}\rho v^2+\rho gh=\text{constant}`,
    "poiseuilles law": String.raw`Q=\frac{\pi r^4\Delta P}{8\eta L}`,
    "electric field": String.raw`E=\frac{F}{q}=\frac{kQ}{r^2}`,
    "electric potential": String.raw`V=\frac{U}{q}=\frac{kQ}{r}`,
    "capacitance": String.raw`C=\frac{Q}{V}`,
    "parallel plate capacitance": String.raw`C=\frac{\kappa\varepsilon_0A}{d}`,
    "ohms law": String.raw`V=IR`,
    "series circuit": String.raw`R_{eq}=R_1+R_2+\cdots`,
    "parallel circuit": String.raw`\frac{1}{R_{eq}}=\frac{1}{R_1}+\frac{1}{R_2}+\cdots`,
    "electrical power": String.raw`P=IV=I^2R=\frac{V^2}{R}`,
    "magnetic force on a charge": String.raw`F_B=qvB\sin\theta`,
    "wave speed": String.raw`v=f\lambda`,
    "sound intensity level": String.raw`\beta=10\log\left(\frac{I}{I_0}\right)`,
    "index of refraction": String.raw`n=\frac{c}{v}`,
    "snells law": String.raw`n_1\sin\theta_1=n_2\sin\theta_2`,
    "critical angle": String.raw`\sin\theta_c=\frac{n_2}{n_1}`,
    "thin lens equation": String.raw`\frac{1}{f}=\frac{1}{d_o}+\frac{1}{d_i}`,
    "magnification": String.raw`m=\frac{h_i}{h_o}=-\frac{d_i}{d_o}`,
    "photon energy": String.raw`E=hf=\frac{hc}{\lambda}`,
    "photoelectric effect": String.raw`K_{max}=hf-\phi`,

    // Biology and biochemistry
    "michaelis menten equation": String.raw`v=\frac{V_{max}[S]}{K_m+[S]}`,
    "michaelis constant km": String.raw`v=\frac{V_{max}}{2}\quad\text{when}\quad[S]=K_m`,
    "lineweaver burk plot": String.raw`\frac{1}{v}=\frac{K_m}{V_{max}}\frac{1}{[S]}+\frac{1}{V_{max}}`,
    "turnover number": String.raw`k_{cat}=\frac{V_{max}}{[E]_T}`,
    "henderson hasselbalch equation": String.raw`pH=pK_a+\log\left(\frac{[A^-]}{[HA]}\right)`,
    "cardiac output": String.raw`CO=HR\times SV`,
    "minute ventilation": String.raw`\dot V_E=f\times V_T`,
    "alveolar ventilation": String.raw`\dot V_A=f(V_T-V_D)`,
    "hardy weinberg equilibrium": String.raw`p^2+2pq+q^2=1\quad\text{and}\quad p+q=1`,
    "water potential": String.raw`\Psi=\Psi_s+\Psi_p`,
    "surface area to volume ratio": String.raw`\frac{SA}{V}`,

    // General chemistry and thermodynamics
    "ideal gas law": String.raw`PV=nRT`,
    "combined gas law": String.raw`\frac{P_1V_1}{T_1}=\frac{P_2V_2}{T_2}`,
    "beer lambert law": String.raw`A=\varepsilon bc`,
    "coulombs law": String.raw`F=k\frac{q_1q_2}{r^2}`,
    "gibbs free energy": String.raw`\Delta G=\Delta H-T\Delta S`,
    "standard free energy and equilibrium": String.raw`\Delta G^\circ=-RT\ln K`,
    "reaction quotient": String.raw`Q=\frac{\prod[products]^{coefficients}}{\prod[reactants]^{coefficients}}`,
    "arrhenius equation": String.raw`k=Ae^{-E_a/(RT)}`,
    "first order half life": String.raw`t_{1/2}=\frac{\ln 2}{k}`,
    "rate law": String.raw`rate=k[A]^m[B]^n`,
    "nernst equation": String.raw`E=E^\circ-\frac{RT}{nF}\ln Q`,
    "faradays law": String.raw`q=nF`,
    "molarity": String.raw`M=\frac{n_{solute}}{V_{solution}}`,
    "dilution equation": String.raw`M_1V_1=M_2V_2`,
    "ph": String.raw`pH=-\log[H^+]`,
    "poh": String.raw`pOH=-\log[OH^-]`,
    "ion product of water": String.raw`K_w=[H^+][OH^-]=1.0\times10^{-14}`,

    // Statistics
    "mean": String.raw`\bar{x}=\frac{\sum x_i}{n}`,
    "standard deviation": String.raw`s=\sqrt{\frac{\sum(x_i-\bar{x})^2}{n-1}}`,
    "z score": String.raw`z=\frac{x-\mu}{\sigma}`,
    "conditional probability": String.raw`P(A\mid B)=\frac{P(A\cap B)}{P(B)}`,
    "addition rule": String.raw`P(A\cup B)=P(A)+P(B)-P(A\cap B)`,
    "multiplication rule": String.raw`P(A\cap B)=P(A)P(B\mid A)`,
    "binomial probability": String.raw`P(X=k)=\binom{n}{k}p^k(1-p)^{n-k}`,
    "expected value": String.raw`\mu_X=\sum xP(X=x)`,
    "standard error": String.raw`SE=\frac{s}{\sqrt n}`,
    "standard error of the sample mean": String.raw`\sigma_{\bar{x}}=\frac{\sigma}{\sqrt n}`,
    "one sample z interval for a proportion": String.raw`\hat p\pm z^*\sqrt{\frac{\hat p(1-\hat p)}{n}}`,
    "one proportion z test": String.raw`z=\frac{\hat p-p_0}{\sqrt{p_0(1-p_0)/n}}`,
    "two proportion z test": String.raw`z=\frac{\hat p_1-\hat p_2}{\sqrt{\hat p_c(1-\hat p_c)(1/n_1+1/n_2)}}`,
    "one sample t statistic": String.raw`t=\frac{\bar x-\mu_0}{s/\sqrt n}`,
    "chi square statistic": String.raw`\chi^2=\sum\frac{(O-E)^2}{E}`,
    "least squares regression line": String.raw`\hat y=a+bx`,
    "slope of a regression line": String.raw`b=r\frac{s_y}{s_x}`,
    "coefficient of determination": String.raw`R^2=r^2`,

    // Economics and personal finance
    "price elasticity of demand": String.raw`E_d=\frac{\%\Delta Q_d}{\%\Delta P}`,
    "price elasticity of supply": String.raw`E_s=\frac{\%\Delta Q_s}{\%\Delta P}`,
    "cross price elasticity": String.raw`E_{xy}=\frac{\%\Delta Q_x}{\%\Delta P_y}`,
    "income elasticity": String.raw`E_I=\frac{\%\Delta Q}{\%\Delta I}`,
    "total revenue": String.raw`TR=P\times Q`,
    "profit": String.raw`\pi=TR-TC`,
    "average total cost": String.raw`ATC=\frac{TC}{Q}=AFC+AVC`,
    "marginal cost": String.raw`MC=\frac{\Delta TC}{\Delta Q}`,
    "nominal gdp": String.raw`GDP_{nominal}=\sum P_{current}Q_{current}`,
    "real gdp": String.raw`GDP_{real}=\sum P_{base}Q_{current}`,
    "gdp deflator": String.raw`GDP\ deflator=\frac{GDP_{nominal}}{GDP_{real}}\times100`,
    "unemployment rate": String.raw`\frac{unemployed}{labor\ force}\times100`,
    "labor force participation rate": String.raw`\frac{labor\ force}{adult\ population}\times100`,
    "inflation rate": String.raw`\frac{CPI_{new}-CPI_{old}}{CPI_{old}}\times100`,
    "spending multiplier": String.raw`\frac{1}{1-MPC}=\frac{1}{MPS}`,
    "tax multiplier": String.raw`-\frac{MPC}{1-MPC}`,
    "money multiplier": String.raw`\frac{1}{required\ reserve\ ratio}`,
    "real interest rate": String.raw`r\approx i-\pi`,
    "quantity theory of money": String.raw`MV=PY`,
    "purchasing power parity": String.raw`E=\frac{P_{domestic}}{P_{foreign}}`,
    "compound interest": String.raw`A=P\left(1+\frac{r}{n}\right)^{nt}`,
    "simple interest": String.raw`A=P(1+rt)`,
  }).map(([key, value]) => [normalize(key), value]));

  const deckCollections = Object.entries(window)
    .filter(([key, value]) => /(?:DECKS|COLLECTIONS)$/.test(key) && Array.isArray(value))
    .map(([, value]) => value);
  deckCollections.flat().forEach((deck) => {
    (deck?.cards || []).forEach((card) => {
      if (card.equation || card.backImage) return;
      const equation = formulas.get(normalize(card.front));
      if (equation) card.equation = equation;
    });
  });
})();
