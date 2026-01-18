"""
This Day in History - Vedic Edition
FastAPI Backend Server
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, date
from typing import Optional, List
import httpx
import os
from pydantic import BaseModel

from vedic_calc import (
    get_vedic_chart,
    get_planetary_signatures,
    find_matching_signatures,
    calculate_correlation_score,
    calculate_planetary_positions,
    calculate_aspects,
    RASHIS,
    NAKSHATRAS,
)

app = FastAPI(
    title="This Day in History API",
    description="API for historical events with Vedic astronomical data",
    version="1.0.0"
)

# CORS configuration - allow frontend origins
# Set ALLOWED_ORIGINS env var in production (comma-separated list)
default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
env_origins = os.environ.get("ALLOWED_ORIGINS", "")
if env_origins:
    default_origins.extend([o.strip() for o in env_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=default_origins + ["*"],  # Allow all origins for API access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HistoricalEvent(BaseModel):
    year: int
    text: str
    category: Optional[str] = None
    links: Optional[List[dict]] = None


class WikipediaResponse(BaseModel):
    date: str
    events: List[HistoricalEvent]
    births: List[HistoricalEvent]
    deaths: List[HistoricalEvent]


def categorize_event(text: str) -> str:
    """Categorize historical events based on keywords"""
    text_lower = text.lower()
    
    # Battle/War keywords
    if any(word in text_lower for word in ['war', 'battle', 'invasion', 'siege', 'military', 'army', 'troops', 'conflict', 'revolt', 'rebellion']):
        return 'battle'
    
    # Political/Coronation keywords
    if any(word in text_lower for word in ['king', 'queen', 'emperor', 'coronation', 'throne', 'crowned', 'dynasty', 'kingdom', 'empire', 'president', 'prime minister', 'elected']):
        return 'political'
    
    # Discovery/Science keywords
    if any(word in text_lower for word in ['discover', 'invent', 'scientist', 'astronomer', 'patent', 'theory', 'experiment', 'research', 'observatory']):
        return 'discovery'
    
    # Religious keywords
    if any(word in text_lower for word in ['temple', 'church', 'mosque', 'religious', 'pope', 'saint', 'monastery', 'pilgrimage', 'sacred']):
        return 'religious'
    
    # Natural disasters
    if any(word in text_lower for word in ['earthquake', 'flood', 'tsunami', 'volcano', 'hurricane', 'cyclone', 'disaster', 'famine']):
        return 'disaster'
    
    # Cultural/Arts
    if any(word in text_lower for word in ['art', 'music', 'literature', 'poet', 'writer', 'composer', 'theater', 'film', 'published']):
        return 'cultural'
    
    return 'general'


# Country and region detection
COUNTRIES = {
    # Asia
    'India': ['india', 'indian', 'delhi', 'mumbai', 'calcutta', 'kolkata', 'chennai', 'madras', 'bengal', 'punjab', 'gujarat', 'rajasthan', 'maharashtra', 'tamil', 'kerala', 'mughal', 'maratha', 'vijayanagara', 'chola', 'maurya', 'gupta'],
    'China': ['china', 'chinese', 'beijing', 'peking', 'shanghai', 'ming', 'qing', 'tang', 'song', 'han dynasty', 'tibet', 'manchuria'],
    'Japan': ['japan', 'japanese', 'tokyo', 'kyoto', 'osaka', 'shogun', 'samurai', 'meiji', 'edo'],
    'Korea': ['korea', 'korean', 'seoul', 'pyongyang', 'joseon'],
    'Vietnam': ['vietnam', 'vietnamese', 'hanoi', 'saigon'],
    'Thailand': ['thailand', 'thai', 'siam', 'bangkok'],
    'Indonesia': ['indonesia', 'indonesian', 'java', 'sumatra', 'jakarta', 'batavia'],
    'Philippines': ['philippines', 'filipino', 'manila'],
    'Malaysia': ['malaysia', 'malaysian', 'malaya', 'kuala lumpur'],
    'Singapore': ['singapore'],
    'Myanmar': ['myanmar', 'burma', 'burmese', 'rangoon', 'yangon'],
    'Pakistan': ['pakistan', 'pakistani', 'karachi', 'lahore', 'islamabad'],
    'Bangladesh': ['bangladesh', 'bangladeshi', 'dhaka', 'east pakistan'],
    'Sri Lanka': ['sri lanka', 'ceylon', 'sinhalese', 'colombo'],
    'Nepal': ['nepal', 'nepalese', 'kathmandu'],
    'Afghanistan': ['afghanistan', 'afghan', 'kabul', 'kandahar'],
    
    # Middle East
    'Iran': ['iran', 'iranian', 'persia', 'persian', 'tehran', 'isfahan', 'safavid'],
    'Iraq': ['iraq', 'iraqi', 'baghdad', 'babylon', 'mesopotamia', 'basra'],
    'Saudi Arabia': ['saudi', 'arabia', 'arabian', 'mecca', 'medina', 'riyadh'],
    'Turkey': ['turkey', 'turkish', 'ottoman', 'constantinople', 'istanbul', 'ankara', 'anatolia'],
    'Israel': ['israel', 'israeli', 'jerusalem', 'tel aviv', 'judea', 'palestine', 'palestinian'],
    'Egypt': ['egypt', 'egyptian', 'cairo', 'alexandria', 'pharaoh', 'nile'],
    'Syria': ['syria', 'syrian', 'damascus', 'aleppo'],
    'Lebanon': ['lebanon', 'lebanese', 'beirut'],
    'Jordan': ['jordan', 'jordanian', 'amman'],
    
    # Europe
    'United Kingdom': ['britain', 'british', 'england', 'english', 'scotland', 'scottish', 'wales', 'welsh', 'ireland', 'irish', 'london', 'edinburgh', 'uk', 'united kingdom'],
    'France': ['france', 'french', 'paris', 'versailles', 'normandy', 'gaul', 'napoleon', 'bourbon'],
    'Germany': ['germany', 'german', 'berlin', 'prussia', 'prussian', 'bavaria', 'saxon', 'holy roman'],
    'Italy': ['italy', 'italian', 'rome', 'roman', 'venice', 'venetian', 'florence', 'milan', 'naples', 'papal', 'vatican'],
    'Spain': ['spain', 'spanish', 'madrid', 'castile', 'aragon', 'habsburg', 'seville', 'barcelona'],
    'Portugal': ['portugal', 'portuguese', 'lisbon'],
    'Netherlands': ['netherlands', 'dutch', 'holland', 'amsterdam', 'rotterdam'],
    'Belgium': ['belgium', 'belgian', 'brussels', 'flanders'],
    'Austria': ['austria', 'austrian', 'vienna', 'habsburg'],
    'Switzerland': ['switzerland', 'swiss', 'geneva', 'zurich'],
    'Poland': ['poland', 'polish', 'warsaw', 'krakow'],
    'Russia': ['russia', 'russian', 'moscow', 'st petersburg', 'soviet', 'ussr', 'czar', 'tsar', 'romanov'],
    'Ukraine': ['ukraine', 'ukrainian', 'kiev', 'kyiv'],
    'Greece': ['greece', 'greek', 'athens', 'sparta', 'byzantine', 'macedon'],
    'Sweden': ['sweden', 'swedish', 'stockholm'],
    'Norway': ['norway', 'norwegian', 'oslo', 'viking'],
    'Denmark': ['denmark', 'danish', 'copenhagen'],
    'Finland': ['finland', 'finnish', 'helsinki'],
    'Hungary': ['hungary', 'hungarian', 'budapest', 'magyar'],
    'Czech Republic': ['czech', 'bohemia', 'bohemian', 'prague'],
    'Romania': ['romania', 'romanian', 'bucharest', 'wallachia'],
    'Bulgaria': ['bulgaria', 'bulgarian', 'sofia'],
    'Serbia': ['serbia', 'serbian', 'belgrade', 'yugoslavia'],
    
    # Americas
    'United States': ['united states', 'america', 'american', 'usa', 'u.s.', 'washington', 'new york', 'california', 'texas', 'congress', 'president'],
    'Canada': ['canada', 'canadian', 'toronto', 'montreal', 'ottawa', 'quebec'],
    'Mexico': ['mexico', 'mexican', 'aztec', 'maya'],
    'Brazil': ['brazil', 'brazilian', 'rio', 'sao paulo'],
    'Argentina': ['argentina', 'argentine', 'buenos aires'],
    'Peru': ['peru', 'peruvian', 'lima', 'inca'],
    'Colombia': ['colombia', 'colombian', 'bogota'],
    'Chile': ['chile', 'chilean', 'santiago'],
    'Cuba': ['cuba', 'cuban', 'havana'],
    
    # Africa
    'South Africa': ['south africa', 'south african', 'cape town', 'johannesburg', 'zulu', 'boer'],
    'Nigeria': ['nigeria', 'nigerian', 'lagos'],
    'Ethiopia': ['ethiopia', 'ethiopian', 'abyssinia', 'addis ababa'],
    'Morocco': ['morocco', 'moroccan', 'marrakesh'],
    'Algeria': ['algeria', 'algerian', 'algiers'],
    'Tunisia': ['tunisia', 'tunisian', 'tunis', 'carthage'],
    'Libya': ['libya', 'libyan', 'tripoli'],
    'Sudan': ['sudan', 'sudanese', 'khartoum'],
    'Kenya': ['kenya', 'kenyan', 'nairobi'],
    
    # Oceania
    'Australia': ['australia', 'australian', 'sydney', 'melbourne'],
    'New Zealand': ['new zealand', 'zealand', 'auckland', 'wellington', 'maori'],
}

REGIONS = {
    'South Asia': ['India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Afghanistan'],
    'East Asia': ['China', 'Japan', 'Korea'],
    'Southeast Asia': ['Vietnam', 'Thailand', 'Indonesia', 'Philippines', 'Malaysia', 'Singapore', 'Myanmar'],
    'Middle East': ['Iran', 'Iraq', 'Saudi Arabia', 'Turkey', 'Israel', 'Egypt', 'Syria', 'Lebanon', 'Jordan'],
    'Western Europe': ['United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Portugal', 'Netherlands', 'Belgium'],
    'Eastern Europe': ['Russia', 'Ukraine', 'Poland', 'Hungary', 'Czech Republic', 'Romania', 'Bulgaria', 'Serbia'],
    'Northern Europe': ['Sweden', 'Norway', 'Denmark', 'Finland'],
    'North America': ['United States', 'Canada', 'Mexico'],
    'South America': ['Brazil', 'Argentina', 'Peru', 'Colombia', 'Chile'],
    'Africa': ['South Africa', 'Nigeria', 'Ethiopia', 'Morocco', 'Algeria', 'Tunisia', 'Libya', 'Sudan', 'Kenya', 'Egypt'],
    'Oceania': ['Australia', 'New Zealand'],
}


def detect_countries(text: str) -> List[str]:
    """Detect countries mentioned in event text"""
    text_lower = text.lower()
    detected = []
    
    for country, keywords in COUNTRIES.items():
        for keyword in keywords:
            if keyword in text_lower:
                if country not in detected:
                    detected.append(country)
                break
    
    return detected


def get_region(country: str) -> Optional[str]:
    """Get region for a country"""
    for region, countries in REGIONS.items():
        if country in countries:
            return region
    return None


async def fetch_wikipedia_events(month: int, day: int) -> dict:
    """Fetch historical events from Wikipedia API"""
    # Use zero-padded month and day for Wikipedia REST API
    url = f"https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/{month:02d}/{day:02d}"
    
    headers = {
        "User-Agent": "ThisDayInHistory/1.0 (contact@example.com)"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            # Process and categorize events
            events = []
            all_countries = set()
            for event in data.get("events", []):
                # Filter for last 1500 years (from ~525 CE)
                year = event.get("year", 0)
                if year >= 525:
                    text = event.get("text", "")
                    countries = detect_countries(text)
                    all_countries.update(countries)
                    events.append({
                        "year": year,
                        "text": text,
                        "category": categorize_event(text),
                        "countries": countries,
                        "region": get_region(countries[0]) if countries else None,
                        "links": event.get("pages", [])[:3]  # Limit links
                    })
            
            births = []
            for birth in data.get("births", []):
                year = birth.get("year", 0)
                if year >= 525:
                    text = birth.get("text", "")
                    countries = detect_countries(text)
                    births.append({
                        "year": year,
                        "text": text,
                        "category": "birth",
                        "countries": countries,
                        "links": birth.get("pages", [])[:2]
                    })
            
            deaths = []
            for death in data.get("deaths", []):
                year = death.get("year", 0)
                if year >= 525:
                    text = death.get("text", "")
                    countries = detect_countries(text)
                    deaths.append({
                        "year": year,
                        "text": text,
                        "category": "death",
                        "countries": countries,
                        "links": death.get("pages", [])[:2]
                    })
            
            return {
                "date": f"{month:02d}-{day:02d}",
                "events": sorted(events, key=lambda x: x["year"], reverse=True),
                "births": sorted(births, key=lambda x: x["year"], reverse=True)[:20],
                "deaths": sorted(deaths, key=lambda x: x["year"], reverse=True)[:20],
                "available_countries": sorted(list(all_countries)),
            }
            
        except httpx.HTTPError as e:
            raise HTTPException(status_code=503, detail=f"Wikipedia API error: {str(e)}")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "This Day in History API"}


@app.get("/api/today")
async def get_today():
    """Get historical events for today's date"""
    today = date.today()
    return await fetch_wikipedia_events(today.month, today.day)


