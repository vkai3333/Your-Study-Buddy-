#!/usr/bin/env python3
"""Build the offline Countries of the World fact bank from public datasets."""

from __future__ import annotations

import html
import json
import math
import re
import shutil
import zipfile
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tmp" / "geography-source"
OUTPUT = ROOT / "dist" / "geography-locations-data.js"
FLAG_OUTPUT = ROOT / "dist" / "assets" / "geography" / "flags"
OUTLINE_OUTPUT = ROOT / "dist" / "assets" / "geography" / "outlines"

# Populated dependencies and territories that are useful for location study but
# are not part of the default sovereign-country set.
TERRITORY_CODES = {
    "AI", "AS", "AW", "AX", "BL", "BM", "BQ", "BV", "CC", "CK", "CW",
    "CX", "FK", "FO", "GF", "GG", "GI", "GL", "GP", "GS", "GU", "HK",
    "HM", "IM", "IO", "JE", "KY", "MF", "MO", "MP", "MQ", "MS", "NC",
    "NF", "NU", "PF", "PM", "PN", "PR", "RE", "SH", "SJ", "SX", "TC",
    "TF", "TK", "UM", "VG", "VI", "WF", "YT",
}


def region_name(country: dict) -> str:
    region = country.get("region") or "Other"
    subregion = country.get("subregion") or ""
    if region == "Americas":
        return "South America" if subregion == "South America" else "North America & Caribbean"
    return region


def largest_cities() -> dict[str, str]:
    by_code: dict[str, tuple[int, str]] = {}
    with zipfile.ZipFile(SOURCE / "cities15000.zip") as archive:
        for raw in archive.read("cities15000.txt").decode("utf-8").splitlines():
            fields = raw.split("\t")
            if len(fields) < 15:
                continue
            code, name = fields[8], fields[2] or fields[1]
            population = int(fields[14] or 0)
            if population > by_code.get(code, (-1, ""))[0]:
                by_code[code] = (population, name)

    # Natural Earth fills gaps for small states whose largest settlement is below
    # GeoNames' 15,000-person download threshold.
    places = json.loads((SOURCE / "populated-places.geojson").read_text())
    fallbacks: dict[str, tuple[int, str]] = {}
    for feature in places["features"]:
        props = feature["properties"]
        code = props.get("ISO_A2")
        name = props.get("NAMEASCII") or props.get("NAME")
        population = int(props.get("POP_MAX") or 0)
        if code and code != "-99" and name and population > fallbacks.get(code, (-1, ""))[0]:
            fallbacks[code] = (population, name)
    return {code: value[1] for code, value in (fallbacks | by_code).items()}


def feature_code(props: dict) -> set[str]:
    return {
        str(props.get(key) or "")
        for key in ("ADM0_A3", "ISO_A3", "SOV_A3", "GU_A3", "SU_A3", "WB_A3", "ADM0_A3_US")
    }


def collect_rings(geometry: dict) -> list[list[list[float]]]:
    if geometry["type"] == "Polygon":
        return geometry["coordinates"]
    if geometry["type"] == "MultiPolygon":
        return [ring for polygon in geometry["coordinates"] for ring in polygon]
    return []


def point_line_distance(point, start, end) -> float:
    x, y = point
    x1, y1 = start
    x2, y2 = end
    dx, dy = x2 - x1, y2 - y1
    if dx == dy == 0:
        return math.hypot(x - x1, y - y1)
    t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
    return math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))


def simplify(points, epsilon=0.035):
    if len(points) < 4:
        return points
    maximum, split = 0.0, 0
    for index in range(1, len(points) - 1):
        distance = point_line_distance(points[index], points[0], points[-1])
        if distance > maximum:
            maximum, split = distance, index
    if maximum <= epsilon:
        return [points[0], points[-1]]
    return simplify(points[: split + 1], epsilon)[:-1] + simplify(points[split:], epsilon)


def projected_paths(rings, box) -> list[str]:
    if not rings:
        return []
    points = [point for ring in rings for point in ring]
    min_x, max_x = min(p[0] for p in points), max(p[0] for p in points)
    min_y, max_y = min(p[1] for p in points), max(p[1] for p in points)
    width, height = max(max_x - min_x, .00001), max(max_y - min_y, .00001)
    box_x, box_y, box_width, box_height = box
    scale = min(box_width / width, box_height / height)
    offset_x = box_x + (box_width - width * scale) / 2
    offset_y = box_y + (box_height - height * scale) / 2
    epsilon = min(.035, max(width, height) / 350)
    paths = []
    for ring in rings:
        reduced = simplify(ring, epsilon)
        projected = [(offset_x + (x - min_x) * scale, offset_y + (max_y - y) * scale) for x, y in reduced]
        if len(projected) >= 3:
            paths.append("M" + " ".join(f"{x:.1f},{y:.1f}" for x, y in projected) + "Z")
    return paths


def united_states_paths(rings) -> list[str]:
    mainland, alaska, hawaii = [], [], []
    for ring in rings:
        center_x = sum(point[0] for point in ring) / len(ring)
        center_y = sum(point[1] for point in ring) / len(ring)
        if center_y > 45 and (center_x < -130 or center_x > 130):
            alaska.append([[(x - 360) if x > 0 else x, y] for x, y in ring])
        elif center_y < 26 and center_x < -140:
            hawaii.append(ring)
        else:
            mainland.append(ring)
    # Familiar atlas layout: contiguous states large, Alaska and Hawaii as compact insets.
    return (projected_paths(mainland, (155, 25, 710, 405))
            + projected_paths(alaska, (25, 355, 250, 170))
            + projected_paths(hawaii, (300, 455, 205, 70)))


