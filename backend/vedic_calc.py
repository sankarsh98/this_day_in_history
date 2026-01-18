"""
Vedic Astrology Calculation Engine
Calculates planetary positions using sidereal (Vedic) zodiac with Lahiri Ayanamsha
"""

import math
from datetime import datetime, date
from typing import Dict, List, Tuple, Optional

# Ayanamsha constants (Lahiri)
AYANAMSHA_J2000 = 23.85  # degrees at J2000 epoch
AYANAMSHA_RATE = 50.29 / 3600  # arcseconds per year in degrees

# Planets with mean orbital elements at J2000 epoch
PLANETS = {
    'Sun': {'period': 365.25636, 'longitude0': 280.46646, 'daily_motion': 0.9856474},
    'Moon': {'period': 27.321582, 'longitude0': 218.3165, 'daily_motion': 13.176358},
    'Mercury': {'period': 87.969, 'longitude0': 252.2511, 'daily_motion': 4.0923344},
    'Venus': {'period': 224.701, 'longitude0': 181.9798, 'daily_motion': 1.6021302},
    'Mars': {'period': 686.98, 'longitude0': 355.4330, 'daily_motion': 0.5240208},
    'Jupiter': {'period': 4332.59, 'longitude0': 34.3515, 'daily_motion': 0.0830853},
    'Saturn': {'period': 10759.22, 'longitude0': 49.9429, 'daily_motion': 0.0334442},
    'Rahu': {'period': 6793.5, 'longitude0': 125.0, 'daily_motion': -0.0529539},
    'Ketu': {'period': 6793.5, 'longitude0': 305.0, 'daily_motion': -0.0529539},
}

# Rashis (Zodiac Signs)
RASHIS = [
    {'id': 0, 'name': 'Mesha', 'english': 'Aries', 'ruler': 'Mars'},
    {'id': 1, 'name': 'Vrishabha', 'english': 'Taurus', 'ruler': 'Venus'},
    {'id': 2, 'name': 'Mithuna', 'english': 'Gemini', 'ruler': 'Mercury'},
    {'id': 3, 'name': 'Karka', 'english': 'Cancer', 'ruler': 'Moon'},
    {'id': 4, 'name': 'Simha', 'english': 'Leo', 'ruler': 'Sun'},
    {'id': 5, 'name': 'Kanya', 'english': 'Virgo', 'ruler': 'Mercury'},
    {'id': 6, 'name': 'Tula', 'english': 'Libra', 'ruler': 'Venus'},
    {'id': 7, 'name': 'Vrishchika', 'english': 'Scorpio', 'ruler': 'Mars'},
    {'id': 8, 'name': 'Dhanu', 'english': 'Sagittarius', 'ruler': 'Jupiter'},
    {'id': 9, 'name': 'Makara', 'english': 'Capricorn', 'ruler': 'Saturn'},
    {'id': 10, 'name': 'Kumbha', 'english': 'Aquarius', 'ruler': 'Saturn'},
    {'id': 11, 'name': 'Meena', 'english': 'Pisces', 'ruler': 'Jupiter'},
]

# Nakshatras (27 Lunar Mansions)
NAKSHATRAS = [
    {'id': 0, 'name': 'Ashwini', 'ruler': 'Ketu'},
    {'id': 1, 'name': 'Bharani', 'ruler': 'Venus'},
    {'id': 2, 'name': 'Krittika', 'ruler': 'Sun'},
    {'id': 3, 'name': 'Rohini', 'ruler': 'Moon'},
    {'id': 4, 'name': 'Mrigashira', 'ruler': 'Mars'},
    {'id': 5, 'name': 'Ardra', 'ruler': 'Rahu'},
    {'id': 6, 'name': 'Punarvasu', 'ruler': 'Jupiter'},
    {'id': 7, 'name': 'Pushya', 'ruler': 'Saturn'},
    {'id': 8, 'name': 'Ashlesha', 'ruler': 'Mercury'},
    {'id': 9, 'name': 'Magha', 'ruler': 'Ketu'},
    {'id': 10, 'name': 'Purva Phalguni', 'ruler': 'Venus'},
    {'id': 11, 'name': 'Uttara Phalguni', 'ruler': 'Sun'},
    {'id': 12, 'name': 'Hasta', 'ruler': 'Moon'},
    {'id': 13, 'name': 'Chitra', 'ruler': 'Mars'},
    {'id': 14, 'name': 'Swati', 'ruler': 'Rahu'},
    {'id': 15, 'name': 'Vishakha', 'ruler': 'Jupiter'},
    {'id': 16, 'name': 'Anuradha', 'ruler': 'Saturn'},
    {'id': 17, 'name': 'Jyeshtha', 'ruler': 'Mercury'},
    {'id': 18, 'name': 'Mula', 'ruler': 'Ketu'},
    {'id': 19, 'name': 'Purva Ashadha', 'ruler': 'Venus'},
    {'id': 20, 'name': 'Uttara Ashadha', 'ruler': 'Sun'},
    {'id': 21, 'name': 'Shravana', 'ruler': 'Moon'},
    {'id': 22, 'name': 'Dhanishta', 'ruler': 'Mars'},
    {'id': 23, 'name': 'Shatabhisha', 'ruler': 'Rahu'},
    {'id': 24, 'name': 'Purva Bhadrapada', 'ruler': 'Jupiter'},
    {'id': 25, 'name': 'Uttara Bhadrapada', 'ruler': 'Saturn'},
    {'id': 26, 'name': 'Revati', 'ruler': 'Mercury'},
]