@app.get("/api/events/{month}/{day}")
async def get_events_by_date(
    month: int,
    day: int,
    category: Optional[str] = Query(None, description="Filter by category"),
    year_from: Optional[int] = Query(None, description="Filter events from this year"),
    year_to: Optional[int] = Query(None, description="Filter events up to this year"),
    country: Optional[str] = Query(None, description="Filter by country name"),
    region: Optional[str] = Query(None, description="Filter by region (e.g., South Asia, Western Europe)")
):
    """Get historical events for a specific date with optional filters"""
    
    if not (1 <= month <= 12):
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
    if not (1 <= day <= 31):
        raise HTTPException(status_code=400, detail="Day must be between 1 and 31")
    
    data = await fetch_wikipedia_events(month, day)
    
    # Apply filters
    if category:
        data["events"] = [e for e in data["events"] if e["category"] == category]
    
    if year_from:
        data["events"] = [e for e in data["events"] if e["year"] >= year_from]
        data["births"] = [e for e in data["births"] if e["year"] >= year_from]
        data["deaths"] = [e for e in data["deaths"] if e["year"] >= year_from]
    
    if year_to:
        data["events"] = [e for e in data["events"] if e["year"] <= year_to]
        data["births"] = [e for e in data["births"] if e["year"] <= year_to]
        data["deaths"] = [e for e in data["deaths"] if e["year"] <= year_to]
    
    if country:
        data["events"] = [e for e in data["events"] if country in e.get("countries", [])]
        data["births"] = [e for e in data["births"] if country in e.get("countries", [])]
        data["deaths"] = [e for e in data["deaths"] if country in e.get("countries", [])]
    
    if region:
        region_countries = REGIONS.get(region, [])
        data["events"] = [e for e in data["events"] if any(c in region_countries for c in e.get("countries", []))]
        data["births"] = [e for e in data["births"] if any(c in region_countries for c in e.get("countries", []))]
        data["deaths"] = [e for e in data["deaths"] if any(c in region_countries for c in e.get("countries", []))]
    
    return data


