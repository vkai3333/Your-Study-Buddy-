#!/usr/bin/env python3
"""Build the AP Human Geography unit decks from extracted PDF highlights."""

import json
import pathlib
import re
import sys


SOURCE_TITLE = "AP Human Geography Guide — Simple Studies"
SOURCE_URL = "https://uploads-ssl.webflow.com/605fe570e5454a357d1e1811/609eca6f9b9577dbf6455213_SS-APHuG.pdf"

# A few highlighted table labels do not have text immediately to their right after
# PDF extraction. These replacements use the surrounding text from the same page.
SOURCE_REPAIRS = {
    (2, "⅔ of the population is in..."): "East Asia, South Asia, Southeast Asia, and Europe.",
    (3, "Religious or other"): "Customary beliefs and sacred features can shape the use and orientation of space.",
    (3, "Popular Clothing"): "Clothing styles spread widely through popular culture and often reflect occupation or income more than local environmental conditions.",
    (3, "food preferences to conditions in the environment..."): "Food preferences often reflect environmental conditions, available resources, and cultural customs.",
    (3, "Languages of Southwest Asia and North Africa and Central Asia"): "Languages in these regions primarily belong to the Afro-Asiatic, Indo-European, and Altaic language families.",
    (3, "Niger-Congo"): "A language family spoken across much of sub-Saharan Africa.",
    (3, "Indo-European Branches"): "Major branches include Germanic, Romance, Balto-Slavic, and Indo-Iranian.",
    (4, "Political Organizations"): "Organizations such as the United Nations coordinate states around political goals including international peace and cooperation.",
    (4, "Military Organizations"): "Alliances such as NATO coordinate states around shared military and security interests.",
    (4, "Economic Organizations"): "Organizations such as the European Union coordinate states around trade, markets, and economic policy.",
    (5, "Von Thunen's model"): "A land-use model in which agricultural activities form rings around a market according to transportation cost, perishability, and land value.",
}

# Highlighted tables in the source also contain column headings, geographic
# examples, and sentence fragments. They are useful on the page, but they are
# not useful as standalone flashcards.
REMOVE_TERMS = {
    1: {"human", "deserts", "tropical", "the major explanation for migration is economic."},
    2: {"⅔ of the population is in...", "east asia", "south asia", "southeast asia", "europe", "healthcare care systems in..", "declining birth rates are because of...", "the major cause of migration is economic.", "united nations high commissions for refugees recognizes three groups of"},
    3: {"other/mixed", "religious or other", "preferences", "distance or physical barriers", "age barriers", "linguistic barriers", "religious barriers", "political barriers", "social class barriers", "economic barriers", "regulatory barriers", "food preferences to conditions in the environment...", "asia", "europe", "taboo.", "families", "branches", "groups", "indo-european branches", "angles", "jutes", "saxons", "us dialects", "new england", "southeastern", "east, new england", "midlands", "northern belgium (flemings - dutch dialect) vs southern belgium (walloons - french)", "chicago", "los angeles", "languages of southwest asia and north africa and central asia", "threats to folk culture"},
    4: {"political organizations", "military organizations", "economic organizations", "china", "western sahara", "physical boundaries"},
    5: {"similar areas outside of the meditrerran that have similar climate and", "the primary economy", "third-world countries", "domestic consumption", "export", "feudal", "communes", "quotas", "incentives", "textiles", "animals feed", "leads to desertification", "mineral salts", "growing areas", "expanded food production", "tractors", "antibiotics", "animals welfare", "natural food products", "processed dairy"},
    6: {"village", "highlands", "exponentially", "agriculture", "service firms classification", "capitalism was the result of the collapse of the feudal system.", "local attributes that are in demand by high-benefit and cursive service", "sectors", "product categories", "service firms", "offshore locations", "plow", "steel", "computer", "microchip", "first world", "the second world", "third world", "mcs’s", "ldcs", "rapid population growth", "rapid rural-to-urban migration", "private investors/investment firms", "credit crisis", "guaranteed family employment", "economic indicators", "total volume", "gdp =", "gni =", "level of the development", "government corruption or capital flight", "economic risks", "internal investment", "tourist draws", "close proximity", "transportation costs", "ishable products", "centralized", "corporate culture", "local economic development", "threshold and range"},
    7: {"travel time", "cost advantages", "festival landscapes", "federal home loan programs", "relocate", "female-headed households", "smog"},
}