def outline_svg(features: list[dict], country_name: str, country_code: str) -> str:
    rings = [ring for feature in features for ring in collect_rings(feature["geometry"]) if len(ring) >= 3]
    if not rings:
        return ""
    paths = united_states_paths(rings) if country_code == "US" else projected_paths(rings, (30, 30, 840, 500))
    title = html.escape(country_name)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560" role="img" '
            f'aria-label="Outline of {title}"><title>Outline of {title}</title><rect width="900" height="560" '
            f'rx="28" fill="#f7f8ff"/><path d="{" ".join(paths)}" fill="#d9dcff" stroke="#34375f" '
            f'stroke-width="5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>')


def main() -> None:
    countries = json.loads((SOURCE / "countriesV3.1.json").read_text())
    countries = [country for country in countries if country.get("unMember") or country.get("cca2") in {"PS", "VA", "GW"} | TERRITORY_CODES]
    country_names_by_code = {country["cca3"]: country["name"]["common"] for country in countries}
    cities = largest_cities()
    detailed_outlines = SOURCE / "country-outlines-10m.geojson"
    outline_data = json.loads((detailed_outlines if detailed_outlines.exists() else SOURCE / "country-outlines.geojson").read_text())
    outlines: dict[str, list[dict]] = defaultdict(list)
    for feature in outline_data["features"]:
        for code in feature_code(feature["properties"]):
            if code:
                outlines[code].append(feature)

    FLAG_OUTPUT.mkdir(parents=True, exist_ok=True)
    OUTLINE_OUTPUT.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(SOURCE / "flag-icons.zip") as archive:
        names = set(archive.namelist())
        for country in countries:
            code = country["cca2"].lower()
            source_name = f"flag-icons-main/flags/4x3/{code}.svg"
            if source_name in names:
                with archive.open(source_name) as source, (FLAG_OUTPUT / f"{code}.svg").open("wb") as target:
                    shutil.copyfileobj(source, target)

    records = []
    missing_outlines = []
    for country in sorted(countries, key=lambda item: item["name"]["common"]):
        code2, code3 = country["cca2"], country["cca3"]
        name = country["name"]["common"]
        candidates = outlines.get(code3, [])
        if not candidates:
            # Natural Earth uses PSX for Palestine.
            candidates = outlines.get({"PSE": "PSX"}.get(code3, ""), [])
        san_marino_source = ROOT / "tools" / "geography-sources" / "smr-boundary.geojson"
        if code2 == "SM" and san_marino_source.exists():
            candidates = json.loads(san_marino_source.read_text())["features"]
        candidate_rings = [ring for feature in candidates for ring in collect_rings(feature["geometry"]) if len(ring) >= 3]
        unique_boundary_points = {tuple(point) for ring in candidate_rings for point in ring}
        # Tiny islands can collapse into triangles in Natural Earth's generalized
        # polygons. Omitting a misleading outline is better than teaching a false shape.
        svg = outline_svg(candidates, name, code2) if len(unique_boundary_points) >= 12 else ""
        if svg and len(set(re.findall(r"(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)", svg))) < 12:
            svg = ""
        if svg:
            (OUTLINE_OUTPUT / f"{code2.lower()}.svg").write_text(svg)
        else:
            (OUTLINE_OUTPUT / f"{code2.lower()}.svg").unlink(missing_ok=True)
            missing_outlines.append(code2)
        currencies = country.get("currencies") or {}
        currency_values = [
            {"code": code, "name": value.get("name") or code, "symbol": value.get("symbol") or ""}
            for code, value in currencies.items()
        ]
        capitals = country.get("capital") or []
        calling = country.get("idd") or {}
        calling_root = calling.get("root") or ""
        calling_suffixes = calling.get("suffixes") or []
        if calling_root == "+1" and len(calling_suffixes) > 10:
            calling_codes = "+1"
        else:
            calling_codes = ", ".join(f"{calling_root}{suffix}" for suffix in calling_suffixes[:4]) or calling_root or "Not available"
        records.append({
            "id": code2.lower(),
            "territory": code2 in TERRITORY_CODES,
            "country": name,
            "capital": ", ".join(capitals) or "No official capital",
            "largestCity": cities.get(code2) or (capitals[0] if capitals else "Not available"),
            "currencies": currency_values,
            "region": region_name(country),
            "continent": ", ".join(country.get("continents") or []) or country.get("region") or "Not available",
            "subregion": country.get("subregion") or "Not available",
            "languages": sorted((country.get("languages") or {}).values()),
            "population": country.get("population") or 0,
            "area": country.get("area") or 0,
            "countryCodes": f"{code2} / {code3}",
            "callingCode": calling_codes,
            "borders": sorted(country_names_by_code[code] for code in country.get("borders") or [] if code in country_names_by_code),
            "flag": f"./assets/geography/flags/{code2.lower()}.svg",
            "outline": f"./assets/geography/outlines/{code2.lower()}.svg" if svg else "",
        })

    header = "// Generated by tools/generate-geography-bank.py from REST Countries, GeoNames, Natural Earth, and flag-icons.\n"
    OUTPUT.write_text(header + "window.GEOGRAPHY_LOCATION_COUNTRIES = " + json.dumps(records, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(f"Generated {len(records)} countries; missing outlines: {missing_outlines}")


if __name__ == "__main__":
    main()