@app.get("/api/countries")
async def get_countries():
    """Get list of available countries and regions for filtering"""
    return {
        "countries": sorted(list(COUNTRIES.keys())),
        "regions": list(REGIONS.keys()),
    }


@app.get("/api/categories")
async def get_categories():
    """Get list of available event categories"""
    return {
        "categories": [
            {"id": "battle", "name": "Battles & Wars", "icon": "swords"},
            {"id": "political", "name": "Political Events", "icon": "crown"},
            {"id": "discovery", "name": "Discoveries & Science", "icon": "lightbulb"},
            {"id": "religious", "name": "Religious Events", "icon": "star"},
            {"id": "disaster", "name": "Natural Disasters", "icon": "cloud-lightning"},
            {"id": "cultural", "name": "Arts & Culture", "icon": "palette"},
            {"id": "general", "name": "General", "icon": "clock"}
        ]
    }


@app.get("/api/vedic/chart/{month}/{day}/{year}")
async def get_vedic_chart_for_date(month: int, day: int, year: int):
    """Get Vedic chart for a specific date"""
    try:
        dt = datetime(year, month, day, 12, 0)  # Use noon
        chart = get_vedic_chart(dt)
        return chart
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date: {str(e)}")


@app.get("/api/vedic/today")
async def get_vedic_chart_today():
    """Get Vedic chart for today"""
    now = datetime.now()
    chart = get_vedic_chart(now)
    return chart