# A second-pass AP-focused trim. These are valid geography facts, but they are
# redundant, unusually narrow examples, dated labels, or better learned under a
# broader retained concept rather than as independent cards.
CURATION_REMOVE = {
    1: {
        "physical geography", "latitude and climate", "air masses and climate", "continentality",
        "elevation and climate", "mountain barriers and climate", "ocean currents and climate",
        "atmospheric pressure cells", "storm systems", "high pressure", "low pressure",
        "goode’s interrupted/homolosine equal", "conic", "planar projection", "fuller projection",
        "primary-sector economies", "secondary-sector economies", "tertiary-sector economies",
        "quaternary-sector economies", "mdc", "nic", "ldc", "environment pillar", "economy pillar",
        "society pillar", "weather", "precipitation", "geographic space", "spatial flow",
    },
    2: {
        "colonialism", "imperialism", "gdp per capita", "critical distance",
        "majority-minority population", "quota act in 1921 and the national origins act in 1924",
        "great migration in the united states", "rust belt", "return migration", "ethnocentrism",
    },
    3: {
        "customary beliefs", "folk music", "popular music", "popular clothing",
        "folk clothing preferences", "threats to pop culture", "folk housing", "folk/local culture",
        "altaic", "swahili", "agnosticism", "religious branch", "denomination", "sect",
    },
    4: {
        "un (united nations)", "warsaw pact", "comecon", "north american free trade agreement (nafta)",
        "satellite states", "berlin conference", "versailles peace conference", "apartheid", "cold war",
        "political frontier", "open boundary", "natural boundary", "militarized boundary",
        "defined boundary", "demarcated boundary", "allocational dispute", "functional disputes",
        "definitional boundary dispute", "locational boundary dispute", "operational boundary dispute",
    },
    5: {
        "demographic transition model", "physiological density", "general farming", "food preservation",
        "income disparity", "communist manifesto", "human ecology", "food web", "food chain",
        "spring wheat", "winter wheat", "ethanol", "biodiesel", "hybrids", "irrigation pumps",
        "brahman cattle", "rbgh", "downer cattle", "appellation", "parmigiano-reggiano",
        "suitcase farmers", "ultra-high temperature pasteurization", "labor intensive",
    },
    6: {
        "labor intensive crops", "managed forest", "labor extensive crop", "grazing in the von thünen model",
        "cost to distance relationship", "land-rent curve", "old asian tigers", "new asian tigers",
        "primary production", "secondary production", "tertiary production", "quaternary production -.",
        "quinary production", "mining and energy extraction", "fisheries and timer markets",
        "durable and nondurable goods", "low benefit services", "high-benefit services", "investment value",
        "returns on investment", "donor state", "north versus south analogy", "asian tigers", "keiretsu",
        "chaebol", "the cycle of dependency", "prebisch thesis", "market stagnation", "capital accumulation",
        "internalization of economics", "nationalization of natural resource-based industries",
        "profit-sharing agreements", "technology development programs", "millennium development goals",
    },
    7: {
        "limited banking regulations", "resource nodes", "transport nodes", "circular settlements",
        "plvi", "verticality", "commuter zone", "suitcase farming", "wasps", "suburban business districts",
        "suburban cbds", "laws of the indies", "central plaza", "middle-class flight", "lateral commuting",
        "counter commuting", "fall-line cities", "medieval cities", "chinatown",
    },
}

