"""
This Day in History - Vedic Edition
FastAPI Backend Server
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, date
from typing import Optional, List
import httpx
from pydantic import BaseModel

from vedic_calc import (
    get_vedic_chart,
    get_planetary_signatures,
    find_matching_signatures,
    calculate_correlation_score,
    calculate_planetary_positions,
    RASHIS,
    NAKSHATRAS,
)

app = FastAPI(
    title="This Day in History API",
    description="API for historical events with Vedic astronomical data",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
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
            for event in data.get("events", []):
                # Filter for last 1500 years (from ~525 CE)
                year = event.get("year", 0)
                if year >= 525:
                    events.append({
                        "year": year,
                        "text": event.get("text", ""),
                        "category": categorize_event(event.get("text", "")),
                        "links": event.get("pages", [])[:3]  # Limit links
                    })
            
            births = []
            for birth in data.get("births", []):
                year = birth.get("year", 0)
                if year >= 525:
                    births.append({
                        "year": year,
                        "text": birth.get("text", ""),
                        "category": "birth",
                        "links": birth.get("pages", [])[:2]
                    })
            
            deaths = []
            for death in data.get("deaths", []):
                year = death.get("year", 0)
                if year >= 525:
                    deaths.append({
                        "year": year,
                        "text": death.get("text", ""),
                        "category": "death",
                        "links": death.get("pages", [])[:2]
                    })
            
            return {
                "date": f"{month:02d}-{day:02d}",
                "events": sorted(events, key=lambda x: x["year"], reverse=True),
                "births": sorted(births, key=lambda x: x["year"], reverse=True)[:20],
                "deaths": sorted(deaths, key=lambda x: x["year"], reverse=True)[:20]
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
    year_to: Optional[int] = Query(None, description="Filter events up to this year")
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
    
    return data


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
    min_score: int = Query(3, description="Minimum correlation score"),
    limit: int = Query(20, description="Maximum number of correlated events")
):
    """
    Get historical events that have matching Vedic astrological signatures with today.
    
    This endpoint:
    1. Calculates today's planetary positions (rashis, nakshatras, aspects, conjunctions)
    2. For each historical event on this date, calculates the Vedic chart for that year
    3. Finds events where planetary patterns match (e.g., Saturn in Ashwini today → events when Saturn was also in Ashwini)
    4. Returns events sorted by correlation score
    """
    
    if not (1 <= month <= 12):
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
    if not (1 <= day <= 31):
        raise HTTPException(status_code=400, detail="Day must be between 1 and 31")
    
    # Get today's Vedic signatures
    today = datetime.now()
    today_signatures = get_planetary_signatures(today)
    today_chart = get_vedic_chart(today)
    
    # Fetch historical events
    wiki_data = await fetch_wikipedia_events(month, day)
    
    correlated_events = []
    
    for event in wiki_data["events"]:
        year = event["year"]
        
        # Create datetime for the historical event
        try:
            event_date = datetime(year, month, day, 12, 0)
        except ValueError:
            continue  # Skip invalid dates (e.g., Feb 29 in non-leap years)
        
        # Get Vedic signatures for the historical event
        event_signatures = get_planetary_signatures(event_date)
        
        # Find matching signatures
        matches = find_matching_signatures(today_signatures, event_signatures)
        
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
    
    # Create summary of today's signatures for the frontend
    today_summary = {
        "date": today.strftime("%Y-%m-%d"),
        "chart": today_chart,
        "key_signatures": []
    }
    
    # Add notable signatures to summary
    for sig in today_signatures["planet_in_nakshatra"]:
        if sig["planet"] in ["Saturn", "Jupiter", "Mars", "Rahu", "Ketu"]:
            today_summary["key_signatures"].append({
                "type": "nakshatra",
                "description": f"{sig['planet']} in {sig['nakshatra']} (Pada {sig['pada']})"
            })
    
    for sig in today_signatures["dignities"]:
        today_summary["key_signatures"].append({
            "type": "dignity",
            "description": f"{sig['planet']} {sig['dignity']} in {sig['rashi']}"
        })
    
    for sig in today_signatures["conjunctions"]:
        today_summary["key_signatures"].append({
            "type": "conjunction",
            "description": f"{', '.join(sig['planets'])} conjunction in {sig['rashi']}"
        })
    
    for sig in today_signatures["aspects"][:5]:  # Limit aspects
        today_summary["key_signatures"].append({
            "type": "aspect",
            "description": f"{sig['planet1']} {sig['type'].replace('_', ' ')} {sig['planet2']}"
        })
    
    return {
        "today": today_summary,
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
            matching_events.append({
                "event": event,
                "planetary_position": {
                    "planet": planet,
                    "rashi": planet_pos["rashi"]["name"],
                    "nakshatra": planet_pos["nakshatra"]["name"],
                    "pada": planet_pos["nakshatra"]["pada"],
                    "longitude": planet_pos["longitude"],
                    "dignity": planet_pos["dignity"],
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
