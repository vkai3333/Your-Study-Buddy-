#!/usr/bin/env python3
"""Build the U.S. states fact bank and U.S. presidents deck.

State populations come from the Census Vintage 2025 workbook stored in
tools/us-civics-sources. President portraits are Wikimedia thumbnails with
per-file attribution recorded beside the downloaded assets.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import ssl
import time
import urllib.parse
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKBOOK = ROOT / "tools/us-civics-sources/NST-EST2025-POP.xlsx"
PORTRAIT_INDEX = ROOT / "tools/us-civics-sources/presidents-portraits.json"
OUTPUT = ROOT / "dist/us-civics-data.js"
PORTRAIT_DIR = ROOT / "dist/assets/us-presidents"
STATE_ASSET_DIR = ROOT / "dist/assets/us-states"
NS = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
SSL_CONTEXT = ssl.create_default_context(cafile=__import__("certifi").where())

# state|postal|capital|largest city|admission|Census region
STATE_ROWS = """
Alabama|AL|Montgomery|Huntsville|December 14, 1819|South
Alaska|AK|Juneau|Anchorage|January 3, 1959|West
Arizona|AZ|Phoenix|Phoenix|February 14, 1912|West
Arkansas|AR|Little Rock|Little Rock|June 15, 1836|South
California|CA|Sacramento|Los Angeles|September 9, 1850|West
Colorado|CO|Denver|Denver|August 1, 1876|West
Connecticut|CT|Hartford|Bridgeport|January 9, 1788|Northeast
Delaware|DE|Dover|Wilmington|December 7, 1787|South
Florida|FL|Tallahassee|Jacksonville|March 3, 1845|South
Georgia|GA|Atlanta|Atlanta|January 2, 1788|South
Hawaii|HI|Honolulu|Honolulu|August 21, 1959|West
Idaho|ID|Boise|Boise|July 3, 1890|West
Illinois|IL|Springfield|Chicago|December 3, 1818|Midwest
Indiana|IN|Indianapolis|Indianapolis|December 11, 1816|Midwest
Iowa|IA|Des Moines|Des Moines|December 28, 1846|Midwest
Kansas|KS|Topeka|Wichita|January 29, 1861|Midwest
Kentucky|KY|Frankfort|Louisville|June 1, 1792|South
Louisiana|LA|Baton Rouge|New Orleans|April 30, 1812|South
Maine|ME|Augusta|Portland|March 15, 1820|Northeast
Maryland|MD|Annapolis|Baltimore|April 28, 1788|South
Massachusetts|MA|Boston|Boston|February 6, 1788|Northeast
Michigan|MI|Lansing|Detroit|January 26, 1837|Midwest
Minnesota|MN|Saint Paul|Minneapolis|May 11, 1858|Midwest
Mississippi|MS|Jackson|Jackson|December 10, 1817|South
Missouri|MO|Jefferson City|Kansas City|August 10, 1821|Midwest
Montana|MT|Helena|Billings|November 8, 1889|West
Nebraska|NE|Lincoln|Omaha|March 1, 1867|Midwest
Nevada|NV|Carson City|Las Vegas|October 31, 1864|West
New Hampshire|NH|Concord|Manchester|June 21, 1788|Northeast
New Jersey|NJ|Trenton|Newark|December 18, 1787|Northeast
New Mexico|NM|Santa Fe|Albuquerque|January 6, 1912|West
New York|NY|Albany|New York City|July 26, 1788|Northeast
North Carolina|NC|Raleigh|Charlotte|November 21, 1789|South
North Dakota|ND|Bismarck|Fargo|November 2, 1889|Midwest
Ohio|OH|Columbus|Columbus|March 1, 1803|Midwest
Oklahoma|OK|Oklahoma City|Oklahoma City|November 16, 1907|South
Oregon|OR|Salem|Portland|February 14, 1859|West
Pennsylvania|PA|Harrisburg|Philadelphia|December 12, 1787|Northeast
Rhode Island|RI|Providence|Providence|May 29, 1790|Northeast
South Carolina|SC|Columbia|Charleston|May 23, 1788|South
South Dakota|SD|Pierre|Sioux Falls|November 2, 1889|Midwest
Tennessee|TN|Nashville|Nashville|June 1, 1796|South
Texas|TX|Austin|Houston|December 29, 1845|South
Utah|UT|Salt Lake City|Salt Lake City|January 4, 1896|West
Vermont|VT|Montpelier|Burlington|March 4, 1791|Northeast
Virginia|VA|Richmond|Virginia Beach|June 25, 1788|South
Washington|WA|Olympia|Seattle|November 11, 1889|West
West Virginia|WV|Charleston|Charleston|June 20, 1863|South
Wisconsin|WI|Madison|Milwaukee|May 29, 1848|Midwest
Wyoming|WY|Cheyenne|Cheyenne|July 10, 1890|West
""".strip()

# name|number|term|party|concise study summary
PRESIDENT_ROWS = """
George Washington|1st|1789–1797|Unaffiliated|Established major presidential precedents; supported Hamilton’s financial program; proclaimed neutrality in European wars; oversaw the response to the Whiskey Rebellion.
John Adams|2nd|1797–1801|Federalist|Avoided full war with France after the XYZ Affair; signed the Alien and Sedition Acts; appointed John Marshall chief justice.
Thomas Jefferson|3rd|1801–1809|Democratic-Republican|Completed the Louisiana Purchase; sponsored the Lewis and Clark expedition; imposed the Embargo Act; reduced some federal taxes and military spending.
James Madison|4th|1809–1817|Democratic-Republican|Led the nation through the War of 1812; oversaw the burning of Washington and the Treaty of Ghent; supported the Second Bank of the United States.
James Monroe|5th|1817–1825|Democratic-Republican|Presided over the Era of Good Feelings; issued the Monroe Doctrine; acquired Florida; signed the Missouri Compromise.
John Quincy Adams|6th|1825–1829|Democratic-Republican|Promoted federal support for roads, canals, science, and education; faced opposition after the disputed 1824 election and “corrupt bargain” charge.
Andrew Jackson|7th|1829–1837|Democratic|Expanded presidential power; fought the Bank of the United States; enforced Indian removal; confronted nullification; used the spoils system.
Martin Van Buren|8th|1837–1841|Democratic|Faced the Panic of 1837 and a prolonged depression; created the Independent Treasury; continued federal Indian removal policy.
William Henry Harrison|9th|March 4–April 4, 1841|Whig|Delivered the longest inaugural address; died after 31 days, the shortest presidency, creating uncertainty about presidential succession.
John Tyler|10th|1841–1845|Whig, then unaffiliated|Established that a vice president fully becomes president after a president dies; vetoed Whig banking bills; supported the annexation of Texas.
James K. Polk|11th|1845–1849|Democratic|Led the United States in the Mexican–American War; settled the Oregon boundary; greatly expanded U.S. territory; lowered tariffs and restored the Independent Treasury.
Zachary Taylor|12th|1849–1850|Whig|Opposed extending slavery into territories gained from Mexico; encouraged California statehood; died in office before the Compromise of 1850.
Millard Fillmore|13th|1850–1853|Whig|Signed the Compromise of 1850, including the Fugitive Slave Act; supported opening trade with Japan through the Perry expedition.
Franklin Pierce|14th|1853–1857|Democratic|Signed the Kansas–Nebraska Act; violence in “Bleeding Kansas” intensified sectional conflict; supported expansionist diplomacy including the Gadsden Purchase.
James Buchanan|15th|1857–1861|Democratic|Backed the proslavery Lecompton Constitution; failed to halt the secession crisis; his administration was marked by the Dred Scott decision and sectional collapse.
Abraham Lincoln|16th|1861–1865|Republican|Led the Union through the Civil War; issued the Emancipation Proclamation; supported the Thirteenth Amendment; expanded federal wartime power; was assassinated.
Andrew Johnson|17th|1865–1869|National Union / Democratic|Clashed with Congress over Reconstruction; vetoed civil-rights legislation; was impeached after violating the Tenure of Office Act and acquitted by one Senate vote.
Ulysses S. Grant|18th|1869–1877|Republican|Enforced Reconstruction and fought the Ku Klux Klan; supported the Fifteenth Amendment; pursued Native American “Peace Policy”; his administration suffered major scandals.
Rutherford B. Hayes|19th|1877–1881|Republican|Took office after the disputed 1876 election and Compromise of 1877; withdrew remaining federal troops from the South; promoted civil-service reform.
James A. Garfield|20th|March 4–September 19, 1881|Republican|Supported civil-service reform and Black voting rights; was assassinated after only months in office, helping build support for the Pendleton Act.
Chester A. Arthur|21st|1881–1885|Republican|Signed the Pendleton Civil Service Reform Act; modernized the Navy; signed the Chinese Exclusion Act after vetoing a longer version.
Grover Cleveland|22nd and 24th|1885–1889; 1893–1897|Democratic|Only president before Trump to serve nonconsecutive terms; pursued tariff reduction and limited government; faced the Pullman Strike and Panic of 1893.
Benjamin Harrison|23rd|1889–1893|Republican|Signed the Sherman Antitrust Act and McKinley Tariff; admitted six western states; supported federal protection of Black voting rights.
William McKinley|25th|1897–1901|Republican|Led the nation through the Spanish–American War; annexed Hawaii; acquired overseas territories; was assassinated early in his second term.
Theodore Roosevelt|26th|1901–1909|Republican|Advanced the Square Deal; regulated corporations; expanded conservation; backed the Panama Canal; asserted U.S. power through the Roosevelt Corollary.
William Howard Taft|27th|1909–1913|Republican|Pursued antitrust cases; promoted Dollar Diplomacy; supported the Sixteenth Amendment; later became chief justice of the United States.
Woodrow Wilson|28th|1913–1921|Democratic|Created the Federal Reserve and Federal Trade Commission; led the United States in World War I; proposed the Fourteen Points and League of Nations; presided over federal segregation and wartime repression.
Warren G. Harding|29th|1921–1923|Republican|Promoted a “return to normalcy”; signed the Budget and Accounting Act; his administration became associated with Teapot Dome and other scandals.
Calvin Coolidge|30th|1923–1929|Republican|Favored limited government, tax cuts, and business growth; signed the Immigration Act of 1924; declined major federal relief for struggling farmers.
Herbert Hoover|31st|1929–1933|Republican|The Great Depression began during his presidency; supported voluntary and limited federal responses, the Reconstruction Finance Corporation, and the Smoot–Hawley Tariff; ordered removal of the Bonus Army camp.
Franklin D. Roosevelt|32nd|1933–1945|Democratic|Launched the New Deal; reshaped the federal government; led the nation through most of World War II; signed Executive Order 9066 authorizing Japanese American incarceration; served four terms.
Harry S. Truman|33rd|1945–1953|Democratic|Authorized atomic bombings of Japan; announced the Truman Doctrine and Marshall Plan; recognized Israel; desegregated the armed forces; led during the Korean War.
Dwight D. Eisenhower|34th|1953–1961|Republican|Ended active U.S. participation in the Korean War; created the Interstate Highway System; enforced school desegregation in Little Rock; warned about the military-industrial complex.
John F. Kennedy|35th|1961–1963|Democratic|Managed the Cuban Missile Crisis; launched the Peace Corps; backed the space program; faced the Bay of Pigs and expanding Vietnam involvement; was assassinated.
Lyndon B. Johnson|36th|1963–1969|Democratic|Won passage of major civil-rights laws; created Medicare and Medicaid through the Great Society; escalated U.S. involvement in Vietnam.
Richard Nixon|37th|1969–1974|Republican|Opened relations with China; pursued détente with the Soviet Union; created the EPA; expanded and later reduced U.S. involvement in Vietnam; resigned over Watergate.
Gerald Ford|38th|1974–1977|Republican|Pardoned Richard Nixon; signed the Helsinki Accords; faced inflation, recession, and the final U.S. withdrawal from Vietnam.
Jimmy Carter|39th|1977–1981|Democratic|Brokered the Camp David Accords; established the Departments of Energy and Education; emphasized human rights; faced the Iran hostage crisis and energy problems.
Ronald Reagan|40th|1981–1989|Republican|Advanced tax cuts, deregulation, and higher defense spending; confronted the Soviet Union before later arms-control agreements; appointed conservative judges; faced the Iran–Contra affair.
George H. W. Bush|41st|1989–1993|Republican|Led the coalition in the Persian Gulf War; managed the end of the Cold War; signed the Americans with Disabilities Act; broke his “no new taxes” pledge.
Bill Clinton|42nd|1993–2001|Democratic|Signed NAFTA and welfare reform; presided over economic growth and budget surpluses; intervened in the Balkans; was impeached and acquitted.
George W. Bush|43rd|2001–2009|Republican|Responded to the September 11 attacks; launched wars in Afghanistan and Iraq; signed the PATRIOT Act and No Child Left Behind; faced Hurricane Katrina and the 2008 financial crisis.
Barack Obama|44th|2009–2017|Democratic|Signed the Affordable Care Act and economic stimulus; oversaw the operation that killed Osama bin Laden; supported the Paris climate agreement; was the first African American president.
Donald Trump|45th and 47th|2017–2021; 2025–present|Republican|Signed major tax cuts; appointed three Supreme Court justices; pursued restrictive immigration and tariff policies; was impeached twice and acquitted twice; returned for a nonconsecutive second presidency.
Joe Biden|46th|2021–2025|Democratic|Signed major pandemic relief, infrastructure, climate, and semiconductor legislation; supported Ukraine after Russia’s invasion; ended the U.S. military presence in Afghanistan; appointed Ketanji Brown Jackson to the Supreme Court.
""".strip()


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def import_state_assets(flags_dir: Path, outlines_dir: Path) -> None:
    """Copy the two sourced SVG collections into stable app-local paths."""
    flag_overrides = {
        "Colorado": "Flag_of_Colorado_designed_by_Andrew_Carlisle_Carson.svg",
        "Georgia": "Flag_of_Georgia_(U.S._state).svg",
    }
    flag_target = STATE_ASSET_DIR / "flags"
    outline_target = STATE_ASSET_DIR / "outlines"
    flag_target.mkdir(parents=True, exist_ok=True)
    outline_target.mkdir(parents=True, exist_ok=True)
    for line in STATE_ROWS.splitlines():
        name = line.split("|", 1)[0]
        flag_name = flag_overrides.get(name, f"Flag_of_{name.replace(' ', '_')}.svg")
        outline_name = f"{name.replace(' ', '_')}.svg"
        flag_source = flags_dir / flag_name
        outline_source = outlines_dir / outline_name
        if not flag_source.is_file() or not outline_source.is_file():
            raise FileNotFoundError(f"Missing state visual for {name}: {flag_source}, {outline_source}")
        shutil.copy2(flag_source, flag_target / f"{slug(name)}.svg")
        shutil.copy2(outline_source, outline_target / f"{slug(name)}.svg")
    (STATE_ASSET_DIR / "CREDITS.md").write_text(
        "# U.S. state visual credits\n\n"
        "- State flags: [nibsbin/us-state-flags-svg](https://github.com/nibsbin/us-state-flags-svg), "
        "sourced from the public-domain state flag files on Wikipedia.\n"
        "- State outlines: [solastley/US-State-SVGs](https://github.com/solastley/US-State-SVGs).\n",
        encoding="utf-8",
    )


def census_populations() -> dict[str, int]:
    with zipfile.ZipFile(WORKBOOK) as archive:
        strings_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
        strings = ["".join(node.itertext()).lstrip(".") for node in strings_root.findall("x:si", NS)]
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
    populations = {}
    for row in sheet.findall(".//x:sheetData/x:row", NS):
        cells = {re.match(r"[A-Z]+", cell.attrib["r"]).group(): cell for cell in row.findall("x:c", NS)}
        if "A" not in cells or "H" not in cells:
            continue
        av = cells["A"].find("x:v", NS)
        hv = cells["H"].find("x:v", NS)
        if av is None or hv is None or cells["A"].attrib.get("t") != "s":
            continue
        name = strings[int(av.text)]
        if name in {line.split("|")[0] for line in STATE_ROWS.splitlines()}:
            populations[name] = int(float(hv.text))
    return populations


def wiki_json(params: dict[str, str], host: str = "en.wikipedia.org") -> dict:
    url = f"https://{host}/w/api.php?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": "YourStudyBuddy/1.0 (educational offline deck)"})
    with urllib.request.urlopen(request, timeout=30, context=SSL_CONTEXT) as response:
        return json.load(response)


def portrait_records() -> dict[str, dict]:
    records = json.loads(PORTRAIT_INDEX.read_text(encoding="utf-8"))
    result = {}
    for record in records:
        result.setdefault(record["name"], record)
    result["George H. W. Bush"] = result.pop("George Bush")
    result["George H. W. Bush"].update({
        "imageUrl": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/George_H._W._Bush_presidential_portrait_%28cropped%29_%282%29.jpg/500px-George_H._W._Bush_presidential_portrait_%28cropped%29_%282%29.jpg",
        "wikipedia": "https://en.wikipedia.org/wiki/George_H._W._Bush",
    })
    result["Chester A. Arthur"] = result.pop("Chester Arthur")
    return result


def download_portrait(name: str, filename: str, records: dict[str, dict]) -> dict[str, str]:
    record = records.get(name)
    if not record:
        raise RuntimeError(f"No portrait URL found for {name}")
    image_url = re.sub(r"/\d+px-", "/330px-", record["imageUrl"])
    request = urllib.request.Request(image_url, headers={"User-Agent": "YourStudyBuddy/1.0"})
    for attempt in range(5):
        try:
            data = urllib.request.urlopen(request, timeout=30, context=SSL_CONTEXT).read()
            break
        except urllib.error.HTTPError as error:
            if error.code != 429 or attempt == 4:
                raise
            time.sleep(5 * (attempt + 1))
    (PORTRAIT_DIR / filename).write_bytes(data)
    return {"file": f"Portrait of {name}", "artist": "attribution on the linked source page", "license": "license on the linked source page", "source": record["wikipedia"]}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--download-portraits", action="store_true")
    parser.add_argument("--start-at", type=int, default=1, help="Resume portrait downloads at this one-based president index")
    parser.add_argument("--flags-dir", type=Path, help="Import SVG state flags from this source directory")
    parser.add_argument("--outlines-dir", type=Path, help="Import SVG state outlines from this source directory")
    args = parser.parse_args()
    if bool(args.flags_dir) != bool(args.outlines_dir):
        parser.error("--flags-dir and --outlines-dir must be supplied together")
    if args.flags_dir:
        import_state_assets(args.flags_dir, args.outlines_dir)
    populations = census_populations()
    states = []
    for line in STATE_ROWS.splitlines():
        name, abbreviation, capital, largest_city, admission, region = line.split("|")
        state_slug = slug(name)
        states.append({"id": state_slug, "state": name, "abbreviation": abbreviation, "capital": capital, "largestCity": largest_city, "admission": admission, "region": region, "population": populations[name], "flag": f"./assets/us-states/flags/{state_slug}.svg", "outline": f"./assets/us-states/outlines/{state_slug}.svg"})
    presidents = []
    credits = []
    records = portrait_records() if args.download_portraits else {}
    PORTRAIT_DIR.mkdir(parents=True, exist_ok=True)
    for index, line in enumerate(PRESIDENT_ROWS.splitlines(), 1):
        name, number, term, party, significance = line.split("|", 4)
        filename = f"{slug(name)}.jpg"
        path = PORTRAIT_DIR / filename
        if args.download_portraits and index >= args.start_at:
            credit = download_portrait(name, filename, records)
            time.sleep(2)
        if args.download_portraits:
            record = records[name]
            credits.append(f"- **{name}** — [portrait source]({record['wikipedia']}); attribution and license are listed on the linked source page.\n")
        presidents.append({"id": f"us-president-{index}", "front": name, "back": f"Term: {term}\n\nSignificant events and actions: {significance}", "frontImage": f"./assets/us-presidents/{filename}", "number": number, "party": party})
    if args.download_portraits:
        (PORTRAIT_DIR / "CREDITS.md").write_text("# U.S. president portrait credits\n\nPortraits were downloaded from Wikimedia Commons and retain the licenses listed on their source pages.\n\n" + "".join(credits), encoding="utf-8")
    deck = [{"id": "us-presidents-all", "name": "U.S. Presidents", "shortName": "Presidents", "builtIn": True, "sourceTitle": "White House presidential history and standard historical references", "sourceUrl": "https://www.whitehouse.gov/history/", "cards": presidents, "questions": [], "feynmanPrompts": []}]
    OUTPUT.write_text("window.US_STATE_BANK = " + json.dumps(states, ensure_ascii=False, separators=(",", ":")) + ";\nwindow.US_PRESIDENT_DECKS = " + json.dumps(deck, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Wrote {len(states)} states and {len(presidents)} presidents to {OUTPUT}")


if __name__ == "__main__":
    main()