TERM_RENAMES = {
    (1, "movement"): "Movement of people, goods, and ideas",
    (1, "regions"): "Geographic regions",
    (1, "contagious"): "Contagious diffusion",
    (1, "stimulus"): "Stimulus diffusion",
    (1, "pattern"): "Spatial pattern",
    (1, "space"): "Geographic space",
    (1, "flow"): "Spatial flow",
    (1, "site"): "Site of a place",
    (1, "situation"): "Situation of a place",
    (2, "total rate (tfr)"): "Total fertility rate (TFR)",
    (2, "minority-majority"): "Majority-minority population",
    (3, "language"): "Language",
    (3, "branch"): "Religious branch",
    (3, "culture appropriation"): "Cultural appropriation",
    (3, "culture relativism"): "Cultural relativism",
    (3, "post modern architecture"): "Postmodern architecture",
    (4, "state"): "State (political geography)",
    (4, "nation"): "Nation (political geography)",
    (4, "morphology"): "State morphology",
    (4, "frontier"): "Political frontier",
    (4, "exclaces"): "Exclaves",
    (5, "physiologic density"): "Physiological density",
    (5, "multi cropping"): "Multiple cropping",
    (5, "animals welfare"): "Animal welfare",
    (6, "mcs’s"): "More developed countries (MDCs)",
    (6, "ldcs"): "Less developed countries (LDCs)",
    (6, "world bank"): "World Bank",
    (6, "comparative advantages"): "Comparative advantage",
    (6, "off-shoring"): "Offshoring",
    (6, "economics of scale"): "Economies of scale",
    (6, "economic scope"): "Economies of scope",
    (6, "weight-losing or build reducing, manufacturing"): "Bulk-reducing manufacturing",
    (6, "weight-gaining/bulk gaining, manufacturing"): "Bulk-gaining manufacturing",
    (6, "resource-dependant country"): "Resource-dependent country",
    (7, "threshold"): "Threshold in central place theory",
    (7, "range"): "Range in central place theory",
    (7, "site"): "Urban site",
    (7, "situation"): "Urban situation",
    (7, "while flight"): "White flight",
    (7, "plaza"): "Central plaza",
    (7, "basic services"): "Basic-sector services",
    (7, "non-basic services"): "Nonbasic-sector services",
    (7, "urban primacy"): "Urban primacy",
}

TERM_RENAMES.update({
    (1, "location"): "Geographic location", (1, "place"): "Place as a geographic concept",
    (1, "l ~ latitude"): "Latitude and climate", (1, "a ~ air masses"): "Air masses and climate",
    (1, "c ~ continentality"): "Continentality", (1, "e ~ elevation"): "Elevation and climate",
    (1, "m ~ mountain barriers"): "Mountain barriers and climate", (1, "o ~ ocean currents"): "Ocean currents and climate",
    (1, "p ~ pressure cells"): "Atmospheric pressure cells", (1, "s ~ storms"): "Storm systems",
    (1, "primary countries"): "Primary-sector economies", (1, "secondary countries"): "Secondary-sector economies",
    (1, "tertiary countries"): "Tertiary-sector economies", (1, "quaternary countries"): "Quaternary-sector economies",
    (2, "great migration"): "Great Migration in the United States", (2, "counter migration"): "Return migration",
    (2, "malthus’(malthusian) theory"): "Malthusian theory",
    (3, "folk music"): "Folk music", (3, "language"): "Language as a cultural trait", (6, "grazing"): "Grazing in the von Thünen model",
    (4, "united nations convention on the law of the sea (unclos) - treaty 1982"): "United Nations Convention on the Law of the Sea (UNCLOS)",
    (4, "nafta(north"): "North American Free Trade Agreement (NAFTA)",
    (6, "gni pp or gross national income purchasing power parity"): "GNI at purchasing power parity (PPP)",
    (6, "the sustainable use"): "Sustainable resource use",
    (7, "hinterlands"): "Market hinterland", (7, "suitcase farmers"): "Suitcase farming",
})