# Dignity (exaltation/debilitation)
DIGNITY = {
    'Sun': {'exalted': 0, 'debilitated': 6},
    'Moon': {'exalted': 1, 'debilitated': 7},
    'Mercury': {'exalted': 5, 'debilitated': 11},
    'Venus': {'exalted': 11, 'debilitated': 5},
    'Mars': {'exalted': 9, 'debilitated': 3},
    'Jupiter': {'exalted': 3, 'debilitated': 9},
    'Saturn': {'exalted': 6, 'debilitated': 0},
}


def date_to_jd(dt: datetime) -> float:
    """Convert datetime to Julian Day Number"""
    year = dt.year
    month = dt.month
    day = dt.day + (dt.hour + dt.minute / 60) / 24

    if month <= 2:
        year -= 1
        month += 12

    a = math.floor(year / 100)
    b = 2 - a + math.floor(a / 4)

    return math.floor(365.25 * (year + 4716)) + math.floor(30.6001 * (month + 1)) + day + b - 1524.5


def calculate_ayanamsha(dt: datetime) -> float:
    """Calculate Lahiri Ayanamsha for a given date"""
    jd = date_to_jd(dt)
    years_from_j2000 = (jd - 2451545.0) / 365.25
    return AYANAMSHA_J2000 + AYANAMSHA_RATE * years_from_j2000


def normalize_angle(angle: float) -> float:
    """Normalize angle to 0-360 degrees"""
    angle = angle % 360
    return angle if angle >= 0 else angle + 360


def calculate_tropical_longitude(planet: str, dt: datetime) -> float:
    """Calculate tropical longitude for a planet"""
    jd = date_to_jd(dt)
    days_from_j2000 = jd - 2451545.0
    data = PLANETS[planet]
    
    longitude = data['longitude0'] + data['daily_motion'] * days_from_j2000
    
    # Simple perturbation for inner planets
    if planet in ('Mercury', 'Venus'):
        anomaly = (days_from_j2000 * 360 / data['period']) % 360
        longitude += 5 * math.sin(math.radians(anomaly))
    
    return normalize_angle(longitude)


def calculate_sidereal_longitude(planet: str, dt: datetime) -> float:
    """Calculate sidereal (Vedic) longitude"""
    tropical = calculate_tropical_longitude(planet, dt)
    ayanamsha = calculate_ayanamsha(dt)
    return normalize_angle(tropical - ayanamsha)


def get_rashi(longitude: float) -> dict:
    """Get Rashi from longitude"""
    rashi_index = int(longitude / 30)
    return RASHIS[rashi_index].copy()


def get_nakshatra(longitude: float) -> dict:
    """Get Nakshatra from longitude"""
    nakshatra_span = 360 / 27
    nakshatra_index = int(longitude / nakshatra_span)
    pada = int((longitude % nakshatra_span) / (nakshatra_span / 4)) + 1
    result = NAKSHATRAS[nakshatra_index].copy()
    result['pada'] = pada
    return result


def get_dignity(planet: str, rashi_id: int) -> Optional[str]:
    """Get dignity status of planet"""
    if planet not in DIGNITY:
        return None
    dignity = DIGNITY[planet]
    if rashi_id == dignity['exalted']:
        return 'exalted'
    if rashi_id == dignity['debilitated']:
        return 'debilitated'
    return None