@app.get("/api/vedic/correlations/{month}/{day}")
async def get_correlated_events(
    month: int,
    day: int,
    year: Optional[int] = Query(None, description="Year for the reference date (defaults to current year)"),
    hour: Optional[int] = Query(12, description="Hour of day (0-23)"),
    min_score: int = Query(3, description="Minimum correlation score"),
    limit: int = Query(20, description="Maximum number of correlated events")
):
    """
    Get historical events that have matching Vedic astrological signatures with the selected date.
    
    This endpoint:
    1. Calculates the selected date's planetary positions (rashis, nakshatras, aspects, conjunctions)
    2. For each historical event on this date, calculates the Vedic chart for that year
    3. Finds events where planetary patterns match (e.g., Saturn in Ashwini on selected date → events when Saturn was also in Ashwini)
    4. Returns events sorted by correlation score
    """
    
    if not (1 <= month <= 12):
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
    if not (1 <= day <= 31):
        raise HTTPException(status_code=400, detail="Day must be between 1 and 31")
    
    # Use provided year or current year
    reference_year = year if year else datetime.now().year
    reference_hour = hour if hour is not None else 12
    
    # Create the reference date (the date user selected)
    try:
        reference_date = datetime(reference_year, month, day, reference_hour, 0)
    except ValueError:
        reference_date = datetime(reference_year, month, day - 1, reference_hour, 0)  # Handle edge cases like Feb 29
    
    # Get Vedic signatures for the reference date
    reference_signatures = get_planetary_signatures(reference_date)
    reference_chart = get_vedic_chart(reference_date)
    
    # Fetch historical events
    wiki_data = await fetch_wikipedia_events(month, day)
    
    correlated_events = []
    
    for event in wiki_data["events"]:
        event_year = event["year"]
        
        # Create datetime for the historical event
        try:
            event_date = datetime(event_year, month, day, 12, 0)
        except ValueError:
            continue  # Skip invalid dates (e.g., Feb 29 in non-leap years)
        
        # Get Vedic signatures for the historical event
        event_signatures = get_planetary_signatures(event_date)
        
        # Find matching signatures
        matches = find_matching_signatures(reference_signatures, event_signatures)
        
        # Calculate correlation score
        score = calculate_correlation_score(matches)
        
        if score >= min_score:
            # Get the event chart for more details
            event_chart = get_vedic_chart(event_date)
            
            correlated_events.append({
                "event": event,
                "correlation_score": score,
                "matches": matches,
                "event_chart": {
                    "ayanamsha": event_chart["ayanamsha"],
                    "positions": event_chart["positions"],
                },
            })
    
    # Sort by correlation score (highest first)
    correlated_events.sort(key=lambda x: x["correlation_score"], reverse=True)
    
    # Create summary of the reference date's signatures for the frontend
    reference_summary = {
        "date": reference_date.strftime("%Y-%m-%d"),
        "chart": reference_chart,
        "key_signatures": []
    }
    
    # Add notable signatures to summary
    for sig in reference_signatures["planet_in_nakshatra"]:
        if sig["planet"] in ["Saturn", "Jupiter", "Mars", "Rahu", "Ketu"]:
            reference_summary["key_signatures"].append({
                "type": "nakshatra",
                "description": f"{sig['planet']} in {sig['nakshatra']} (Pada {sig['pada']})"
            })
    
    for sig in reference_signatures["dignities"]:
        reference_summary["key_signatures"].append({
            "type": "dignity",
            "description": f"{sig['planet']} {sig['dignity']} in {sig['rashi']}"
        })
    
    for sig in reference_signatures["conjunctions"]:
        reference_summary["key_signatures"].append({
            "type": "conjunction",
            "description": f"{', '.join(sig['planets'])} conjunction in {sig['rashi']}"
        })
    
    for sig in reference_signatures["aspects"][:5]:  # Limit aspects
        reference_summary["key_signatures"].append({
            "type": "aspect",
            "description": f"{sig['planet1']} {sig['type'].replace('_', ' ')} {sig['planet2']}"
        })
    
    return {
        "today": reference_summary,  # Keep key as "today" for frontend compatibility
        "correlated_events": correlated_events[:limit],
        "total_matches": len(correlated_events),
    }