BACK_OVERRIDES = {
    "movement of people, goods, and ideas": "One of geography's core themes: the spatial transfer of people, commodities, information, and cultural traits between places through migration, trade, communication, and diffusion.",
    "geographic regions": "Areas grouped because they share one or more characteristics. Geographers commonly distinguish formal, functional, and perceptual regions.",
    "physical geography": "The study of Earth's natural features and processes, including climate, landforms, water, soils, ecosystems, and hazards.",
    "human geography": "The study of how people, cultures, economies, and political systems are distributed across space and interact with places and environments.",
    "contagious diffusion": "The rapid, widespread diffusion of a trait through direct contact among nearby people or places, without regard to social hierarchy.",
    "stimulus diffusion": "The spread of an underlying idea when the original trait itself is rejected or modified to fit a new cultural setting.",
    "spatial pattern": "The geometric or geographic arrangement of phenomena across space, such as clustered, dispersed, linear, or random distributions.",
    "geographic space": "The physical area between and around locations in which geographic relationships, distance, distribution, and interaction can be analyzed.",
    "spatial flow": "The movement of people, goods, money, information, or ideas between locations.",
    "site of a place": "The physical characteristics of a location itself, such as terrain, climate, water access, vegetation, and natural resources.",
    "situation of a place": "A location's position relative to other places and networks, including transportation routes, markets, resources, and neighboring settlements.",
    "indo-european": "The world's most widely distributed language family, including the Germanic, Romance, Balto-Slavic, Indo-Iranian, Hellenic, Celtic, and other branches.",
    "sino-tibetan": "A major language family centered in East and Southeast Asia that includes Sinitic languages such as Mandarin and the Tibeto-Burman languages.",
    "afro-asiatic": "A language family spoken mainly across North Africa, the Horn of Africa, and Southwest Asia; major branches include Semitic, Berber, Cushitic, Chadic, and Egyptian.",
    "niger-congo": "A large language family spoken across much of sub-Saharan Africa; it includes the Bantu languages and languages such as Swahili.",
    "germanic branch": "An Indo-European language branch that includes English, German, Dutch, Swedish, Danish, Norwegian, and related languages.",
    "indo-iranian branch": "The largest Indo-European branch by number of speakers, containing Indo-Aryan languages such as Hindi and Bengali and Iranian languages such as Persian.",
    "balto-slavic branch": "An Indo-European branch containing Baltic languages such as Lithuanian and Latvian and Slavic languages such as Russian, Polish, Czech, and Serbo-Croatian.",
    "romance branch": "An Indo-European language branch descended from Latin, including Spanish, Portuguese, French, Italian, and Romanian.",
    "proto-indo european": "The reconstructed common ancestor of the Indo-European languages, believed to have been spoken thousands of years ago before dispersing into distinct branches.",
    "cultural appropriation": "The adoption of cultural traits from another group, especially when a dominant group uses elements of a marginalized culture without permission, understanding, or respect for their meaning.",
    "cultural relativism": "Evaluating a culture according to its own values and context rather than judging it by the standards of another culture.",
    "state (political geography)": "A politically organized territory with a permanent population, defined boundaries, a government, and sovereignty over its internal and external affairs.",
    "nation (political geography)": "A group of people who share a strong cultural identity, history, homeland, or political aspirations; a nation does not necessarily control a sovereign state.",
    "state morphology": "The shape and territorial configuration of a state, commonly categorized as compact, elongated, prorupted, perforated, or fragmented.",
    "political frontier": "A zone separating states or political territories where boundaries are weakly defined, unsettled, or under limited governmental control.",
    "exclaves": "Parts of a state separated from its main territory by another state or states; an exclave may also be an enclave if it is completely surrounded by one country.",
    "total fertility rate (tfr)": "The average number of children a woman is expected to have during her reproductive years, assuming current age-specific birth rates continue.",
    "physiological density": "The number of people per unit of arable land, used to estimate the pressure a population places on land capable of producing food.",
    "multiple cropping": "Harvesting more than one crop from the same field during a single year, usually where long growing seasons and sufficient moisture permit it.",
    "comparative advantage": "The ability of a country or region to produce a good or service at a lower opportunity cost than another producer.",
    "offshoring": "Relocating a business process, service, or production activity to another country, often to reduce costs or reach new markets.",
    "economies of scale": "Reductions in average production cost that occur as a firm increases output and spreads fixed costs across more units.",
    "economies of scope": "Cost savings gained when a firm produces multiple related products or services using shared resources, technology, or distribution.",
    "bulk-reducing manufacturing": "Manufacturing in which the finished product weighs less or occupies less volume than its inputs, encouraging factories to locate near raw materials.",
    "bulk-gaining manufacturing": "Manufacturing in which the finished product gains weight or volume, encouraging factories to locate near markets to reduce delivery costs.",
    "threshold in central place theory": "The minimum number of customers needed to support a particular service or business.",
    "range in central place theory": "The maximum distance consumers are willing to travel to obtain a particular good or service.",
    "urban site": "The physical characteristics of the land where a city developed, such as terrain, water supply, defensibility, and access to resources.",
    "urban situation": "A city's location relative to other places and transportation networks, which influences trade, accessibility, and growth.",
    "white flight": "The movement of white residents from racially diversifying central cities to suburbs, particularly in the United States during the twentieth century.",
    "central plaza": "The principal public square in many Latin American cities, traditionally surrounded by government, religious, and commercial buildings.",
    "basic-sector services": "Economic activities that bring income into a settlement by selling goods or services to customers outside the local area.",
    "nonbasic-sector services": "Economic activities that primarily serve the local population and circulate income already present within the settlement.",
}