def calculate_planetary_positions(dt: datetime) -> Dict[str, dict]:
    """Calculate all planetary positions for a date"""
    positions = {}
    
    for planet in PLANETS:
        longitude = calculate_sidereal_longitude(planet, dt)
        rashi = get_rashi(longitude)
        nakshatra = get_nakshatra(longitude)
        
        positions[planet] = {
            'planet': planet,
            'longitude': round(longitude, 2),
            'rashi': rashi,
            'nakshatra': nakshatra,
            'dignity': get_dignity(planet, rashi['id']),
        }
    
    return positions


def find_conjunctions(positions: Dict[str, dict]) -> List[dict]:
    """Find planets in the same rashi"""
    rashi_planets = {}
    
    for planet, data in positions.items():
        rashi_name = data['rashi']['name']
        if rashi_name not in rashi_planets:
            rashi_planets[rashi_name] = []
        rashi_planets[rashi_name].append(planet)
    
    conjunctions = []
    for rashi, planets in rashi_planets.items():
        if len(planets) >= 2:
            conjunctions.append({
                'rashi': rashi,
                'planets': planets,
                'key': f"{'-'.join(sorted(planets))}_in_{rashi}",
            })
    
    return conjunctions


def calculate_aspects(positions: Dict[str, dict]) -> List[dict]:
    """Calculate Vedic aspects (drishti)"""
    aspects = []
    planet_list = list(positions.items())
    
    for i, (planet1, data1) in enumerate(planet_list):
        rashi1 = data1['rashi']['id']
        
        for j, (planet2, data2) in enumerate(planet_list):
            if i >= j:
                continue
            
            rashi2 = data2['rashi']['id']
            distance = (rashi2 - rashi1 + 12) % 12
            reverse_distance = (rashi1 - rashi2 + 12) % 12
            
            # Conjunction (same sign)
            if distance == 0:
                aspects.append({
                    'planet1': planet1,
                    'planet2': planet2,
                    'type': 'conjunction',
                    'house': 1,
                    'key': f"{planet1}_conjunction_{planet2}",
                })
            
            # 3rd house aspect (2 signs apart)
            if distance == 2 or reverse_distance == 2:
                aspects.append({
                    'planet1': planet1,
                    'planet2': planet2,
                    'type': '3rd_house',
                    'house': 3,
                    'key': f"{planet1}_3rd_{planet2}",
                })
            
            # 4th house aspect / Square (3 signs apart)
            if distance == 3 or reverse_distance == 3:
                aspects.append({
                    'planet1': planet1,
                    'planet2': planet2,
                    'type': 'square',
                    'house': 4,
                    'key': f"{planet1}_square_{planet2}",
                })
            
            # 5th house aspect / Trine (4 signs apart)
            if distance == 4 or reverse_distance == 4:
                aspects.append({
                    'planet1': planet1,
                    'planet2': planet2,
                    'type': 'trine',
                    'house': 5,
                    'key': f"{planet1}_trine_{planet2}",
                })
            
            # 6th house aspect (5 signs apart)
            if distance == 5 or reverse_distance == 5:
                aspects.append({
                    'planet1': planet1,
                    'planet2': planet2,
                    'type': '6th_house',
                    'house': 6,
                    'key': f"{planet1}_6th_{planet2}",
                })
            
            # 7th house aspect (opposition - 6 signs apart)
            if distance == 6:
                aspects.append({
                    'planet1': planet1,
                    'planet2': planet2,
                    'type': 'opposition',
                    'house': 7,
                    'key': f"{planet1}_opposition_{planet2}",
                })
            
            # 8th house aspect (7 signs apart)
            if distance == 7 or reverse_distance == 7:
                aspects.append({
                    'planet1': planet1,
                    'planet2': planet2,
                    'type': '8th_house',
                    'house': 8,
                    'key': f"{planet1}_8th_{planet2}",
                })
            
            # 12th house aspect (11 signs apart, or 1 sign behind)
            if distance == 11 or reverse_distance == 11:
                aspects.append({
                    'planet1': planet1,
                    'planet2': planet2,
                    'type': '12th_house',
                    'house': 12,
                    'key': f"{planet1}_12th_{planet2}",
                })
            
            # Mars special aspects (4th and 8th) - already covered above but keep for special marker
            if planet1 == 'Mars' and distance in (3, 7):
                # Add mars_special marker to existing aspects
                pass
            
            # Jupiter special aspects (5th and 9th)
            if planet1 == 'Jupiter' and distance in (4, 8):
                aspects.append({
                    'planet1': planet1,
                    'planet2': planet2,
                    'type': 'jupiter_special',
                    'house': 5 if distance == 4 else 9,
                    'key': f"Jupiter_aspect_{planet2}",
                })
            
            # Saturn special aspects (3rd and 10th)
            if planet1 == 'Saturn' and distance in (2, 9):
                aspects.append({
                    'planet1': planet1,
                    'planet2': planet2,
                    'type': 'saturn_special',
                    'house': 3 if distance == 2 else 10,
                    'key': f"Saturn_aspect_{planet2}",
                })
    
    return aspects