@app.get("/api/vedic/search")
async def search_by_planetary_position(
    planet: str = Query(..., description="Planet name (Sun, Moon, Mars, etc.)"),
    nakshatra: Optional[str] = Query(None, description="Nakshatra name"),
    rashi: Optional[str] = Query(None, description="Rashi name"),
    month: int = Query(..., description="Month to search"),
    day: int = Query(..., description="Day to search"),
):
    """
    Search for historical events where a specific planet was in a specific nakshatra or rashi.
    """
    
    valid_planets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"]
    if planet not in valid_planets:
        raise HTTPException(status_code=400, detail=f"Invalid planet. Choose from: {valid_planets}")
    
    if nakshatra:
        valid_nakshatras = [n["name"] for n in NAKSHATRAS]
        if nakshatra not in valid_nakshatras:
            raise HTTPException(status_code=400, detail=f"Invalid nakshatra")
    
    if rashi:
        valid_rashis = [r["name"] for r in RASHIS]
        if rashi not in valid_rashis:
            raise HTTPException(status_code=400, detail=f"Invalid rashi")
    
    # Fetch historical events
    wiki_data = await fetch_wikipedia_events(month, day)
    
    matching_events = []
    
    for event in wiki_data["events"]:
        year = event["year"]
        
        try:
            event_date = datetime(year, month, day, 12, 0)
        except ValueError:
            continue
        
        positions = calculate_planetary_positions(event_date)
        planet_pos = positions.get(planet)
        
        if not planet_pos:
            continue
        
        # Check if position matches criteria
        matches = True
        if nakshatra and planet_pos["nakshatra"]["name"] != nakshatra:
            matches = False
        if rashi and planet_pos["rashi"]["name"] != rashi:
            matches = False
        
        if matches:
            # Get full chart for the event
            event_chart = get_vedic_chart(event_date)
            
            # Build key combinations summary
            key_combinations = []
            
            # Add conjunctions
            for conj in event_chart.get("conjunctions", []):
                key_combinations.append({
                    "type": "conjunction",
                    "description": f"{', '.join(conj['planets'])} in {conj['rashi']}"
                })
            
            # Add notable aspects
            for asp in event_chart.get("aspects", [])[:5]:
                key_combinations.append({
                    "type": "aspect", 
                    "description": f"{asp['planet1']} {asp['type'].replace('_', ' ')} {asp['planet2']}"
                })
            
            matching_events.append({
                "event": event,
                "event_date": event_date.strftime("%B %d, %Y"),
                "planetary_position": {
                    "planet": planet,
                    "rashi": planet_pos["rashi"]["name"],
                    "nakshatra": planet_pos["nakshatra"]["name"],
                    "pada": planet_pos["nakshatra"]["pada"],
                    "longitude": planet_pos["longitude"],
                    "dignity": planet_pos["dignity"],
                },
                "chart_summary": {
                    "ayanamsha": event_chart["ayanamsha"],
                    "positions": {p: {"rashi": d["rashi"]["name"], "nakshatra": d["nakshatra"]["name"]} 
                                 for p, d in event_chart["positions"].items()},
                    "key_combinations": key_combinations,
                }
            })
    
    return {
        "search_criteria": {
            "planet": planet,
            "nakshatra": nakshatra,
            "rashi": rashi,
        },
        "matching_events": matching_events,
        "total_matches": len(matching_events),
    }


