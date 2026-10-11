#!/usr/bin/env python3
"""Generate the built-in AP Statistics study collection and equation SVGs."""

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist" / "apstats-data.js"
IMAGE_DIR = ROOT / "dist" / "ap-statistics-images"


def rows(block):
    return [tuple(part.strip() for part in line.split("|", 1)) for line in block.strip().splitlines() if line.strip()]


UNITS = [
    {
        "name": "Exploring One-Variable Data and Collecting Data",
        "cards": rows(r"""
statistical study|A study that collects data from a sample to answer an investigative question about a larger population.
investigative question|A question with a defined purpose that can be answered by collecting and analyzing data.
population|The entire group of individuals or items about which a study seeks information.
sample|The subset of a population from which data are actually collected.
observational unit|An individual or item from which a datum is collected.
variable|A characteristic that can vary from one observational unit to another.
categorical variable|A variable whose values place observational units into groups or categories.
quantitative variable|A variable whose numerical values represent measured or counted quantities.
discrete quantitative variable|A quantitative variable with a finite or countably infinite set of possible values.
continuous quantitative variable|A quantitative variable that can take any value within an interval.
parameter|A numerical value that describes a population.
statistic|A numerical value calculated from sample data.
frequency table|A table showing the count of observational units in each category.
relative frequency table|A table showing the proportion or percentage of observational units in each category.
bar chart|A graph using separated bars to display frequencies or relative frequencies of categories.
pie chart|A circle divided into sectors whose areas represent category proportions.
dotplot|A quantitative-data display that places a dot for each observation above its value on a number line.
stem-and-leaf plot|A quantitative-data display that separates each value into a stem and a leaf while preserving individual observations.
histogram|A graph using adjacent bars to display frequencies or relative frequencies across quantitative intervals.
distribution|The pattern of values a variable takes, described by shape, center, variability, and unusual features.
unimodal distribution|A distribution with one prominent peak.
bimodal distribution|A distribution with two prominent peaks.
symmetric distribution|A distribution whose two sides are approximately mirror images.
skewed right|A distribution with a longer tail toward larger values.
skewed left|A distribution with a longer tail toward smaller values.
mean|The arithmetic average of a quantitative data set; it is sensitive to extreme values.
median|The middle ordered value, or the average of the two middle values; it is resistant to extreme values.
range|The maximum value minus the minimum value.
first quartile (Q1)|The median of the lower half of an ordered data set.
third quartile (Q3)|The median of the upper half of an ordered data set.
interquartile range (IQR)|The spread of the middle 50% of data, calculated as Q3 minus Q1.
standard deviation|A measure of typical distance between observations and their mean.
variance|The square of the standard deviation; the average squared deviation using the appropriate population or sample divisor.
five-number summary|The minimum, Q1, median, Q3, and maximum of a quantitative data set.
boxplot|A graph based on the five-number summary that displays center, spread, and potential outliers.
potential outlier|A value below Q1 - 1.5(IQR) or above Q3 + 1.5(IQR).
z-score|The number of standard deviations a value lies above or below the mean.
percentile|The percentage of observations at or below a specified value.
resistant statistic|A statistic that is not strongly affected by extreme observations, such as the median or IQR.
observational study|A study that observes variables without assigning treatments to experimental units.
experiment|A study in which researchers assign treatments to experimental units to investigate their effects.
explanatory variable|A variable that may explain or predict changes in a response variable.
response variable|The outcome variable measured in a study.
confounding variable|A variable related to both the explanatory and response variables that provides an alternative explanation for an observed association.
sampling frame|The list or practical representation of the population from which a sample is selected.
census|An attempt to collect data from every member of a population.
random sample|A sample selected using chance so that selection probabilities are known.
simple random sample (SRS)|A sample selected so every possible sample of a given size has an equal chance of selection.
stratified random sample|A sample formed by dividing a population into homogeneous strata and taking an SRS from every stratum.
cluster random sample|A sample formed by dividing a population into clusters that each resemble the population, randomly selecting clusters, and sampling everyone in the chosen clusters.
systematic random sample|A sample created by choosing a random starting point and then selecting every kth member of an ordered population.
multistage random sample|A sample selected through multiple random stages, often combining cluster and simple random sampling.
sampling with replacement|A method in which a selected observational unit is returned and may be selected again.
sampling without replacement|A method in which each selected observational unit can appear only once.
convenience sample|A sample chosen from individuals easiest to reach; it commonly produces selection bias.
voluntary response sample|A sample consisting of people who choose themselves by responding to an open invitation.
bias|A systematic error that makes a sample statistic consistently too high or too low for the parameter it estimates.
selection bias|Bias caused when some groups are systematically overrepresented or underrepresented by the sampling method.
undercoverage|Selection bias that occurs when some groups are left out or inadequately represented in the sampling frame.
nonresponse bias|Bias that can occur when selected individuals who do not respond differ meaningfully from those who do.
response bias|Bias caused by inaccurate answers resulting from wording, interviewer influence, social desirability, faulty memory, or other response effects.
random assignment|Use of chance to assign treatments, helping create comparable groups and permitting cause-and-effect conclusions.
treatment|A specific experimental condition imposed on an experimental unit.
experimental unit|The observational unit to which a treatment is assigned.
factor|An explanatory variable whose levels are controlled by the experimenter.
level|A specific value or category of an experimental factor.
control group|A comparison group that receives a standard treatment, placebo, or no treatment.
placebo|An inert treatment designed to resemble an active treatment.
placebo effect|A response caused by the expectation of receiving a treatment rather than by the treatment itself.
single-blind experiment|An experiment in which participants do not know which treatment they receive, or evaluators do not know which treatment was assigned.
double-blind experiment|An experiment in which neither participants nor response evaluators know treatment assignments.
replication|Use of enough experimental units in each treatment group to estimate treatment effects and natural variability.
completely randomized design|An experimental design that assigns all treatments to all experimental units entirely by chance.
randomized block design|An experimental design that groups similar units into blocks and randomly assigns treatments within each block.
matched pairs design|A block design comparing two treatments by matching similar units or applying both treatments to each unit in randomized order.
block|A group of experimental units similar in a characteristic expected to affect the response.
statistical significance|A result unlikely to occur by chance alone under a specified null model.
scope of inference|The population and type of conclusion supported by a study's sampling and assignment methods.
"""),
        "feynman": ["Choosing a sampling method", "Sources of sampling bias", "Observational studies vs. experiments", "Random assignment and causal inference", "Designing a controlled experiment", "Describing a quantitative distribution", "Center, spread, and resistant statistics"],
    },
    {
        "name": "Probability, Random Variables, and Probability Distributions",
        "cards": rows(r"""
random process|A repeatable process whose individual outcomes are uncertain but whose long-run pattern is predictable.
sample space|The set of all possible outcomes of a random process.
event|A subset of outcomes in a sample space.
probability|A number from 0 to 1 describing the long-run relative frequency of an event.
complement rule|The probability that event A does not occur equals 1 minus the probability that A occurs.
addition rule|A rule for finding the probability that event A or event B occurs while avoiding double-counting their overlap.
disjoint events|Events that cannot occur at the same time.
conditional probability|The probability of an event given that another event has occurred.
independent events|Events for which knowing one occurred does not change the probability of the other.
multiplication rule|A rule expressing a joint probability as a conditional probability multiplied by a marginal probability.
two-way table|A table displaying counts or relative frequencies for two categorical variables.
marginal distribution|The distribution of one categorical variable using row or column totals from a two-way table.
conditional distribution|The distribution of one categorical variable within a fixed category of another variable.
simulation|Use of a chance process to imitate repeated trials and estimate a probability.
random variable|A numerical variable whose value is determined by the outcome of a random process.
probability distribution|A listing or model that assigns probabilities to possible values of a random variable.
expected value|The long-run average value of a random variable over many repetitions.
linear transformation|A transformation of the form a + bX that shifts and rescales a random variable.
binomial setting|A fixed number of independent trials with two outcomes and constant success probability.
binomial random variable|The number of successes in a fixed number of independent Bernoulli trials.
binomial coefficient|The number of different ways to choose x successes from n trials.
geometric setting|Independent trials with two outcomes and constant success probability, repeated until the first success.
geometric random variable|The number of trials required to obtain the first success.
normal distribution|A symmetric bell-shaped continuous distribution determined by its mean and standard deviation.
standard normal distribution|The normal distribution with mean 0 and standard deviation 1.
normal probability plot|A graph used to assess normality; approximately linear points support a normal model.
law of large numbers|As the number of independent repetitions increases, a sample mean or proportion tends to approach its expected value.
"""),
        "feynman": ["Conditional probability and independence", "Building a probability model", "Binomial vs. geometric distributions", "Combining random variables"],
    },
    {
        "name": "Inference for Categorical Data: Proportions",
        "cards": rows(r"""
estimator|A statistic used to estimate an unknown population parameter.
point estimate|A single statistic used as the best estimate of a population parameter.
unbiased estimator|An estimator whose sampling distribution has a mean equal to the parameter being estimated.
sampling distribution|The distribution of a statistic over all possible samples of a fixed size from a population.
sampling variability|Natural sample-to-sample variation in a statistic.
standard error|An estimate of the standard deviation of a statistic's sampling distribution.
central limit theorem|A result explaining when a standardized sampling distribution is approximately normal.
10% condition|When sampling without replacement, the sample should be no more than 10% of the population to treat observations as approximately independent.
large-counts condition|A success-failure condition requiring sufficiently large expected counts for a normal approximation.
confidence interval|An interval of plausible values for a population parameter calculated from sample data.
confidence level|The long-run percentage of intervals from repeated random samples that capture the true parameter.
critical value|A multiplier from a reference distribution that determines the confidence interval's margin of error.
margin of error|The critical value multiplied by the standard error.
one-proportion z-interval|A confidence interval for one population proportion based on a sample proportion and an unpooled standard error.
null hypothesis|A statement about a population parameter treated as true while calculating a test probability.
alternative hypothesis|The claim supported when the data provide sufficiently strong evidence against the null hypothesis.
significance level|The chosen probability threshold alpha for deciding whether evidence against the null hypothesis is strong enough.
test statistic|A standardized measure of how far a sample statistic lies from the null-hypothesized parameter value.
p-value|Assuming the null hypothesis is true, the probability of a test statistic at least as extreme as the observed result in the direction of the alternative.
one-proportion z-test|A significance test for a claim about one population proportion.
Type I error|Rejecting a true null hypothesis; its probability is alpha.
Type II error|Failing to reject a false null hypothesis; its probability is beta.
power|The probability that a test correctly rejects a false null hypothesis.
statistically significant result|A test result with a p-value less than or equal to the chosen significance level.
practically significant result|A result large enough to matter in its real-world context, regardless of statistical significance.
sampling distribution of a difference in proportions|The distribution of p-hat1 minus p-hat2 across repeated independent samples.
two-proportion z-interval|A confidence interval for the difference between two population proportions using an unpooled standard error.
pooled sample proportion|The combined successes divided by the combined sample size, used in a two-proportion z-test under equality of proportions.
two-proportion z-test|A significance test comparing two population proportions under a null hypothesis of equality.
chi-square statistic|A sum measuring discrepancy between observed and expected categorical counts.
chi-square goodness-of-fit test|A test of whether one categorical variable follows a specified distribution.
chi-square test for homogeneity|A test comparing the distribution of one categorical variable across several populations or treatments.
chi-square test for independence|A test of association between two categorical variables within one population.
expected count|The count predicted for a category or table cell when the null hypothesis is true.
degrees of freedom|A quantity determining the chi-square or t reference distribution after accounting for constraints.
chi-square contribution|A cell's contribution, (observed - expected)^2 / expected, to the total chi-square statistic.
"""),
        "feynman": ["Sampling distributions for proportions", "Confidence intervals for proportions", "Logic of significance testing", "Type I error, Type II error, and power", "One proportion vs. two proportions", "Choosing among chi-square procedures"],
    },
    {
        "name": "Inference for Quantitative Data: Means",
        "cards": rows(r"""
sampling distribution of a sample mean|The distribution of x-bar over all possible random samples of a fixed size.
standard error of the sample mean|The estimated standard deviation of the sampling distribution of x-bar, calculated with s divided by square root of n.
t-distribution|A symmetric distribution with heavier tails than the standard normal distribution; its shape depends on degrees of freedom.
degrees of freedom for one-sample t|For a one-sample t procedure, df equals n minus 1.
one-sample t-interval|A confidence interval for a population mean when the population standard deviation is unknown.
paired data|Observations linked in meaningful pairs, such as before-and-after measurements on the same subjects.
mean difference|The average of within-pair differences in a matched-pairs analysis.
matched-pairs t-interval|A one-sample t-interval applied to paired differences.
one-sample t-test|A significance test for a population mean when the population standard deviation is unknown.
matched-pairs t-test|A one-sample t-test applied to paired differences.
robust procedure|A method that continues to work reasonably well when assumptions are moderately violated.
two-sample t-interval|A confidence interval for the difference between two independent population means.
two-sample t-test|A significance test comparing two independent population means.
independent samples|Samples whose observations and selection processes do not influence one another.
pooled t-procedure|A two-sample method that assumes equal population variances; it is generally not the default AP Statistics procedure.
standard error for two means|The square root of s1 squared over n1 plus s2 squared over n2.
sample-size effect|Larger samples reduce standard error and usually produce narrower intervals and more powerful tests.
confidence-level effect|Higher confidence requires a larger critical value and produces a wider confidence interval.
"""),
        "feynman": ["Sampling distributions for means", "The t-distribution", "Matched pairs vs. independent samples", "Confidence intervals and tests for means"],
    },
    {
        "name": "Regression Analysis",
        "cards": rows(r"""
bivariate quantitative data|Ordered pairs of observations measured on two quantitative variables.
scatterplot|A graph of paired quantitative data used to examine form, direction, strength, and unusual features.
association|A relationship in which values of one variable tend to occur with particular values of another.
positive association|An association in which larger values of one variable tend to occur with larger values of the other.
negative association|An association in which larger values of one variable tend to occur with smaller values of the other.
correlation coefficient|The unit-free statistic r measuring direction and strength of a linear association, from -1 to 1.
linear regression model|An equation using an explanatory variable to predict a quantitative response variable.
explanatory variable in regression|The x-variable used to predict or explain changes in the response.
response variable in regression|The y-variable being predicted by a regression model.
least-squares regression line|The line minimizing the sum of squared residuals.
predicted value|The response value y-hat produced by a regression equation for a given x-value.
residual|Observed response minus predicted response.
residual plot|A graph of residuals against explanatory values or predicted values used to assess model fit.
coefficient of determination|The value r-squared, interpreted as the proportion of response variability explained by the linear model.
slope of a regression line|The predicted change in the response variable for a one-unit increase in the explanatory variable.
y-intercept of a regression line|The predicted response when x equals zero, meaningful only when zero is relevant and within the model's scope.
influential point|A point whose removal substantially changes a regression model or another summary.
high-leverage point|A point with an unusual explanatory-variable value that has potential to strongly affect the regression line.
extrapolation|Use of a model to predict outside the range of observed explanatory values; such predictions may be unreliable.
correlation is not causation|A strong association alone does not establish that changes in one variable cause changes in another.
standard error of the slope|The estimated standard deviation of the sampling distribution of the least-squares slope.
t-test for a regression slope|A test of whether the population regression slope differs from a hypothesized value, usually zero.
t-interval for a regression slope|A confidence interval estimating the population slope of a linear regression model.
"""),
        "feynman": ["Interpreting correlation and regression", "Residuals and model fit", "Influential points and extrapolation"],
    },
]


