#!/usr/bin/env python3
"""Generate a curated AP U.S. Government and Politics deck from the supplied guide."""

import json
import pathlib
import sys


SOURCE_TITLE = "AP US Government Study Guide - Simple Studies"
SOURCE_URL = "https://cdn.prod.website-files.com/605fe570e5454a357d1e1811/609ee0f13f32db744748c2ee_AP-US-Government-Study-Guide.pdf"


UNITS = [
    ("1", "Foundations of American Democracy", [
        ("Social contract", "An agreement in which people accept government authority in exchange for protection of their rights and maintenance of social order."),
        ("Natural rights", "Fundamental rights inherent to all people, identified by John Locke as life, liberty, and property and reflected in the Declaration of Independence."),
        ("Popular sovereignty", "The principle that legitimate governmental power comes from the consent of the people."),
        ("Republicanism", "A system in which citizens govern through elected representatives and the government's authority is limited by law."),
        ("Participatory democracy", "A model emphasizing broad and direct citizen involvement in political decisions and civic life."),
        ("Pluralist democracy", "A model in which many competing groups influence public policy, preventing any single group from dominating government."),
        ("Elite democracy", "A model in which a relatively small number of wealthy, educated, or influential people shape major political decisions."),
        ("Articles of Confederation", "The first U.S. governing charter, which created a weak national government without an executive, national judiciary, or independent taxing power."),
        ("Shays' Rebellion", "A 1786-1787 uprising by indebted Massachusetts farmers that exposed the Confederation government's inability to maintain order."),
        ("Federalist", "A supporter of ratifying the Constitution and creating a stronger national government."),
        ("Anti-Federalist", "An opponent of Constitution ratification who feared centralized power and demanded stronger protections for individual liberties."),
        ("Federalism", "A constitutional system dividing governing authority between the national government and state governments."),
        ("Separation of powers", "The division of legislative, executive, and judicial authority among independent branches of government."),
        ("Checks and balances", "Constitutional mechanisms that allow each branch to restrain the powers of the other branches."),
        ("Limited government", "The principle that government possesses only the authority granted by the Constitution and remains bound by law."),
        ("Great Compromise", "The Constitutional Convention agreement creating a bicameral Congress with population-based representation in the House and equal state representation in the Senate."),
        ("Three-Fifths Compromise", "The agreement that counted three-fifths of enslaved people when apportioning House seats and direct taxes, increasing slaveholding states' political power."),
        ("Electoral College", "The constitutional system in which state-appointed electors formally select the president and vice president."),
        ("Enumerated powers", "Powers expressly granted to the national government in the Constitution, especially the congressional powers listed in Article I, Section 8."),
        ("Implied powers", "Powers not expressly listed but reasonably inferred from enumerated powers through the Necessary and Proper Clause."),
        ("Reserved powers", "Powers retained by the states under the Tenth Amendment because they are neither delegated to the national government nor prohibited to the states."),
        ("Concurrent powers", "Powers exercised by both national and state governments, such as taxation, borrowing, and establishing courts."),
        ("Necessary and Proper Clause", "The clause authorizing Congress to make laws needed to carry out its enumerated powers; also called the Elastic Clause."),
        ("Commerce Clause", "The constitutional provision empowering Congress to regulate commerce with foreign nations, among the states, and with Native American tribes."),
        ("Supremacy Clause", "The provision establishing the Constitution, valid federal laws, and treaties as the supreme law of the land over conflicting state laws."),
        ("Full Faith and Credit Clause", "The provision requiring states to recognize other states' public acts, records, and judicial proceedings."),
        ("Privileges and Immunities Clause", "The provision preventing a state from unreasonably discriminating against citizens of other states in fundamental matters."),
        ("Extradition", "The return of a person accused or convicted of a crime to the state where the alleged offense occurred."),
        ("Dual federalism", "A model in which national and state governments operate in distinct policy areas with relatively separate responsibilities."),
        ("Cooperative federalism", "A model in which national, state, and local governments share responsibilities and jointly administer public programs."),
        ("Devolution", "The transfer of policy responsibility or authority from the national government to state or local governments."),
        ("Fiscal federalism", "The use of federal taxation, spending, and grants to influence state and local policy."),
        ("Categorical grant", "Federal funding given to states or localities for a narrowly defined purpose, usually with detailed conditions."),
        ("Block grant", "Federal funding for a broad policy area that gives state or local governments considerable discretion over how it is spent."),
        ("Unfunded mandate", "A federal requirement imposed on state or local governments without sufficient federal funding to cover compliance costs."),
        ("McCulloch v. Maryland", "The 1819 decision affirming Congress's implied power to create a national bank and holding that states cannot tax legitimate federal institutions."),
        ("United States v. Lopez", "The 1995 decision limiting Congress's Commerce Clause power by invalidating the federal Gun-Free School Zones Act."),
        ("Declaration of Independence", "The 1776 document asserting American independence, natural rights, equality, popular sovereignty, and the people's right to alter or abolish a government that violates those rights."),
        ("Constitution of the United States", "The supreme governing document that establishes the federal system, separates national powers among three branches, and defines the relationship between government and the people."),
        ("Federalist No. 10", "Madison's argument that a large republic and representative government can control the harmful effects of factions."),
        ("Federalist No. 51", "Madison's explanation that separation of powers, checks and balances, and competing governmental interests help keep each branch within constitutional limits."),
        ("Brutus No. 1", "An Anti-Federalist essay arguing that the proposed national government was too powerful and the country too large for responsive republican government."),
    ], ["Models of representative democracy", "Weaknesses of the Articles of Confederation", "Federalism and the balance of power", "Constitutional compromises and ratification"]),

    ("2", "Interactions Among Branches of Government", [
        ("Bicameral legislature", "A legislature divided into two chambers; Congress consists of the House of Representatives and the Senate."),
        ("Article I", "The constitutional article establishing Congress, its two chambers, legislative procedures, enumerated powers, and important limits on national and state authority."),
        ("House of Representatives", "The lower chamber of Congress, with seats apportioned by population, two-year terms, and the sole power to initiate revenue bills and impeach officials."),
        ("Senate", "The upper chamber of Congress, with two members per state, six-year terms, and powers including treaty ratification, confirmation, and impeachment trials."),
        ("Reapportionment", "The redistribution of House seats among the states after the decennial census based on population changes."),
        ("Redistricting", "The redrawing of electoral district boundaries, normally following reapportionment and population change."),
        ("Gerrymandering", "Drawing electoral districts to advantage a political party or group rather than to create neutral representation."),
        ("Baker v. Carr", "The 1962 decision holding that federal courts may review legislative apportionment disputes under the Equal Protection Clause."),
        ("Shaw v. Reno", "The 1993 decision holding that districts drawn predominantly on the basis of race may violate the Equal Protection Clause."),
        ("Standing committee", "A permanent congressional committee specializing in a policy area and considering related legislation."),
        ("Select committee", "A temporary congressional committee created to investigate or address a particular issue."),
        ("Joint committee", "A congressional committee containing members from both chambers, generally used for study, investigation, or administration."),
        ("Conference committee", "A temporary committee of House and Senate members that reconciles differences between their versions of a bill."),
        ("Rules Committee", "The House committee that sets the terms and conditions under which legislation will be debated and amended on the floor."),
        ("Committee of the Whole", "A House procedure that relaxes debate rules and lowers the quorum to speed consideration of legislation."),
        ("Discharge petition", "A House procedure that can bring a bill out of committee and to the floor after securing signatures from a majority of representatives."),
        ("Filibuster", "A Senate tactic that extends debate or delays action to prevent or postpone a vote."),
        ("Cloture", "The Senate procedure for limiting debate; under current rules, most legislation requires three-fifths of the Senate to invoke it."),
        ("Pork-barrel legislation", "Government spending directed to a legislator's district or state to benefit constituents and build political support."),
        ("Logrolling", "An exchange in which legislators agree to support one another's proposals."),
        ("Mandatory spending", "Government spending required by existing law, including many entitlement programs and interest on the national debt."),
        ("Discretionary spending", "Spending set through the annual appropriations process and therefore reconsidered regularly by Congress and the president."),
        ("Trustee model", "A representation model in which an elected official uses personal judgment to decide what best serves constituents."),
        ("Delegate model", "A representation model in which an elected official follows the expressed preferences of constituents."),
        ("Politico model", "A representation model in which a lawmaker alternates between trustee and delegate approaches depending on the issue."),
        ("Divided government", "A situation in which different political parties control the presidency and at least one chamber of Congress."),
        ("Gridlock", "An inability to enact policy because institutions or political actors cannot reach agreement."),
        ("Veto", "The president's constitutional power to reject legislation passed by Congress, subject to a two-thirds override in each chamber."),
        ("Pocket veto", "The rejection of a bill when the president takes no action during the final ten days of a congressional session and Congress adjourns."),
        ("Executive order", "A presidential directive to executive-branch officials that carries the force of law when grounded in constitutional or statutory authority."),
        ("Article II", "The constitutional article establishing the presidency, executive powers and duties, presidential selection and qualifications, and removal through impeachment."),
        ("Executive agreement", "An international agreement made by the president that does not require the Senate's two-thirds treaty approval."),
        ("Bully pulpit", "The president's prominent platform for shaping public attention, framing issues, and building support for an agenda."),
        ("Cabinet", "The heads of major executive departments who advise the president and administer federal policy."),
        ("Federalist No. 70", "Hamilton's argument for a single, energetic executive capable of decisive action and clear accountability."),
        ("Bureaucracy", "The departments, agencies, commissions, and government employees responsible for administering laws and public programs."),
        ("Civil service", "The professional, nonmilitary workforce employed by government agencies."),
        ("Merit system", "A system of government hiring and promotion based on qualifications and performance rather than political loyalty."),
        ("Pendleton Civil Service Reform Act", "The 1883 law establishing merit-based federal employment and reducing the patronage system."),
        ("Bureaucratic discretion", "The authority agencies and officials possess to choose how broadly written laws and policies will be implemented."),
        ("Rulemaking", "The bureaucratic process of creating regulations that interpret and implement statutes."),
        ("Congressional oversight", "Congressional monitoring of executive agencies through hearings, investigations, reporting requirements, confirmations, and budgetary control."),
        ("Power of the purse", "Congress's authority to raise revenue and determine how public money is spent."),
        ("Judicial review", "The power of courts to determine whether government actions conform to the Constitution."),
        ("Article III", "The constitutional article establishing the Supreme Court, permitting Congress to create lower federal courts, and defining federal judicial power and treason."),
        ("Marbury v. Madison", "The 1803 decision establishing the Supreme Court's power of judicial review."),
        ("Writ of certiorari", "An order by which the Supreme Court directs a lower court to send up the record of a case for review."),
        ("Rule of Four", "The Supreme Court practice of granting review when at least four justices vote to hear a case."),
        ("Stare decisis", "The judicial principle of following precedent to promote stability, consistency, and predictability in the law."),
        ("Majority opinion", "The controlling judicial opinion that states the decision and legal reasoning supported by a majority of participating judges."),
        ("Concurring opinion", "An opinion agreeing with the Court's judgment but offering different or additional reasoning."),
        ("Dissenting opinion", "An opinion explaining why a judge disagrees with the Court's majority decision."),
        ("Federalist No. 78", "Hamilton's defense of an independent judiciary with life tenure and judicial review as a safeguard for the Constitution."),
    ], ["How Congress makes laws", "Congressional representation and redistricting", "Formal and informal presidential power", "The federal bureaucracy", "Judicial review and Supreme Court decision-making"]),

    ("3", "Civil Liberties and Civil Rights", [
        ("Civil liberties", "Constitutional protections that limit government interference with individual freedom."),
        ("Civil rights", "Legal guarantees of equal treatment and protection from discrimination."),
        ("Bill of Rights", "The first ten amendments to the Constitution, which protect individual liberties and constrain federal power."),
        ("Selective incorporation", "The gradual application of Bill of Rights protections to state governments through the Fourteenth Amendment's Due Process Clause."),
        ("Due Process Clause", "A constitutional guarantee that government may not deprive a person of life, liberty, or property without fair legal procedures and lawful justification."),
        ("Equal Protection Clause", "The Fourteenth Amendment requirement that states apply the law equally and justify discriminatory classifications."),
        ("Establishment Clause", "The First Amendment prohibition against government establishment, sponsorship, or endorsement of religion."),
        ("Free Exercise Clause", "The First Amendment protection for religious belief and practice, subject to some neutral and generally applicable laws."),
        ("Engel v. Vitale", "The 1962 decision holding that government-written prayer in public schools violates the Establishment Clause."),
        ("Wisconsin v. Yoder", "The 1972 decision protecting Amish families from compulsory high-school attendance when it substantially burdened their religious practice."),
        ("Symbolic speech", "Nonverbal conduct intended to communicate an idea and potentially protected by the First Amendment."),
        ("Schenck v. United States", "The 1919 decision allowing punishment of speech presenting a clear and present danger during wartime."),
        ("Tinker v. Des Moines", "The 1969 decision protecting student symbolic speech unless it substantially disrupts school operations or infringes others' rights."),
        ("Prior restraint", "Government action preventing speech or publication before it occurs, which courts presume unconstitutional in most circumstances."),
        ("New York Times Co. v. United States", "The 1971 Pentagon Papers decision rejecting the government's attempt to stop publication because it failed to justify prior restraint."),
        ("Libel", "A false written statement of fact that damages a person's reputation and meets the legal requirements for defamation."),
        ("Slander", "A false spoken statement of fact that damages a person's reputation and meets the legal requirements for defamation."),
        ("New York Times Co. v. Sullivan", "The 1964 decision requiring public officials to prove actual malice to win defamation suits concerning their official conduct."),
        ("Second Amendment", "The constitutional protection of the right to keep and bear arms."),
        ("District of Columbia v. Heller", "The 2008 decision recognizing an individual Second Amendment right to possess a firearm for lawful purposes such as self-defense in the home."),
        ("Exclusionary rule", "The rule generally preventing evidence obtained through an unconstitutional search or seizure from being used in a criminal trial."),
        ("Mapp v. Ohio", "The 1961 decision applying the Fourth Amendment exclusionary rule to the states."),
        ("Gideon v. Wainwright", "The 1963 decision requiring states to provide counsel to indigent defendants charged with serious crimes."),
        ("Miranda rights", "Warnings police must give before custodial interrogation concerning silence, use of statements, and access to an attorney."),
        ("Self-incrimination", "Providing testimony or information that could expose oneself to criminal prosecution; the Fifth Amendment protects against compelled self-incrimination."),
        ("Double jeopardy", "A second prosecution for the same offense after acquittal or conviction, generally prohibited by the Fifth Amendment."),
        ("Right to privacy", "A judicially recognized liberty protecting certain intimate personal decisions from government interference."),
        ("Griswold v. Connecticut", "The 1965 decision recognizing a constitutional privacy right protecting married couples' use of contraception."),
        ("Brown v. Board of Education", "The 1954 decision holding that state-mandated racial segregation in public schools violates equal protection."),
        ("Letter from Birmingham Jail", "Martin Luther King Jr.'s defense of nonviolent direct action and civil disobedience against unjust laws and delayed equality."),
        ("Civil Rights Act of 1964", "A federal law prohibiting discrimination in public accommodations and employment and strengthening enforcement against school segregation."),
        ("Voting Rights Act of 1965", "A federal law banning racial discrimination in voting and authorizing federal enforcement of voting protections."),
        ("Affirmative action", "Policies that consider historically disadvantaged status, including race in limited settings, to expand opportunity or remedy discrimination."),
        ("Regents of the University of California v. Bakke", "The 1978 decision rejecting rigid racial quotas in admissions while allowing race to be considered as one factor among others."),
        ("Civil disobedience", "The deliberate, public, and nonviolent violation of a law considered unjust, undertaken to provoke reform while accepting legal consequences."),
    ], ["Religious liberty under the First Amendment", "Freedom of speech and press", "Rights of criminal defendants", "Civil rights and equal protection"]),

    ("4", "American Political Ideologies and Beliefs", [
        ("Political ideology", "A coherent set of beliefs about the proper role of government and the policies it should pursue."),
        ("Political socialization", "The lifelong process through which people develop political values, identities, and attitudes."),
        ("Agents of socialization", "Influences such as family, schools, peers, religion, media, and major events that shape political beliefs."),
        ("Political culture", "Widely shared beliefs, values, and expectations about government and political life within a society."),
        ("Individualism", "The belief that individuals should have substantial freedom and bear responsibility for their own choices and welfare."),
        ("Equality of opportunity", "The belief that people should have a fair chance to succeed without guaranteeing equal outcomes."),
        ("Rule of law", "The principle that government officials and citizens are subject to publicly known and consistently applied laws."),
        ("Liberalism", "An ideology generally favoring government action to promote economic equality and social welfare while protecting personal autonomy."),
        ("Conservatism", "An ideology generally favoring limited economic regulation, lower taxes, traditional institutions, and public order."),
        ("Libertarianism", "An ideology favoring minimal government intervention in both economic activity and personal behavior."),
        ("Socialism", "An ideology favoring collective or public control of major economic resources to reduce inequality and meet social needs."),
        ("Laissez-faire economics", "The view that markets operate best with minimal government regulation or intervention."),
        ("Political efficacy", "A person's belief that political participation matters and that government can respond to citizen influence."),
        ("Public opinion", "The distribution of citizens' attitudes about political leaders, institutions, events, and public policies."),
        ("Random sample", "A polling sample selected so every member of the target population has a known and generally equal chance of inclusion."),
        ("Representative sample", "A sample whose relevant characteristics closely reflect those of the population being studied."),
        ("Sampling error", "The expected difference between a sample result and the true population value caused by random selection."),
        ("Margin of error", "A reported range estimating how far a poll's result may differ from the true population value due to sampling."),
        ("Tracking poll", "A repeated poll measuring changes in public opinion or candidate support over time."),
        ("Entrance poll", "A survey of voters conducted before they cast ballots, often used during caucuses."),
        ("Exit poll", "A survey of voters immediately after voting used to estimate results and analyze voting patterns."),
        ("Push poll", "A campaign technique disguised as a poll that uses leading or negative information to influence respondents."),
        ("Keynesian economics", "The theory that government can stabilize the economy by adjusting spending and taxation to influence aggregate demand."),
        ("Supply-side economics", "The theory that reducing taxes and regulation encourages investment, production, and economic growth."),
        ("Fiscal policy", "Government decisions about taxation and spending used to influence economic conditions."),
        ("Monetary policy", "Management of interest rates and the money supply, primarily by the Federal Reserve, to promote stable prices and employment."),
        ("Federal Reserve", "The central banking system of the United States, responsible for monetary policy, banking oversight, and financial stability."),
        ("Entitlement program", "A program that provides benefits to everyone who meets eligibility requirements established by law."),
        ("Means-tested program", "A public benefit program restricted to individuals or families whose income or assets fall below specified levels."),
    ], ["Political socialization", "Measuring public opinion", "Liberal, conservative, and libertarian ideology", "Fiscal and monetary policy"]),

    ("5", "Political Participation", [
        ("Voting-age population", "All residents old enough to vote, including some people who are legally ineligible because of citizenship or other restrictions."),
        ("Voting-eligible population", "Citizens legally eligible to vote after accounting for age, citizenship, and applicable disenfranchisement rules."),
        ("Voter turnout", "The percentage of an eligible population that casts a ballot in an election."),
        ("Rational-choice voting", "Voting based on an assessment of which candidate or policy best advances the voter's interests."),
        ("Retrospective voting", "Judging an incumbent or governing party by evaluating past performance."),
        ("Prospective voting", "Choosing candidates according to their promises and expected future performance."),
        ("Party-line voting", "Selecting candidates primarily because they share the voter's party affiliation."),
        ("Linkage institution", "A structure such as elections, parties, interest groups, or media that connects citizens with government."),
        ("Political party", "An organization seeking to influence government by recruiting candidates, contesting elections, and coordinating policy goals."),
        ("Party platform", "A formal statement of a political party's principles, priorities, and policy positions."),
        ("Party realignment", "A lasting shift in party coalitions, voter loyalties, and issue positions that changes the political system."),
        ("Critical election", "An election associated with unusually significant changes in party support, governing coalitions, or policy direction."),
        ("Third party", "A political party competing outside the two dominant parties, often introducing issues or representing neglected constituencies."),
        ("Winner-take-all system", "An electoral system in which the candidate receiving the most votes wins the office or all available electoral votes."),
        ("Single-member district", "An electoral district that selects one representative, generally encouraging two-party competition."),
        ("Interest group", "An organized group seeking to influence public policy without directly controlling government through elected office."),
        ("Collective action problem", "The difficulty of coordinating people to pursue a shared benefit when individuals can gain without participating."),
        ("Free rider problem", "The incentive to enjoy a collective benefit without contributing to the organization or effort that provides it."),
        ("Selective benefit", "A material, social, or purposive reward available specifically to people who join or support an interest group."),
        ("Lobbying", "Direct communication with public officials intended to influence legislation, regulation, or other government decisions."),
        ("Amicus curiae brief", "A friend-of-the-court filing by a nonparty offering information or legal arguments relevant to a case."),
        ("Iron triangle", "A durable policy relationship among a congressional committee, an executive agency, and an interest group."),
        ("Issue network", "A fluid alliance of officials, experts, advocates, and organizations involved in a particular policy area."),
        ("Primary election", "An election in which voters choose a party's nominee for the general election."),
        ("Closed primary", "A primary in which participation is limited to voters registered with the party holding the election."),
        ("Open primary", "A primary in which voters may choose which party's primary to participate in without formally registering with that party."),
        ("Caucus", "A local party meeting where participants discuss candidates and select preferences or delegates."),
        ("National convention", "A party gathering that formally nominates presidential and vice-presidential candidates and adopts a platform."),
        ("General election", "The election in which voters choose among party nominees and other candidates to fill an office."),
        ("Incumbency advantage", "The electoral benefits held by current officeholders, including visibility, experience, fundraising networks, and constituent services."),
        ("Franking privilege", "The ability of members of Congress to send official mail to constituents without personally paying postage."),
        ("Federal Election Commission", "The independent agency that administers and enforces federal campaign-finance law."),
        ("Political action committee", "An organization that raises and contributes regulated funds to support or oppose candidates and political causes."),
        ("Super PAC", "An independent-expenditure committee that may raise and spend unlimited funds but may not coordinate expenditures with candidates."),
        ("Hard money", "Campaign funds contributed directly to a candidate or party under federal contribution limits and disclosure rules."),
        ("Soft money", "Funds raised outside federal contribution limits for activities not directly advocating a federal candidate; national party soft money was restricted by the BCRA."),
        ("Bipartisan Campaign Reform Act", "The 2002 law restricting national-party soft money and regulating certain electioneering communications; also called McCain-Feingold."),
        ("Citizens United v. FEC", "The 2010 decision holding that independent political expenditures by corporations and unions are protected speech under the First Amendment."),
        ("Media gatekeeper", "The media role of selecting which events, people, and issues receive public attention."),
        ("Media watchdog", "The media role of investigating government behavior and exposing misconduct or failures."),
        ("Media scorekeeper", "The media role of emphasizing who is winning or losing elections and political conflicts."),
        ("Agenda setting", "The media's influence over which issues the public and policymakers consider important."),
        ("Freedom of Information Act", "The federal law allowing the public to request executive-branch records, subject to specified exemptions."),
        ("Equal-time rule", "An FCC rule generally requiring broadcasters that give airtime to one legally qualified candidate to offer equivalent opportunities to opponents."),
        ("Horse-race journalism", "Election coverage focused on polling, strategy, fundraising, and who is ahead rather than substantive policy differences."),
        ("National Voter Registration Act", "The 1993 Motor Voter law requiring states to offer voter registration through motor-vehicle and certain public-assistance agencies."),
    ], ["Voting behavior and turnout", "Political parties and party change", "Interest groups and policy influence", "Presidential and congressional elections", "Campaign finance and the media"]),
]