@app.get("/api/vedic/aspect-search")
async def search_by_aspect(
    planet1: str = Query(..., description="First planet"),
    planet2: str = Query(..., description="Second planet"),
    aspect_type: str = Query(..., description="Aspect type: conjunction, 3rd_house, square, trine, 6th_house, opposition, 8th_house, 12th_house"),
    month: int = Query(..., description="Month to search"),
    day: int = Query(..., description="Day to search"),
    country: Optional[str] = Query(None, description="Filter by country"),
    region: Optional[str] = Query(None, description="Filter by region"),
):
    """
    Search for historical events where two planets form a specific aspect.
    
    Aspect types:
    - conjunction: Same sign (0 signs apart)
    - 3rd_house: 2 signs apart
    - square: 3 signs apart (4th house)
    - trine: 4 signs apart (5th house)
    - 6th_house: 5 signs apart
    - opposition: 6 signs apart (7th house)
    - 8th_house: 7 signs apart
    - 12th_house: 11 signs apart
    """
    
    valid_planets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"]
    if planet1 not in valid_planets:
        raise HTTPException(status_code=400, detail=f"Invalid planet1. Choose from: {valid_planets}")
    if planet2 not in valid_planets:
        raise HTTPException(status_code=400, detail=f"Invalid planet2. Choose from: {valid_planets}")
    
    valid_aspects = ["conjunction", "3rd_house", "square", "trine", "6th_house", "opposition", "8th_house", "12th_house"]
    if aspect_type not in valid_aspects:
        raise HTTPException(status_code=400, detail=f"Invalid aspect_type. Choose from: {valid_aspects}")
    
    # Aspect type to sign distance mapping
    aspect_distances = {
        "conjunction": [0],
        "3rd_house": [2, 10],  # 2 or 10 signs apart
        "square": [3, 9],      # 3 or 9 signs apart
        "trine": [4, 8],       # 4 or 8 signs apart
        "6th_house": [5, 7],   # 5 or 7 signs apart (wait, 7 is 8th house)
        "opposition": [6],      # exactly 6 signs apart
        "8th_house": [7, 5],   # 7 or 5 signs apart
        "12th_house": [11, 1], # 11 or 1 sign apart
    }
    
    # Corrected mappings based on house positions
    aspect_distances = {
        "conjunction": [0],
        "3rd_house": [2],     # 2 signs = 3rd house
        "square": [3],        # 3 signs = 4th house
        "trine": [4],         # 4 signs = 5th house
        "6th_house": [5],     # 5 signs = 6th house
        "opposition": [6],    # 6 signs = 7th house
        "8th_house": [7],     # 7 signs = 8th house
        "12th_house": [11],   # 11 signs = 12th house (1 behind)
    }
    
    # Fetch historical events
    wiki_data = await fetch_wikipedia_events(month, day)
    
    matching_events = []
    
    for event in wiki_data["events"]:
        year = event["year"]
        
        # Apply country/region filter
        if country and country not in event.get("countries", []):
            continue
        if region:
            region_countries = REGIONS.get(region, [])
            if not any(c in region_countries for c in event.get("countries", [])):
                continue
        
        try:
            event_date = datetime(year, month, day, 12, 0)
        except ValueError:
            continue
        
        positions = calculate_planetary_positions(event_date)
        pos1 = positions.get(planet1)
        pos2 = positions.get(planet2)
        
        if not pos1 or not pos2:
            continue
        
        # Calculate sign distance
        rashi1 = pos1["rashi"]["id"]
        rashi2 = pos2["rashi"]["id"]
        distance = (rashi2 - rashi1 + 12) % 12
        reverse_distance = (rashi1 - rashi2 + 12) % 12
        
        # Check if aspect matches
        target_distances = aspect_distances.get(aspect_type, [])
        if distance in target_distances or reverse_distance in target_distances:
            # Get full chart for the event
            event_chart = get_vedic_chart(event_date)
            
            # Build key combinations summary
            key_combinations = []
            
            # Add conjunctions
            for conj in event_chart.get("conjunctions", []):
                key_combinations.append({
                    "type": "conjunction",
                    "description": f"{', '.join(conj['planets'])} in {conj['rashi']}"
                })
            
            # Add notable aspects
            for asp in event_chart.get("aspects", [])[:5]:
                key_combinations.append({
                    "type": "aspect", 
                    "description": f"{asp['planet1']} {asp['type'].replace('_', ' ')} {asp['planet2']}"
                })
            
            matching_events.append({
                "event": event,
                "event_date": event_date.strftime("%B %d, %Y"),
                "aspect": {
                    "planet1": planet1,
                    "planet1_rashi": pos1["rashi"]["name"],
                    "planet1_nakshatra": pos1["nakshatra"]["name"],
                    "planet2": planet2,
                    "planet2_rashi": pos2["rashi"]["name"],
                    "planet2_nakshatra": pos2["nakshatra"]["name"],
                    "aspect_type": aspect_type,
                    "sign_distance": min(distance, reverse_distance),
                },
                "chart_summary": {
                    "ayanamsha": event_chart["ayanamsha"],
                    "positions": {p: {"rashi": d["rashi"]["name"], "nakshatra": d["nakshatra"]["name"]} 
                                 for p, d in event_chart["positions"].items()},
                    "key_combinations": key_combinations,
                }
            })
    
    return {
        "search_criteria": {
            "planet1": planet1,
            "planet2": planet2,
            "aspect_type": aspect_type,
            "country": country,
            "region": region,
        },
        "matching_events": matching_events,
        "total_matches": len(matching_events),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