FORMULAS = {
    1: [
        ("Sample mean", "Use to calculate the arithmetic average of n observations.", "x̄ = (Σxᵢ) / n"),
        ("Sample standard deviation", "Use to measure typical distance from the sample mean.", "s = √[Σ(xᵢ − x̄)² / (n − 1)]"),
        ("Interquartile range", "Use to measure the spread of the middle half of a distribution.", "IQR = Q₃ − Q₁"),
        ("Outlier fences", "Use to flag potential low and high outliers.", "Lower = Q₁ − 1.5(IQR)     Upper = Q₃ + 1.5(IQR)"),
        ("z-score", "Use to express a value's distance from the mean in standard deviations.", "z = (x − μ) / σ"),
    ],
    2: [
        ("Addition rule", "Use to find the probability of A or B without double-counting their overlap.", "P(A ∪ B) = P(A) + P(B) − P(A ∩ B)"),
        ("Conditional probability", "Use to find the probability of A given that B occurred.", "P(A | B) = P(A ∩ B) / P(B)"),
        ("Expected value of a random variable", "Use to find the long-run mean of a discrete random variable.", "μₓ = E(X) = Σ[x · P(X = x)]"),
        ("Standard deviation of a random variable", "Use to measure spread around a discrete random variable's expected value.", "σₓ = √Σ[(x − μₓ)² · P(X = x)]"),
        ("Binomial probability", "Use for exactly x successes in n independent trials with constant success probability p.", "P(X = x) = C(n,x)pˣ(1 − p)ⁿ⁻ˣ"),
        ("Binomial mean and standard deviation", "Use for the center and spread of a binomial random variable.", "μ = np     σ = √[np(1 − p)]"),
        ("Geometric probability", "Use for the probability that the first success occurs on trial x.", "P(X = x) = (1 − p)ˣ⁻¹p"),
        ("Geometric mean", "Use for the expected number of trials until the first success.", "μ = 1 / p"),
    ],
    3: [
        ("Sampling distribution of p-hat", "Use for the mean and standard deviation of a sample proportion.", "μₚ̂ = p     σₚ̂ = √[p(1 − p) / n]"),
        ("One-proportion z-interval", "Use to estimate one population proportion.", "p̂ ± z* √[p̂(1 − p̂) / n]"),
        ("One-proportion z-test", "Use to test H₀: p = p₀. The null value p₀ belongs in the standard error.", "z = (p̂ − p₀) / √[p₀(1 − p₀) / n]"),
        ("Two-proportion z-interval", "Use to estimate p₁ − p₂ with independent samples.", "(p̂₁ − p̂₂) ± z* √[p̂₁(1−p̂₁)/n₁ + p̂₂(1−p̂₂)/n₂]"),
        ("Pooled proportion", "Use in a two-proportion z-test under H₀: p₁ = p₂.", "p̂c = (x₁ + x₂) / (n₁ + n₂)"),
        ("Two-proportion z-test", "Use to test H₀: p₁ = p₂ using the pooled proportion.", "z = [(p̂₁ − p̂₂) − 0] / √[p̂c(1−p̂c)(1/n₁ + 1/n₂)]"),
        ("Chi-square statistic", "Use to compare observed categorical counts with counts expected under H₀.", "χ² = Σ[(observed − expected)² / expected]"),
        ("Expected count in a two-way table", "Use under a chi-square null model for a table cell.", "Expected = (row total × column total) / table total"),
    ],
    4: [
        ("Sampling distribution of x-bar", "Use for the mean and standard deviation of a sample mean.", "μₓ̄ = μ     σₓ̄ = σ / √n"),
        ("One-sample t-interval", "Use to estimate a population mean when σ is unknown.", "x̄ ± t* · s/√n     df = n − 1"),
        ("One-sample t-test", "Use to test H₀: μ = μ₀ when σ is unknown.", "t = (x̄ − μ₀) / (s/√n)"),
        ("Matched-pairs t-test", "Use a one-sample t-test on paired differences.", "t = (x̄d − μd,0) / (s_d/√n)"),
        ("Two-sample t-interval", "Use to estimate μ₁ − μ₂ from independent samples.", "(x̄₁ − x̄₂) ± t* √(s₁²/n₁ + s₂²/n₂)"),
        ("Two-sample t-test", "Use to test a difference between two independent population means.", "t = [(x̄₁ − x̄₂) − (μ₁ − μ₂)₀] / √(s₁²/n₁ + s₂²/n₂)"),
    ],
    5: [
        ("Least-squares regression line", "Use to predict a response y from an explanatory value x.", "ŷ = a + bx"),
        ("Regression slope", "Use to calculate the least-squares slope from correlation and sample standard deviations.", "b = r(sᵧ / sₓ)"),
        ("Regression intercept", "Use to calculate the intercept after finding the slope.", "a = ȳ − bx̄"),
        ("Residual", "Use to measure prediction error for an observation.", "residual = observed y − predicted ŷ"),
        ("Correlation coefficient", "Use to standardize and summarize linear association.", "r = [1/(n−1)] Σ[(xᵢ−x̄)/sₓ][(yᵢ−ȳ)/sᵧ]"),
        ("t-test for regression slope", "Use to test H₀: β = 0 for a linear population model.", "t = b / SE_b     df = n − 2"),
    ],
}