def build_decks():
    decks = []
    for unit_number, unit_name, cards, topics in UNITS:
        deck_id = f"apgov-unit-{unit_number}"
        decks.append({
            "id": deck_id,
            "name": f"AP U.S. Government and Politics - Unit {unit_number}",
            "shortName": f"Unit {unit_number}: {unit_name}",
            "builtIn": True,
            "sourceTitle": SOURCE_TITLE,
            "sourceUrl": SOURCE_URL,
            "cards": [
                {"id": f"{deck_id}-c{index}", "front": front, "back": back}
                for index, (front, back) in enumerate(cards, start=1)
            ],
            "questions": [],
            "feynmanPrompts": [
                {"id": f"{deck_id}-f{index}", "prompt": prompt}
                for index, prompt in enumerate(topics, start=1)
            ],
        })
    return decks


def validate(decks):
    fronts = []
    for deck in decks:
        for card in deck["cards"]:
            assert len(card["front"].strip()) >= 3
            assert len(card["back"].strip()) >= 60
            assert "?" not in card["front"]
            assert "Unit " not in card["front"] and "Part " not in card["front"]
            fronts.append(card["front"].casefold())
    assert len(fronts) == len(set(fronts)), "Duplicate card fronts"


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: generate-apgov-data.py OUTPUT_JS")
    output = pathlib.Path(sys.argv[1])
    decks = build_decks()
    validate(decks)
    output.write_text(
        "window.AP_US_GOVERNMENT_DECKS = " + json.dumps(decks, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {sum(len(deck['cards']) for deck in decks)} cards and {sum(len(deck['feynmanPrompts']) for deck in decks)} Feynman topics")
    for deck in decks:
        print(f"  {deck['shortName']}: {len(deck['cards'])} cards, {len(deck['feynmanPrompts'])} topics")


if __name__ == "__main__":
    main()