BACK_OVERRIDES.update({
    "geographic location": "The position of a feature on Earth's surface, described as absolute location using coordinates or relative location in relation to other places.",
    "place as a geographic concept": "A location understood through its distinctive physical and human characteristics, including landscape, culture, population, and built environment.",
    "latitude and climate": "Latitude affects solar intensity: places nearer the equator generally receive more direct sunlight, while higher latitudes receive less direct sunlight and are usually cooler.",
    "air masses and climate": "Large bodies of air carry the temperature and moisture characteristics of their source regions, shaping regional weather and climate when they move.",
    "continentality": "The effect of distance from large bodies of water on climate. Inland places usually have greater annual temperature ranges because land heats and cools faster than water.",
    "elevation and climate": "Air temperature generally decreases as elevation rises, so highland climates are often cooler than nearby lowlands at the same latitude.",
    "mountain barriers and climate": "Mountains force moist air upward, producing precipitation on windward slopes and drier rain-shadow conditions on leeward slopes.",
    "ocean currents and climate": "Warm and cold ocean currents redistribute heat and influence the temperature and moisture of nearby coastal climates.",
    "atmospheric pressure cells": "Broad zones of rising or sinking air that shape global winds and precipitation; low pressure favors rising moist air, while high pressure favors sinking dry air.",
    "storm systems": "Organized atmospheric disturbances created by pressure differences and interacting air masses, including tropical cyclones and midlatitude storms.",
    "primary-sector economies": "Economies where a large share of employment and output comes from extracting natural resources through agriculture, fishing, forestry, or mining.",
    "secondary-sector economies": "Economies where manufacturing and construction transform raw materials into finished or semi-finished goods.",
    "tertiary-sector economies": "Economies dominated by services such as retail, transportation, health care, education, finance, and hospitality.",
    "quaternary-sector economies": "Economies with substantial knowledge-based work involving information, research, technology, analysis, and management.",
    "high pressure": "An atmospheric condition in which air sinks and spreads outward, generally producing clearer and drier weather.",
    "low pressure": "An atmospheric condition in which air rises and converges, promoting cloud formation, precipitation, and unsettled weather.",
    "reference maps": "Maps designed to show locations of geographic features such as boundaries, roads, cities, rivers, and terrain rather than a single statistical theme.",
    "scale": "The relationship between distance on a map and the corresponding distance on Earth; scale can also mean the geographic level at which a process is analyzed.",
    "small scale": "A map scale showing a large area with relatively little detail, such as a world map; its representative fraction has a relatively large denominator.",
    "clustering": "A spatial distribution in which features are concentrated close together rather than evenly dispersed.",
    "dispersal": "A spatial distribution in which features are spread apart across an area.",
    "gis": "A Geographic Information System: computer hardware and software used to store, layer, analyze, and visualize spatial data.",
    "archipelago": "A chain or group of islands located close together, such as Japan, Indonesia, or the Philippines.",
    "spatial distribution": "The arrangement of a phenomenon across Earth's surface, analyzed through its density, concentration, and pattern.",
    "density": "The frequency with which a feature occurs within a defined area, commonly calculated as a count divided by area.",
    "concentration": "The extent to which a phenomenon is clustered or dispersed within an area.",
    "expansion diffusion": "The spread of a trait outward from its source while it remains influential there; it includes contagious, hierarchical, and stimulus diffusion.",
    "hierarchical diffusion": "The spread of a trait through influential people, institutions, or major nodes before it reaches other groups or places.",
    "international scale of analysis": "A geographic level of analysis that compares or examines relationships among multiple countries.",
    "precipitation": "Water released from the atmosphere to Earth's surface as rain, snow, sleet, or hail.",
    "climate": "The long-term average pattern of temperature, precipitation, winds, and other atmospheric conditions in a region.",
    "carrying capacity": "The largest population an environment can support over time without degrading the resource base needed to sustain it.",
    "crude birth rate (cbr)": "The annual number of live births per 1,000 people in a population.",
    "crude death rate (cdr)": "The annual number of deaths per 1,000 people in a population.",
    "immigration": "Movement into a country or region for temporary or permanent residence.",
    "emigration": "Movement out of a country or region to reside elsewhere.",
    "critical distance": "The distance beyond which the cost, time, or effort of travel discourages a person from making a trip or migration.",
    "majority-minority population": "A population in which groups traditionally classified as racial or ethnic minorities collectively make up more than half of the total.",
    "intraregional migration": "Permanent movement from one location to another within the same region of a country.",
    "remittances": "Money migrants earn in a destination and send to family members or communities in their place of origin.",
    "great migration in the united states": "The twentieth-century movement of millions of African Americans from the rural South to northern, midwestern, and western cities for jobs and to escape segregation and racial violence.",
    "return migration": "Migration back to a person's place or country of origin after living elsewhere.",
    "malthusian theory": "Thomas Malthus's theory that population can grow geometrically while food production grows only arithmetically, creating checks such as famine, disease, and conflict unless population growth slows.",
    "language as a cultural trait": "A structured system of communication that carries cultural identity, spreads through migration and diffusion, and can unify or divide places.",
    "folk music": "Traditional music associated with a community or region, usually transmitted through performance and social practice rather than mass commercial distribution.",
    "nomadic warrior theory hypothesis": "The hypothesis that Proto-Indo-European speakers originated on the Eurasian steppe and spread their language through migration, conquest, and domesticated horses.",
    "sedentary farmer theory": "The hypothesis that early Indo-European languages spread from Anatolia with the gradual diffusion of agriculture and settled farming communities.",
    "literary tradition": "A language's established system of writing and written works, which helps standardize and preserve it across time and space.",
    "religious branch": "A large, fundamental division within a religion, such as Roman Catholicism, Eastern Orthodoxy, and Protestantism within Christianity.",
    "territorial sea": "Coastal waters extending up to 12 nautical miles from a state's baseline, where the state exercises sovereignty subject to innocent passage.",
    "contiguous zone": "Waters extending up to 24 nautical miles from a state's baseline, where it may enforce customs, immigration, fiscal, and sanitation laws.",
    "high seas": "Ocean areas beyond national exclusive economic zones that are open to navigation and use by all states under international law.",
    "ethnonationalism": "Nationalism in which shared ethnic identity supports claims to political autonomy, sovereignty, or an independent state.",
    "democracy": "A political system in which citizens exercise sovereignty directly or through elected representatives in competitive, meaningful elections.",
    "autocracy": "A political system in which one ruler or a small group holds concentrated power with limited public participation or institutional restraint.",
    "anocracy": "A mixed or transitional political system combining democratic and authoritarian characteristics.",
    "arable land": "Land suitable for cultivation and crop production.",
    "income disparity": "The unequal distribution of income among individuals, groups, regions, or countries.",
    "crop rotation": "A planned sequence of different crops on the same field across seasons to maintain soil fertility and reduce pests, diseases, and erosion.",
    "irrigation": "The artificial delivery of water to crops or soil when rainfall is insufficient or unreliable.",
    "sustainability": "Using resources to meet present needs while maintaining environmental systems and future generations' ability to meet their needs.",
    "fallow": "Cultivated land deliberately left unplanted for a period so soil moisture and fertility can recover.",
    "domestication of plants": "The deliberate selection and cultivation of wild plants for useful traits, a key development of the Neolithic agricultural revolution.",
    "chemical fertilizers": "Manufactured substances added to soil to supply plant nutrients, especially nitrogen, phosphorus, and potassium.",
    "chemical pesticides": "Synthetic chemicals used to control insects, weeds, fungi, and other organisms that damage crops.",
    "mechanization": "The replacement or supplementation of human and animal labor with machinery in agriculture or industry.",
    "biotechnology": "The use of living organisms, cells, or biological processes to develop products or alter crops and livestock.",
    "factory farming": "Large-scale, intensive livestock production in confined facilities designed to maximize output, also called industrial animal agriculture.",
    "gmos": "Genetically modified organisms whose DNA has been altered using genetic engineering to introduce desired traits.",
    "appellation": "A recognized geographic name associated with a product's origin and qualities, such as a protected wine or cheese region.",
    "renewable resource": "A resource replenished naturally on a human time scale when managed sustainably, such as solar energy, wind, forests, or freshwater.",
    "grazing in the von thünen model": "Extensive livestock grazing occupies an outer ring because animals need large areas of inexpensive land and can transport themselves to market.",
    "quinary production": "The highest-level decision-making and leadership functions in government, business, research, education, and nonprofit institutions.",
    "non-renewable": "A resource that forms too slowly to be replaced on a human time scale, including fossil fuels and most mineral deposits.",
    "renewable": "An energy resource replenished naturally on a human time scale, such as solar, wind, hydroelectric, geothermal, or tidal energy.",
    "alternative energy": "Energy sources used in place of conventional fossil fuels, often including solar, wind, geothermal, tidal, and nuclear power.",
    "returns on investment": "A profitability measure comparing the gain or loss from an investment with its original cost.",
    "infrastructure": "The basic systems supporting society and economic activity, including transportation, energy, water, sanitation, and communications networks.",
    "developmental loans": "Funds lent by governments or international institutions for infrastructure, education, health, or economic development projects.",
    "donor state": "A country that provides development assistance, grants, loans, or technical support to another country.",
    "keiretsu": "A Japanese network of independent firms linked through cross-ownership, long-term business relationships, and often a major bank.",
    "chaebol": "A large, family-controlled South Korean business conglomerate composed of many affiliated companies.",
    "trade surplus": "A condition in which the value of a country's exports exceeds the value of its imports.",
    "the cycle of dependency": "A pattern in which poorer countries remain reliant on wealthier countries for investment, technology, manufactured goods, or loans.",
    "capital accumulation": "The growth of productive assets and financial capital through saving, investment, and reinvested profits.",
    "periphery": "In world-systems theory, less-developed countries that supply raw materials and low-cost labor and have limited global influence.",
    "semi-periphery": "In world-systems theory, countries with characteristics of both core and peripheral economies that mediate between the two.",
    "creative class": "Highly educated workers in knowledge, design, technology, arts, research, and professional fields associated with innovation and urban growth.",
    "product cycle": "The stages a product passes through from introduction and growth to maturity and eventual decline or relocation of production.",
    "millennium development goals": "Eight United Nations targets adopted in 2000 for achievement by 2015, addressing poverty, education, health, equality, and sustainability.",
    "market hinterland": "The surrounding area served by a central place, from which customers travel to obtain its goods and services.",
    "urban hierarchy": "The ranking of settlements by population, market area, and the number and complexity of services they provide.",
    "suitcase farming": "Commercial farming in which the operator does not live on the farm and travels to it as needed, often using mechanized production on large holdings.",
    "suburban cbds": "Concentrations of offices, retail, and services outside downtown, often located near highway interchanges in metropolitan suburbs.",
    "growth boundaries": "Lines limiting outward urban development to contain sprawl, protect farmland, and encourage denser development.",
    "lateral commuting": "Travel between suburban residences and suburban or edge-city workplaces without entering the traditional central city.",
    "counter commuting": "Travel from a central city residence to a workplace in the suburbs or an edge city.",
    "conurbation": "A continuous urbanized region formed when expanding cities and towns grow together while retaining separate political identities.",
    "urban primacy": "The dominance of one city over a country's urban system, often measured when the largest city is more than twice the size of the second largest.",
    "segregation": "The spatial separation of social, racial, ethnic, or economic groups through law, discrimination, markets, or institutional practices.",
    "restrictive covenants": "Private property agreements that historically prohibited sale or occupancy by specified racial, ethnic, or religious groups.",
    "mass transit": "High-capacity public transportation such as buses, subways, and commuter rail that moves many passengers along shared routes.",
    "united nations convention on the law of the sea (unclos)": "The international legal framework governing maritime boundaries and ocean use, including territorial seas, contiguous zones, exclusive economic zones, and the high seas.",
    "north american free trade agreement (nafta)": "A trade agreement among Canada, Mexico, and the United States that reduced many barriers to regional trade in 1994; it was replaced by the USMCA in 2020.",
    "gni at purchasing power parity (ppp)": "Gross national income adjusted for differences in local prices, allowing standards of living and purchasing power to be compared more meaningfully across countries.",
    "sustainable resource use": "Managing renewable resources at a rate that allows replenishment and preserves ecosystem functions and biodiversity over time.",
    "core countries": "In world-systems theory, wealthy, highly industrialized countries that dominate global trade, finance, technology, and decision-making.",
    "peripheral countries": "In world-systems theory, less-developed countries that often supply raw materials and low-cost labor to the global economy.",
    "cultural landscape": "The visible imprint of human activity and culture on the natural landscape, including buildings, land use, language, religion, and settlement patterns.",
    "interfaith": "Relations, dialogue, or activities involving people or institutions from different religions.",
    "multi-ethnic state": "A sovereign state whose population contains multiple ethnic groups, such as the United States, Canada, or Nigeria.",
    "versailles peace conference": "The 1919 conference where Allied leaders negotiated the post-World War I settlement and redrew borders in Europe and former imperial territories.",
    "specialized crop": "A crop produced for a particular market or growing environment rather than as part of broadly diversified farming, such as fruit, vegetables, or nuts.",
    "human ecology": "The study of relationships between people, societies, and their physical and biological environments.",
    "food web": "A network of interconnected food chains showing how energy and nutrients move among organisms in an ecosystem.",
    "food chain": "A linear sequence showing how energy and nutrients pass from producers to consumers and decomposers.",
    "spring wheat": "Wheat planted in spring and harvested in late summer or fall, especially in regions with winters too severe for overwintering wheat.",
    "extensive monoculture of staple crops": "Large-scale cultivation of a single staple crop, such as wheat, corn, or soybeans, over a broad area using mechanized methods.",
    "manufacturing": "Secondary-sector activity that transforms raw materials or components into finished or semi-finished products.",
    "resource-dependent country": "A country whose exports, government revenue, or employment relies heavily on a narrow range of natural resources.",
    "mining and energy extraction": "Primary-sector activities that remove minerals and energy resources from Earth for processing and use.",
    "ecosystem": "A community of organisms interacting with one another and with the nonliving environment as a connected system.",
    "shelf-life": "The length of time a product can be stored before it becomes unsafe, unusable, or loses acceptable quality.",
    "linear settlements": "Settlements arranged in a line along a road, river, coastline, or valley because access follows that corridor.",
    "suburbanization": "The movement of population, housing, and economic activity from central cities to surrounding suburban areas.",
    "wasps": "White Anglo-Saxon Protestants, a historically influential ethnocultural group in the United States.",
    "post-industrial city": "A city whose economy has shifted from manufacturing toward services, information, finance, technology, and knowledge-based employment.",
    "gateway cities": "Cities that serve as major entry points for migrants, trade, capital, or ideas into a country or region.",
})