def svg_for(title, equation):
    safe_title = html.escape(title)
    safe_equation = html.escape(equation)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330">
<rect width="1200" height="330" rx="30" fill="#f7f7ff"/>
<rect x="2" y="2" width="1196" height="326" rx="28" fill="none" stroke="#5c59dc" stroke-width="4"/>
<text x="600" y="92" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="34" font-weight="700" fill="#5c59dc">{safe_title}</text>
<text x="600" y="210" text-anchor="middle" font-family="STIX Two Math, Cambria Math, Times New Roman, serif" font-size="54" fill="#171b2d">{safe_equation}</text>
</svg>'''


def main():
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    decks = []
    for unit_number, spec in enumerate(UNITS, 1):
        cards = []
        for index, (front, back) in enumerate(spec["cards"], 1):
            cards.append({"id": f"apstats-u{unit_number}-c{index}", "front": front, "back": back})
        for formula_index, (front, back, equation) in enumerate(FORMULAS[unit_number], 1):
            filename = f"unit-{unit_number}-formula-{formula_index}.svg"
            (IMAGE_DIR / filename).write_text(svg_for(front, equation), encoding="utf-8")
            cards.append({
                "id": f"apstats-u{unit_number}-eq{formula_index}",
                "front": front,
                "back": back,
                "backImage": f"./ap-statistics-images/{filename}",
            })
        prompts = [{"id": f"apstats-u{unit_number}-f{index}", "prompt": prompt} for index, prompt in enumerate(spec["feynman"], 1)]
        decks.append({
            "id": f"apstats-unit-{unit_number}",
            "name": f"AP Statistics · Unit {unit_number}",
            "shortName": f"Unit {unit_number}: {spec['name']}",
            "builtIn": True,
            "sourceTitle": "AP Statistics Course and Exam Description, Effective Fall 2026",
            "sourceUrl": "https://apcentral.collegeboard.org/media/pdf/ap-statistics-course-and-exam-description-effective-fall-2026.pdf",
            "cards": cards,
            "questions": [],
            "feynmanPrompts": prompts,
        })
    OUT.write_text("window.AP_STATISTICS_DECKS = " + json.dumps(decks, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Generated {sum(len(deck['cards']) for deck in decks)} cards, {sum(len(deck['feynmanPrompts']) for deck in decks)} Feynman topics, and {sum(len(items) for items in FORMULAS.values())} equation images.")


if __name__ == "__main__":
    main()