def get_vedic_chart(dt: datetime) -> dict:
    """Get complete Vedic chart for a date"""
    positions = calculate_planetary_positions(dt)
    conjunctions = find_conjunctions(positions)
    aspects = calculate_aspects(positions)
    
    return {
        'date': dt.isoformat(),
        'ayanamsha': round(calculate_ayanamsha(dt), 2),
        'positions': positions,
        'conjunctions': conjunctions,
        'aspects': aspects,
    }


def get_planetary_signatures(dt: datetime) -> dict:
    """
    Get all planetary signatures for correlation matching.
    Returns a dict of signature keys that can be matched against other dates.
    """
    positions = calculate_planetary_positions(dt)
    conjunctions = find_conjunctions(positions)
    aspects = calculate_aspects(positions)
    
    signatures = {
        'planet_in_nakshatra': [],  # e.g., "Saturn_in_Ashwini"
        'planet_in_rashi': [],       # e.g., "Jupiter_in_Mesha"
        'conjunctions': [],          # e.g., "Mars-Saturn_in_Makara"
        'aspects': [],               # e.g., "Saturn_opposition_Sun"
        'dignities': [],             # e.g., "Jupiter_exalted"
    }
    
    for planet, data in positions.items():
        # Planet in Nakshatra
        nak_key = f"{planet}_in_{data['nakshatra']['name']}"
        signatures['planet_in_nakshatra'].append({
            'key': nak_key,
            'planet': planet,
            'nakshatra': data['nakshatra']['name'],
            'pada': data['nakshatra']['pada'],
        })
        
        # Planet in Rashi
        rashi_key = f"{planet}_in_{data['rashi']['name']}"
        signatures['planet_in_rashi'].append({
            'key': rashi_key,
            'planet': planet,
            'rashi': data['rashi']['name'],
        })
        
        # Dignities
        if data['dignity']:
            dig_key = f"{planet}_{data['dignity']}"
            signatures['dignities'].append({
                'key': dig_key,
                'planet': planet,
                'dignity': data['dignity'],
                'rashi': data['rashi']['name'],
            })
    
    # Conjunctions
    for conj in conjunctions:
        signatures['conjunctions'].append({
            'key': conj['key'],
            'planets': conj['planets'],
            'rashi': conj['rashi'],
        })
    
    # Aspects
    for asp in aspects:
        signatures['aspects'].append({
            'key': asp['key'],
            'planet1': asp['planet1'],
            'planet2': asp['planet2'],
            'type': asp['type'],
        })
    
    return signatures


def find_matching_signatures(today_sigs: dict, event_sigs: dict) -> dict:
    """
    Compare two sets of signatures and find matches.
    Returns matching signatures grouped by type.
    """
    matches = {
        'planet_in_nakshatra': [],
        'planet_in_rashi': [],
        'conjunctions': [],
        'aspects': [],
        'dignities': [],
    }
    
    # Helper to find matches
    def find_matches(today_list, event_list, match_type):
        today_keys = {item['key'] for item in today_list}
        for item in event_list:
            if item['key'] in today_keys:
                matches[match_type].append(item)
    
    find_matches(today_sigs['planet_in_nakshatra'], event_sigs['planet_in_nakshatra'], 'planet_in_nakshatra')
    find_matches(today_sigs['planet_in_rashi'], event_sigs['planet_in_rashi'], 'planet_in_rashi')
    find_matches(today_sigs['conjunctions'], event_sigs['conjunctions'], 'conjunctions')
    find_matches(today_sigs['aspects'], event_sigs['aspects'], 'aspects')
    find_matches(today_sigs['dignities'], event_sigs['dignities'], 'dignities')
    
    return matches


def calculate_correlation_score(matches: dict) -> int:
    """
    Calculate a correlation score based on matching signatures.
    Higher score = more astrological similarity.
    """
    score = 0
    
    # Weight different match types
    weights = {
        'planet_in_nakshatra': 3,  # Most specific
        'conjunctions': 3,
        'aspects': 2,
        'dignities': 2,
        'planet_in_rashi': 1,      # Least specific
    }
    
    for match_type, items in matches.items():
        score += len(items) * weights.get(match_type, 1)
    
    return score