def clean(value):
    value = re.sub(r"\s+", " ", str(value or "")).strip(" -\t\n")
    value = re.sub(r"\bUnit\s+\d+\s+(?:Vocabulary|Vocab|Notes|Review)\b", "", value, flags=re.I)
    return re.sub(r"\s+", " ", value).strip()


def normalized(value):
    return clean(value).casefold()


def load_units(path):
    text = path.read_text()
    if path.suffix == ".js":
        decks = json.loads(text[text.index("=") + 1:].strip().rstrip(";"))
        return [[{"term": card.get("front"), "definition": card.get("back"), "page": card.get("sourcePage")} for card in deck.get("cards", [])] for deck in decks]
    return json.loads(text)


def main():
    if len(sys.argv) != 3:
        raise SystemExit("usage: generate-aphug-data.py EXTRACTED_JSON OUTPUT_JS")
    input_path, output_path = map(pathlib.Path, sys.argv[1:])
    units = load_units(input_path)
    decks = []
    for unit_number, source_cards in enumerate(units, start=1):
        cards = []
        seen = set()
        for card_number, source_card in enumerate(source_cards, start=1):
            term = clean(source_card.get("term"))
            definition = clean(source_card.get("definition"))
            if not term or term.lower() in {"chapter overview", f"unit {unit_number} vocabulary", f"unit {unit_number} vocab"}:
                continue
            original_normalized = normalized(term)
            if original_normalized in REMOVE_TERMS.get(unit_number, set()) or original_normalized in CURATION_REMOVE.get(unit_number, set()):
                continue
            term = TERM_RENAMES.get((unit_number, original_normalized), term)
            normalized_term = normalized(term)
            if normalized_term in seen:
                continue
            seen.add(normalized_term)
            definition = SOURCE_REPAIRS.get((unit_number, term), definition)
            definition = BACK_OVERRIDES.get(normalized_term, definition)
            if not definition or "highlighted AP Human Geography concept" in definition:
                continue
            cards.append({
                "id": f"aphug-u{unit_number}-c{card_number}",
                "front": term,
                "back": definition,
                "sourcePage": source_card.get("page"),
            })
        decks.append({
            "id": f"aphug-unit-{unit_number}",
            "name": f"AP Human Geography · Unit {unit_number}",
            "shortName": f"Unit {unit_number}",
            "builtIn": True,
            "sourceTitle": SOURCE_TITLE,
            "sourceUrl": SOURCE_URL,
            "cards": cards,
            "questions": [],
            "feynmanPrompts": [],
        })
    payload = "window.AP_HUMAN_GEOGRAPHY_DECKS = " + json.dumps(decks, ensure_ascii=False, separators=(",", ":")) + ";\n"
    output_path.write_text(payload)
    print(f"Wrote {sum(len(deck['cards']) for deck in decks)} cards across {len(decks)} units to {output_path}")


if __name__ == "__main__":
    main()
