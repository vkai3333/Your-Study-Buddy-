(() => {
  const sourceTitle = "AP Calculus AB and BC Course and Exam Description, Effective Fall 2026";
  const sourceUrl = "https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf";
  const unit = (number, title, entries, prompts) => ({
    id: `apcalc-unit-${number}`,
    name: `AP Calculus AB/BC · Unit ${number}`,
    shortName: `Unit ${number}: ${title}`,
    builtIn: true,
    sourceTitle,
    sourceUrl,
    cards: entries.map(([front, back, equation, level], index) => ({ id: `apcalc-u${number}-c${index + 1}`, front, back, ...(equation ? { equation } : {}), ...(level === "BC" ? { courseLevel: "BC" } : {}) })),
    questions: [],
    feynmanPrompts: prompts.map(([prompt, level], index) => ({ id: `apcalc-u${number}-f${index + 1}`, prompt, ...(level === "BC" ? { courseLevel: "BC" } : {}) })),
  });

  window.AP_CALCULUS_DECKS = [
    unit(1, "Limits and Continuity", [
      ["Limit", "The value a function approaches as the input approaches a specified value."],
      ["One-sided limit", "A limit taken as x approaches from only the left or only the right."],
      ["Two-sided limit", "Exists only when the left-hand and right-hand limits both exist and are equal."],
      ["Limit from a table", "Estimate the output value approached by using inputs increasingly close to the target from both sides."],
      ["Limit from a graph", "Read the y-value approached by the graph; the actual function value at the point may differ or be undefined."],
      ["Limit laws", "Allow limits of sums, differences, products, quotients, and powers to be built from simpler limits when their conditions hold."],
      ["Direct substitution", "Evaluate a limit by substituting the approaching value when the function is continuous there."],
      ["Indeterminate form 0/0", "Signals that algebraic simplification or another limit method is needed; it is not the value of the limit."],
      ["Squeeze theorem", "If a function is trapped between two functions with the same limit, the trapped function has that limit."],
      ["Infinite limit", "Describes unbounded function values near an input and commonly indicates a vertical asymptote."],
      ["Limit at infinity", "Describes end behavior as x increases or decreases without bound."],
      ["Vertical asymptote", "A line x = a near which a function becomes unbounded on at least one side."],
      ["Horizontal asymptote", "A line y = L approached by a function as x tends to positive or negative infinity."],
      ["Continuity at a point", "f(a) is defined, lim as x approaches a of f(x) exists, and that limit equals f(a)."],
      ["Removable discontinuity", "A hole caused when a finite limit exists but the function is missing or has a different value at that input."],
      ["Jump discontinuity", "A discontinuity where finite one-sided limits exist but are unequal."],
      ["Intermediate Value Theorem", "A continuous function on [a,b] takes every value between f(a) and f(b)."],
    ], [["How to determine limits and continuity from graphs, tables, and formulas"]]),

    unit(2, "Differentiation: Definition and Fundamental Properties", [
      ["Derivative", "The instantaneous rate of change of a function and the slope of its tangent line."],
      ["Derivative at a point", "Use the difference-quotient limit to find the instantaneous rate at x = a.", "f'(a)=\\lim_{h\\to0}\\frac{f(a+h)-f(a)}{h}"],
      ["Derivative function", "Assigns each input the derivative of the original function at that input.", "f'(x)=\\lim_{h\\to0}\\frac{f(x+h)-f(x)}{h}"],
      ["Alternative derivative definition", "Uses secant slopes through (a,f(a)) and (x,f(x)).", "f'(a)=\\lim_{x\\to a}\\frac{f(x)-f(a)}{x-a}"],
      ["Differentiability implies continuity", "If f is differentiable at a, then f is continuous at a; the converse need not hold."],
      ["Derivative notation", "Equivalent forms include f′(x), y′, dy/dx, and Dₓf(x)."],
      ["Power rule", "Multiply by the exponent and reduce the exponent by one.", "\\frac{d}{dx}x^n=nx^{n-1}"],
      ["Constant rule", "The derivative of a constant is zero.", "\\frac{d}{dx}c=0"],
      ["Constant multiple rule", "A constant factor remains outside differentiation.", "\\frac{d}{dx}[cf(x)]=cf'(x)"],
      ["Sum and difference rules", "Differentiate each term separately.", "\\frac{d}{dx}[f(x)\\pm g(x)]=f'(x)\\pm g'(x)"],
      ["Product rule", "Differentiate one factor at a time and add the two products.", "(fg)'=f'g+fg'"],
      ["Quotient rule", "Differentiate a quotient using low-d-high minus high-d-low over low squared.", "(f/g)'=\\frac{f'g-fg'}{g^2}"],
      ["Derivative of sine", "The derivative of sine is cosine.", "\\frac{d}{dx}(\\sin x)=\\cos x"],
      ["Derivative of cosine", "The derivative of cosine is negative sine.", "\\frac{d}{dx}(\\cos x)=-\\sin x"],
      ["Derivative of exponential eˣ", "The natural exponential function is its own derivative.", "\\frac{d}{dx}e^x=e^x"],
      ["Derivative of natural logarithm", "For x > 0, the derivative of ln x is 1/x.", "\\frac{d}{dx}\\ln x=\\frac{1}{x}"],
      ["Tangent-line equation", "Uses a function value and derivative value at x = a.", "y-f(a)=f'(a)(x-a)"],
    ], [["How to find a derivative from its limit definition and basic derivative rules"]]),

    unit(3, "Differentiation: Composite, Implicit, and Inverse Functions", [
      ["Chain rule", "Differentiate the outer function, keep the inner function, then multiply by the inner derivative.", "\\frac{d}{dx}f(g(x))=f'(g(x))g'(x)"],
      ["Implicit differentiation", "Differentiate both sides with respect to x and include dy/dx whenever differentiating a term containing y."],
      ["Derivative of an inverse function", "The inverse derivative is the reciprocal derivative at the corresponding original input.", "(f^{-1})'(a)=\\frac{1}{f'(f^{-1}(a))}"],
      ["Derivative of inverse sine", "Valid for −1 < x < 1.", "\\frac{d}{dx}\\arcsin x=\\frac{1}{\\sqrt{1-x^2}}"],
      ["Derivative of inverse cosine", "Valid for −1 < x < 1.", "\\frac{d}{dx}\\arccos x=-\\frac{1}{\\sqrt{1-x^2}}"],
      ["Derivative of inverse tangent", "Valid for every real x.", "\\frac{d}{dx}\\arctan x=\\frac{1}{1+x^2}"],
      ["Derivative of a general exponential", "Differentiate aˣ by multiplying by ln a.", "\\frac{d}{dx}a^x=a^x\\ln a"],
      ["Derivative of a logarithm base a", "Convert through the natural logarithm.", "\\frac{d}{dx}\\log_a x=\\frac{1}{x\\ln a}"],
      ["Logarithmic differentiation", "Take logarithms before differentiating to simplify variable powers or complicated products and quotients."],
      ["Second derivative", "The derivative of the derivative; it describes how the first derivative changes."],
      ["Higher-order derivative", "A derivative taken repeatedly, such as position to velocity to acceleration."],
      ["Derivative of tangent", "Differentiate tangent to obtain secant squared.", "\\frac{d}{dx}(\\tan x)=\\sec^2x"],
      ["Derivative of secant", "Differentiate secant to obtain secant times tangent.", "\\frac{d}{dx}(\\sec x)=\\sec x\\tan x"],
      ["Derivative of cotangent", "Differentiate cotangent to obtain negative cosecant squared.", "\\frac{d}{dx}(\\cot x)=-\\csc^2x"],
      ["Derivative of cosecant", "Differentiate cosecant to obtain negative cosecant times cotangent.", "\\frac{d}{dx}(\\csc x)=-\\csc x\\cot x"],
    ], [["How to choose among the chain rule, implicit differentiation, and inverse-function differentiation"]]),

    unit(4, "Contextual Applications of Differentiation", [
      ["Position", "An object's location as a function of time."],
      ["Velocity", "The derivative of position; its sign gives direction of motion.", "v(t)=s'(t)"],
      ["Speed", "The magnitude of velocity.", "speed=|v(t)|"],
      ["Acceleration", "The derivative of velocity and second derivative of position.", "a(t)=v'(t)=s''(t)"],
      ["Displacement", "Final position minus initial position; later it can also be found by integrating velocity."],
      ["Related rates", "Relate quantities with an equation, differentiate with respect to time, then substitute the instant's values."],
      ["Units of a derivative", "Output units divided by input units; a second derivative divides by the input unit twice."],
      ["Local linearity", "A differentiable function is approximately linear very close to a point."],
      ["Linearization", "Approximates f near x = a using its tangent line.", "L(x)=f(a)+f'(a)(x-a)"],
      ["Differentials", "For a small input change dx, the output change is approximated by dy.", "dy=f'(x)dx"],
      ["Motion direction", "A particle moves right when velocity is positive and left when velocity is negative."],
    ], [["How to solve motion, linearization, and related-rates problems with derivatives"]]),

    unit(5, "Analytical Applications of Differentiation", [
      ["Rolle’s Theorem", "If f is continuous on [a,b], differentiable on (a,b), and f(a)=f(b), then at least one number c in (a,b) satisfies f′(c)=0.", "f(a)=f(b)\\quad\\Rightarrow\\quad f'(c)=0"],
      ["Mean Value Theorem", "If f is continuous on [a,b] and differentiable on (a,b), some c has instantaneous slope equal to the interval's average slope.", "f'(c)=\\frac{f(b)-f(a)}{b-a}"],
      ["Extreme Value Theorem", "A continuous function on a closed interval attains an absolute maximum and minimum."],
      ["Critical point", "An interior domain point where f′ is zero or undefined."],
      ["Absolute extremum", "The greatest or least function value over the entire specified domain or interval."],
      ["Local extremum", "A function value greater or less than nearby values."],
      ["Closed-interval method", "Evaluate f at critical points and endpoints, then compare values for absolute extrema."],
      ["Increasing function", "On an interval, f increases where f′ is positive."],
      ["Decreasing function", "On an interval, f decreases where f′ is negative."],
      ["First derivative test", "Classify a critical point by checking how the sign of f′ changes across it."],
      ["Concavity", "f is concave up where f′ is increasing and concave down where f′ is decreasing."],
      ["Second derivative test", "At a critical point c, f″(c)>0 indicates a local minimum and f″(c)<0 indicates a local maximum."],
      ["Point of inflection", "A point on the graph where concavity changes."],
      ["Optimization", "Translate constraints and an objective into one variable, find critical points, and justify the optimum."],
      ["L’Hôpital’s rule", "For suitable 0/0 or ∞/∞ limits, take the limit of the quotient of derivatives.", "\\lim\\frac{f(x)}{g(x)}=\\lim\\frac{f'(x)}{g'(x)}"],
      ["Derivative graph relationship", "Zeros of f′ are horizontal tangents of f; extrema of f′ may correspond to inflection points of f."],
    ], [["How to use derivative signs to analyze and sketch a function"], ["How to set up an optimization problem and justify an absolute extremum"]]),

    unit(6, "Integration and Accumulation of Change", [
      ["Antiderivative", "A function F whose derivative is the given function f."],
      ["Indefinite integral", "The family of all antiderivatives, including an arbitrary constant.", "\\int f(x)dx=F(x)+C"],
      ["Power-rule antiderivative", "Increase the exponent by one and divide by the new exponent; this rule requires n ≠ −1.", "\\int x^n\\,dx=\\frac{x^{n+1}}{n+1}+C"],
      ["Antiderivative of 1/x", "The logarithmic antiderivative applies on any interval that does not cross zero.", "\\int\\frac{1}{x}\\,dx=\\ln|x|+C"],
      ["Antiderivative of eˣ", "The natural exponential function is its own antiderivative.", "\\int e^x\\,dx=e^x+C"],
      ["Antiderivative of aˣ", "For a positive base a other than 1, divide by ln a.", "\\int a^x\\,dx=\\frac{a^x}{\\ln a}+C"],
      ["Antiderivative of cosine", "Cosine integrates to sine.", "\\int\\cos x\\,dx=\\sin x+C"],
      ["Antiderivative of secant squared", "Recognize sec²x as the derivative of tangent.", "\\int\\sec^2x\\,dx=\\tan x+C"],
      ["Antiderivative of cosecant squared", "Recognize csc²x as the negative derivative of cotangent.", "\\int\\csc^2x\\,dx=-\\cot x+C"],
      ["Antiderivative of secant times tangent", "Recognize sec x tan x as the derivative of secant.", "\\int\\sec x\\tan x\\,dx=\\sec x+C"],
      ["Antiderivative of cosecant times cotangent", "Recognize csc x cot x as the negative derivative of cosecant.", "\\int\\csc x\\cot x\\,dx=-\\csc x+C"],
      ["Inverse-tangent antiderivative", "A denominator of 1+x² matches the derivative pattern for arctangent.", "\\int\\frac{1}{1+x^2}\\,dx=\\arctan x+C"],
      ["Inverse-sine antiderivative", "The reciprocal square-root pattern produces inverse sine on −1<x<1.", "\\int\\frac{1}{\\sqrt{1-x^2}}\\,dx=\\arcsin x+C"],
      ["Definite integral", "A signed accumulation over an interval, defined as a limit of Riemann sums."],
      ["Riemann sum", "Approximates a definite integral by adding rectangle areas.", "\\sum_{i=1}^{n}f(x_i^*)\\Delta x"],
      ["Left Riemann sum", "Uses each subinterval's left endpoint as the sample point."],
      ["Right Riemann sum", "Uses each subinterval's right endpoint as the sample point."],
      ["Midpoint Riemann sum", "Uses each subinterval's midpoint as the sample point."],
      ["Trapezoidal sum", "Approximates using trapezoid areas formed by endpoint heights.", "\\sum\\frac{f(x_{i-1})+f(x_i)}{2}\\Delta x"],
      ["Fundamental Theorem of Calculus, Part 1", "The derivative of an accumulation function returns the integrand, with chain rule when the bound is composite.", "\\frac{d}{dx}\\int_a^x f(t)dt=f(x)"],
      ["Fundamental Theorem of Calculus, Part 2", "Evaluate a definite integral using any antiderivative F.", "\\int_a^b f(x)dx=F(b)-F(a)"],
      ["Average value of a function", "Divide total accumulation by interval length.", "f_{avg}=\\frac{1}{b-a}\\int_a^b f(x)dx"],
      ["u-substitution", "Reverse the chain rule by replacing an inner expression and its differential."],
      ["Net change theorem", "The integral of a rate of change equals final quantity minus initial quantity.", "\\int_a^b F'(x)dx=F(b)-F(a)"],
      ["Area and signed area", "A definite integral counts regions below the axis negatively; geometric area uses absolute values."],
      ["Integration by parts", "BC: reverse the product rule to integrate products.", "\\int u\\,dv=uv-\\int v\\,du", "BC"],
      ["Partial fractions", "BC: decompose a rational function into simpler fractions before integrating.", null, "BC"],
      ["Improper integral", "BC: define an integral over an infinite interval or unbounded integrand using a limit.", "\\int_a^{\\infty}f(x)dx=\\lim_{b\\to\\infty}\\int_a^b f(x)dx", "BC"],
    ], [["How to move among Riemann sums, definite integrals, and the Fundamental Theorem of Calculus"], ["How to choose an integration technique", "BC"]]),

    unit(7, "Differential Equations", [
      ["Differential equation", "An equation involving an unknown function and one or more of its derivatives."],
      ["Slope field", "A grid of short segments showing the slope prescribed by a first-order differential equation."],
      ["Solution curve", "A function whose tangent slope satisfies the differential equation at every point in its interval."],
      ["Initial condition", "A specified point used to select one solution from a family of solutions."],
      ["Separation of variables", "Rearrange a separable differential equation so y terms and x terms can be integrated on opposite sides."],
      ["Exponential growth and decay", "A quantity whose rate is proportional to itself has an exponential solution.", "\\frac{dy}{dt}=ky\\Rightarrow y=Ce^{kt}"],
      ["Logistic differential equation", "BC: models limited growth with carrying capacity L.", "\\frac{dy}{dt}=ky(1-\\frac{y}{L})", "BC"],
      ["Logistic solution", "BC: a common solution form for logistic growth.", "y=\\frac{L}{1+Ae^{-kt}}", "BC"],
      ["Carrying capacity", "BC: the limiting population L in a logistic model.", null, "BC"],
      ["Euler’s method", "BC: repeatedly use tangent-line approximations to estimate a solution.", "y_{n+1}=y_n+f(x_n,y_n)\\Delta x", "BC"],
      ["Equilibrium solution", "A constant solution where the differential equation gives dy/dx = 0."],
      ["Particular solution", "A specific differential-equation solution satisfying given initial conditions."],
    ], [["How to solve or approximate a differential equation and interpret its slope field"]]),

    unit(8, "Applications of Integration", [
      ["Displacement from velocity", "Integrate velocity over the time interval.", "displacement=\\int_a^b v(t)dt"],
      ["Total distance traveled", "Integrate speed, splitting at velocity sign changes.", "distance=\\int_a^b|v(t)|dt"],
      ["Area between curves", "Integrate top minus bottom with respect to x, or right minus left with respect to y.", "A=\\int_a^b[upper-lower]dx"],
      ["Cross-sectional volume", "Integrate known cross-sectional area perpendicular to the axis.", "V=\\int_a^b A(x)dx"],
      ["Disk method", "Use circular cross sections with no central hole.", "V=\\pi\\int_a^b[R(x)]^2dx"],
      ["Washer method", "Subtract the inner disk area from the outer disk area.", "V=\\pi\\int_a^b([R(x)]^2-[r(x)]^2)dx"],
      ["Volume from a table", "Approximate the integral of cross-sectional area using a numerical integration method."],
      ["Accumulation function", "A function defined by a variable-bound integral; analyze it through the Fundamental Theorem."],
      ["Arc length of y=f(x)", "BC: integrate the speed of the parametrization (x,f(x)).", "L=\\int_a^b\\sqrt{1+[f'(x)]^2}dx", "BC"],
      ["Motion from acceleration", "Integrate acceleration to recover velocity, then use an initial value to determine the constant."],
      ["Rate-in/rate-out model", "Net change equals the integral of inflow rate minus outflow rate."],
    ], [["How to choose and set up an integral for area, cross-sectional volume, disks, or washers"], ["How to use an integral to find accumulation, displacement, total distance, and net change"]]),

    unit(9, "Parametric Equations, Polar Coordinates, and Vector-Valued Functions", [
      ["Parametric curve", "BC: defines x and y separately as functions of a parameter t.", "x=f(t),\\quad y=g(t)", "BC"],
      ["Parametric derivative", "BC: divide dy/dt by dx/dt when dx/dt is nonzero.", "\\frac{dy}{dx}=\\frac{dy/dt}{dx/dt}", "BC"],
      ["Second parametric derivative", "BC: differentiate dy/dx with respect to t, then divide by dx/dt.", "\\frac{d^2y}{dx^2}=\\frac{d}{dt}(dy/dx)\\div\\frac{dx}{dt}", "BC"],
      ["Parametric speed", "BC: magnitude of the velocity vector.", "speed=\\sqrt{(dx/dt)^2+(dy/dt)^2}", "BC"],
      ["Parametric arc length", "BC: integrate parametric speed.", "L=\\int_a^b\\sqrt{(dx/dt)^2+(dy/dt)^2}dt", "BC"],
      ["Vector-valued function", "BC: a function whose components describe coordinates such as position.", "r(t)=\\langle x(t),y(t)\\rangle", "BC"],
      ["Velocity vector", "BC: derivative of the position vector.", "v(t)=r'(t)=\\langle x'(t),y'(t)\\rangle", "BC"],
      ["Acceleration vector", "BC: derivative of velocity and second derivative of position.", "a(t)=v'(t)=r''(t)", "BC"],
      ["Polar coordinates", "BC: locate a point by directed distance r and angle θ." , "x=r\\cos\\theta,\\quad y=r\\sin\\theta", "BC"],
      ["Polar slope", "BC: treat x and y as parametric functions of θ.", "\\frac{dy}{dx}=\\frac{r'\\sin\\theta+r\\cos\\theta}{r'\\cos\\theta-r\\sin\\theta}", "BC"],
      ["Polar area", "BC: integrate one-half r squared over an angle interval.", "A=\\frac{1}{2}\\int_\\alpha^\\beta r^2d\\theta", "BC"],
      ["Area between polar curves", "BC: subtract inner radius squared from outer radius squared.", "A=\\frac{1}{2}\\int_\\alpha^\\beta(R^2-r^2)d\\theta", "BC"],
      ["Distance traveled parametrically", "BC: integrate the magnitude of velocity rather than displacement." , null, "BC"],
    ], [["How to analyze motion and derivatives from parametric or vector-valued functions", "BC"], ["How to find slope and enclosed area in polar coordinates", "BC"]]),

    unit(10, "Infinite Sequences and Series", [
      ["Sequence", "BC: an ordered list of numbers usually defined by an explicit or recursive rule.", null, "BC"],
      ["Sequence convergence", "BC: a sequence converges when its terms approach a finite limit.", "\\lim_{n\\to\\infty}a_n=L", "BC"],
      ["Infinite series", "BC: the sum of infinitely many terms, defined through the limit of partial sums.", "\\sum_{n=1}^{\\infty}a_n", "BC"],
      ["nth-term divergence test", "BC: if aₙ does not approach zero, the series diverges; approaching zero alone is inconclusive.", null, "BC"],
      ["Geometric series", "BC: converges for |r|<1 and diverges for |r|≥1.", "\\sum_{n=0}^{\\infty}ar^n=\\frac{a}{1-r}", "BC"],
      ["p-series", "BC: converges when p>1 and diverges when p≤1.", "\\sum_{n=1}^{\\infty}\\frac{1}{n^p}", "BC"],
      ["Harmonic series", "BC: the divergent p-series with p=1.", "\\sum_{n=1}^{\\infty}\\frac{1}{n}", "BC"],
      ["Integral test", "BC: compares a positive decreasing series with its corresponding improper integral.", null, "BC"],
      ["Comparison test", "BC: compares a nonnegative series with a known benchmark series.", null, "BC"],
      ["Limit comparison test", "BC: a positive finite limit of aₙ/bₙ makes the two positive-term series behave alike.", "\\lim_{n\\to\\infty}\\frac{a_n}{b_n}=L", "BC"],
      ["Alternating series test", "BC: an alternating series converges when term magnitudes decrease to zero.", null, "BC"],
      ["Absolute convergence", "BC: a series converges absolutely if the series of absolute values converges.", null, "BC"],
      ["Conditional convergence", "BC: a series converges but its absolute-value series diverges.", null, "BC"],
      ["Ratio test", "BC: L<1 gives absolute convergence and L>1 gives divergence; L=1 is inconclusive.", "L=\\lim_{n\\to\\infty}|\\frac{a_{n+1}}{a_n}|", "BC"],
      ["Alternating-series error bound", "BC: the error is at most the magnitude of the first omitted term.", "|R_N|\\le|a_{N+1}|", "BC"],
      ["Power series", "BC: an infinite polynomial centered at x=a.", "\\sum_{n=0}^{\\infty}c_n(x-a)^n", "BC"],
      ["Radius of convergence", "BC: the distance R from the center within which a power series converges." , null, "BC"],
      ["Interval of convergence", "BC: all x-values where a power series converges, with endpoints tested separately." , null, "BC"],
      ["Taylor series", "BC: represents a function using derivatives at a center a.", "\\sum_{n=0}^{\\infty}\\frac{f^{(n)}(a)}{n!}(x-a)^n", "BC"],
      ["Maclaurin series", "BC: a Taylor series centered at zero." , null, "BC"],
      ["Lagrange error bound", "BC: bounds Taylor polynomial error using a maximum higher derivative.", "|R_n(x)|\\le\\frac{M|x-a|^{n+1}}{(n+1)!}", "BC"],
    ], [["How to choose and apply a convergence test for an infinite series", "BC"], ["How to build a Taylor series and bound approximation error", "BC"]]),
  ];

  const question = (prompt, answer, options, difficulty = "Medium", courseLevel = "") => ({
    type: "mcq", prompt, answer, options: [answer, ...options], difficulty, ...(courseLevel ? { courseLevel } : {}),
  });

  window.AP_CALCULUS_QUESTIONS_FOR_TOPIC = (topicNumber, topicTitle) => {
    const unitNumber = Number(String(topicNumber).split(".")[0]);
    const bcTopic = unitNumber >= 9 || /bc only/i.test(topicTitle);
    const withLevel = (items) => items.map((item) => bcTopic ? { ...item, courseLevel: "BC" } : item);
    if (unitNumber === 1) {
      if (/(Continuity|Discontinuit|Intermediate Value)/i.test(topicTitle)) return withLevel([
        question("For x ≠ 2, f(x) = (x² − 4)/(x − 2), and f(2) = k. What value of k makes f continuous at x = 2?", "4", ["0", "2", "Does not exist"], "Easy"),
        question("The function f(x) = x³ + x − 1 is continuous on [0,1], with f(0) < 0 and f(1) > 0. What does the Intermediate Value Theorem guarantee?", "At least one zero lies in (0,1)", ["Exactly one zero lies in (0,1)", "f has a horizontal tangent", "f is differentiable everywhere"]),
        question("A piecewise function has left-hand limit 3 and right-hand limit 5 at x = 1. Which conclusion is correct?", "The two-sided limit does not exist", ["The limit equals 4", "The limit equals 5", "The function must be continuous"], "Hard"),
      ]);
      if (/(Infinite Limits|Asymptote|Limits at Infinity)/i.test(topicTitle)) return withLevel([
        question("Evaluate lim x→∞ (3x² − 1)/(2x² + 4).", "3/2", ["0", "1", "∞"], "Easy"),
        question("For f(x) = 1/(x − 2), what is lim x→2⁺ f(x)?", "+∞", ["−∞", "0", "2"]),
        question("What horizontal asymptote does f(x) = (5x³ + x)/(2x³ − 7) have?", "y = 5/2", ["x = 5/2", "y = 0", "No horizontal asymptote"], "Hard"),
      ]);
      return withLevel([
        question("Evaluate lim x→3 (x² − 9)/(x − 3).", "6", ["0", "3", "Does not exist"], "Easy"),
        question("Evaluate lim x→0 sin(5x)/x.", "5", ["0", "1", "Does not exist"]),
        question("If 2 − x² ≤ f(x) ≤ 2 + x² near x = 0, what is lim x→0 f(x)?", "2", ["0", "4", "Cannot be determined"], "Hard"),
      ]);
    }
    if (unitNumber === 2) return withLevel([
      question("If f(x) = 3x⁴ − 5x² + 7, what is f′(1)?", "2", ["−2", "7", "12"], "Easy"),
      question("Differentiate f(x) = x²eˣ.", "f′(x) = eˣ(x² + 2x)", ["f′(x) = 2xeˣ", "f′(x) = x²eˣ", "f′(x) = eˣ(x² − 2x)"]),
      question("Differentiate f(x) = (x² + 1)/x.", "f′(x) = 1 − 1/x²", ["f′(x) = 2", "f′(x) = 1 + 1/x²", "f′(x) = (2x + 1)/x²"], "Hard"),
      question("Using the limit definition, what is the derivative of f(x) = x² at x = 3?", "6", ["3", "9", "12"], "Hard"),
    ]);
    if (unitNumber === 3) {
      if (/Implicit/i.test(topicTitle)) return withLevel([
        question("For x² + y² = 25, what is dy/dx at (3,4)?", "−3/4", ["3/4", "−4/3", "4/3"], "Easy"),
        question("For x³ + y³ = 6xy, which expression equals dy/dx?", "(2y − x²)/(y² − 2x)", ["(x² − 2y)/(y² − 2x)", "(2x − y²)/(x² − 2y)", "3x² + 3y²"]),
        question("The curve x² + xy + y² = 7 passes through (1,2). What is the slope there?", "−4/5", ["−5/4", "4/5", "5/4"], "Hard"),
      ]);
      if (/Inverse/i.test(topicTitle)) return withLevel([
        question("If f(2) = 5 and f′(2) = 3, what is (f⁻¹)′(5)?", "1/3", ["2/5", "3", "5/2"], "Easy"),
        question("Differentiate y = arcsin(2x).", "y′ = 2/√(1 − 4x²)", ["y′ = 1/√(1 − 4x²)", "y′ = 2/(1 + 4x²)", "y′ = −2/√(1 − 4x²)"]),
        question("If g(x) = x³ + x, what is (g⁻¹)′(2)?", "1/4", ["1/2", "2", "4"], "Hard"),
      ]);
      return withLevel([
        question("Differentiate y = sin(x²).", "y′ = 2x cos(x²)", ["y′ = cos(x²)", "y′ = 2x sin(x²)", "y′ = cos(2x)"] , "Easy"),
        question("Differentiate y = e^(3x² − 1).", "y′ = 6xe^(3x² − 1)", ["y′ = 3e^(3x² − 1)", "y′ = 6xe^(6x)", "y′ = e^(6x)"]),
        question("If y = x⁴ − 2x³, what is y‴?", "24x − 12", ["12x² − 12x", "24x − 4", "24"], "Hard"),
      ]);
    }
    if (unitNumber === 4) {
      if (/Related Rates/i.test(topicTitle)) return withLevel([
        question("A sphere’s radius increases at 2 cm/s. How fast is its volume increasing when r = 3 cm?", "72π cm³/s", ["18π cm³/s", "36π cm³/s", "108π cm³/s"], "Easy"),
        question("A 10 ft ladder rests against a wall. Its base moves away at 2 ft/s. How fast is the top moving when the base is 6 ft from the wall?", "−1.5 ft/s", ["−2 ft/s", "−2.5 ft/s", "+1.5 ft/s"]),
        question("Water enters a cone of height 12 m and radius 4 m at 3 m³/min. How fast is the depth changing when the water is 6 m deep?", "3/(4π) m/min", ["1/(12π) m/min", "1/(4π) m/min", "3/(2π) m/min"], "Hard"),
        question("A spotlight 20 m from a straight wall rotates at 0.10 rad/s. When the beam makes an angle of π/4 with the perpendicular to the wall, how fast is the light spot moving along the wall?", "4.0 m/s", ["1.0 m/s", "2.0 m/s", "8.0 m/s"], "Hard"),
      ]);
      return withLevel([
        question("A particle has position s(t) = t³ − 6t² + 9t. What is its velocity at t = 2?", "−3", ["0", "3", "9"], "Easy"),
        question("Use linearization at x = 4 to approximate √4.1.", "2.025", ["2.005", "2.05", "2.10"]),
        question("Evaluate lim x→0 (eˣ − 1)/x.", "1", ["0", "e", "Does not exist"], "Hard"),
      ]);
    }
    if (unitNumber === 5) return withLevel([
      question("For f(x) = x³ − 3x, where does f have a local maximum?", "x = −1", ["x = 0", "x = 1", "x = 3"], "Easy"),
      question("For f(x) = x² on [1,3], what value c satisfies the Mean Value Theorem?", "c = 2", ["c = 1", "c = √3", "c = 3"]),
      question("A rectangle has perimeter 40. What dimensions maximize its area?", "10 by 10", ["5 by 15", "8 by 12", "4 by 16"]),
      question("For f(x) = x⁴ − 4x², where are the inflection points’ x-coordinates?", "x = ±√(2/3)", ["x = 0", "x = ±1", "x = ±√2"], "Hard"),
    ]);
    if (unitNumber === 6) {
      if (/Integration by Parts/i.test(topicTitle)) return withLevel([
        question("Evaluate ∫xeˣ dx.", "(x − 1)eˣ + C", ["xeˣ + C", "(x + 1)eˣ + C", "x²eˣ/2 + C"], "Hard", "BC"),
        question("Evaluate ∫ln x dx.", "x ln x − x + C", ["x ln x + C", "(ln x)²/2 + C", "1/x + C"], "Hard", "BC"),
        question("Which choice is best for u in ∫x² sin x dx?", "u = x²", ["u = sin x", "u = cos x", "u = x² sin x"], "Medium", "BC"),
      ]);
      if (/Partial Fractions|Improper/i.test(topicTitle)) return withLevel([
        question("Decompose 1/[x(x+1)] into partial fractions.", "1/x − 1/(x+1)", ["1/x + 1/(x+1)", "−1/x + 1/(x+1)", "1/(x+1)"], "Hard", "BC"),
        question("Does ∫₁^∞ 1/x² dx converge, and if so, to what value?", "It converges to 1", ["It converges to 0", "It converges to 2", "It diverges"], "Hard", "BC"),
        question("Does ∫₁^∞ 1/x dx converge?", "No, it diverges", ["Yes, to 0", "Yes, to 1", "Yes, to ln 2"], "Hard", "BC"),
      ]);
      return withLevel([
        question("Evaluate ∫₀² 3x² dx.", "8", ["4", "6", "12"], "Easy"),
        question("Evaluate ∫2x cos(x²) dx.", "sin(x²) + C", ["2 sin(x²) + C", "cos(x²) + C", "x² sin(x²) + C"]),
        question("Find d/dx [∫₁^(x²) ln(t) dt].", "2x ln(x²)", ["ln(x²)", "x² ln x", "2x/x²"]),
        question("Use a right Riemann sum with 4 equal subintervals to approximate ∫₀² x² dx.", "3.75", ["1.75", "2.75", "4.00"], "Hard"),
        question("Let F(x)=∫₀ˣ (t³−3t²+2)dt. At which x-value in (0,3) does F have a local maximum?", "x = 1", ["x = 0", "x = 2", "x = 3"], "Hard"),
      ]);
    }
    if (unitNumber === 7) return withLevel([
      question("Solve dy/dx = 3x² with y(0) = 2.", "y = x³ + 2", ["y = 3x + 2", "y = x³", "y = 3x² + 2"], "Easy"),
      question("Solve dy/dx = 2xy with y(0) = 3.", "y = 3e^(x²)", ["y = 3e^(2x)", "y = e^(x²) + 2", "y = 3x²"]),
      question("Use Euler’s method for y′ = x + y, y(0)=1, with two steps of size 0.5. Estimate y(1).", "2.5", ["2.0", "2.25", "2.75"], "Hard", "BC"),
      question("For dP/dt = 0.1P(1 − P/1000), what is dP/dt when P = 200?", "16", ["8", "20", "80"], "Hard", "BC"),
    ]);
    if (unitNumber === 8) return withLevel([
      question("What is the average value of f(x)=x² on [0,3]?", "3", ["1", "4.5", "9"], "Easy"),
      question("Find the area enclosed by y=x and y=x² on [0,1].", "1/6", ["1/3", "1/2", "2/3"]),
      question("The region under y=√x from x=0 to x=4 is revolved about the x-axis. What is the volume?", "8π", ["4π", "16π/3", "16π"]),
      question("A particle has velocity v(t)=t²−4t+3. What is its displacement from t=0 to t=4?", "4/3", ["−4/3", "4", "20/3"], "Hard"),
      question("The base of a solid is the region between y=x² and y=4. Cross sections perpendicular to the y-axis are squares. What integral gives the volume?", "∫₀⁴ 4y dy", ["∫₀² (4−x²)² dx", "∫₀⁴ (4−y²) dy", "∫₋₂² (4−x²) dx"], "Hard"),
    ]);
    if (unitNumber === 9) return withLevel([
      question("For x=t²+1 and y=t³, what is dy/dx at t=2?", "3", ["3/2", "2", "6"], "Easy", "BC"),
      question("For x=t²+1 and y=t³, what is d²y/dx² at t=2?", "3/8", ["3/4", "3/2", "6"], "Hard", "BC"),
      question("A particle has x=3t and y=4t. What is its speed?", "5", ["1", "7", "12"], "Medium", "BC"),
      question("Find the area inside r=2cos θ for −π/2≤θ≤π/2.", "π", ["π/2", "2π", "4π"], "Hard", "BC"),
    ]);
    return withLevel([
      question("Evaluate the geometric series Σ from n=0 to ∞ of 3(1/2)ⁿ.", "6", ["3", "9/2", "∞"], "Easy", "BC"),
      question("Does Σ 1/n^(3/2) converge?", "Yes, as a p-series with p>1", ["No, because its terms are positive", "No, by the nth-term test", "The test is inconclusive"], "Medium", "BC"),
      question("For Σ n!/3ⁿ, what does the ratio test show?", "The series diverges", ["The series converges absolutely", "The series converges conditionally", "The ratio test is inconclusive"], "Hard", "BC"),
      question("What is the third-degree Maclaurin polynomial for eˣ?", "1 + x + x²/2 + x³/6", ["1 + x + x² + x³", "x + x²/2 + x³/3", "1 + x²/2 + x⁴/24"], "Hard", "BC"),
      question("For Σ[(x−2)/5]ⁿ, what is the interval of convergence?", "(−3,7)", ["[−3,7]", "(−5,5)", "(−∞,∞)"], "Hard", "BC"),
      question("An alternating series satisfies |aₙ₊₁|<|aₙ| and |a₇|=0.004. What is the greatest guaranteed error when the sum is approximated through a₆?", "0.004", ["0.008", "0.024", "The error cannot be bounded"], "Hard", "BC"),
    ]);
  };
})();
