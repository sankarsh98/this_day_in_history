/**
 * Vedic Astrology Calculation Engine
 * Calculates planetary positions using sidereal (Vedic) zodiac
 */

// Ayanamsha value (Lahiri) - approximate value that changes over time
const AYANAMSHA_J2000 = 23.85; // degrees at J2000 epoch
const AYANAMSHA_RATE = 50.29 / 3600; // arcseconds per year, converted to degrees

// Planet data with mean orbital elements at J2000 epoch
const PLANETS = {
  Sun: { period: 365.25636, longitude0: 280.46646, dailyMotion: 0.9856474 },
  Moon: { period: 27.321582, longitude0: 218.3165, dailyMotion: 13.176358 },
  Mercury: { period: 87.969, longitude0: 252.2511, dailyMotion: 4.0923344 },
  Venus: { period: 224.701, longitude0: 181.9798, dailyMotion: 1.6021302 },
  Mars: { period: 686.98, longitude0: 355.4330, dailyMotion: 0.5240208 },
  Jupiter: { period: 4332.59, longitude0: 34.3515, dailyMotion: 0.0830853 },
  Saturn: { period: 10759.22, longitude0: 49.9429, dailyMotion: 0.0334442 },
  Rahu: { period: 6793.5, longitude0: 125.0, dailyMotion: -0.0529539 }, // Mean Node, retrograde
  Ketu: { period: 6793.5, longitude0: 305.0, dailyMotion: -0.0529539 }, // Opposite to Rahu
};

// Vedic Zodiac Signs (Rashis)
export const RASHIS = [
  { id: 0, name: 'Mesha', english: 'Aries', symbol: '♈', element: 'Fire', ruler: 'Mars' },
  { id: 1, name: 'Vrishabha', english: 'Taurus', symbol: '♉', element: 'Earth', ruler: 'Venus' },
  { id: 2, name: 'Mithuna', english: 'Gemini', symbol: '♊', element: 'Air', ruler: 'Mercury' },
  { id: 3, name: 'Karka', english: 'Cancer', symbol: '♋', element: 'Water', ruler: 'Moon' },
  { id: 4, name: 'Simha', english: 'Leo', symbol: '♌', element: 'Fire', ruler: 'Sun' },
  { id: 5, name: 'Kanya', english: 'Virgo', symbol: '♍', element: 'Earth', ruler: 'Mercury' },
  { id: 6, name: 'Tula', english: 'Libra', symbol: '♎', element: 'Air', ruler: 'Venus' },
  { id: 7, name: 'Vrishchika', english: 'Scorpio', symbol: '♏', element: 'Water', ruler: 'Mars' },
  { id: 8, name: 'Dhanu', english: 'Sagittarius', symbol: '♐', element: 'Fire', ruler: 'Jupiter' },
  { id: 9, name: 'Makara', english: 'Capricorn', symbol: '♑', element: 'Earth', ruler: 'Saturn' },
  { id: 10, name: 'Kumbha', english: 'Aquarius', symbol: '♒', element: 'Air', ruler: 'Saturn' },
  { id: 11, name: 'Meena', english: 'Pisces', symbol: '♓', element: 'Water', ruler: 'Jupiter' },
];

// Nakshatras (Lunar Mansions) - 27 divisions of the zodiac
export const NAKSHATRAS = [
  { id: 0, name: 'Ashwini', deity: 'Ashwini Kumaras', ruler: 'Ketu', degree: 0 },
  { id: 1, name: 'Bharani', deity: 'Yama', ruler: 'Venus', degree: 13.333 },
  { id: 2, name: 'Krittika', deity: 'Agni', ruler: 'Sun', degree: 26.667 },
  { id: 3, name: 'Rohini', deity: 'Brahma', ruler: 'Moon', degree: 40 },
  { id: 4, name: 'Mrigashira', deity: 'Soma', ruler: 'Mars', degree: 53.333 },
  { id: 5, name: 'Ardra', deity: 'Rudra', ruler: 'Rahu', degree: 66.667 },
  { id: 6, name: 'Punarvasu', deity: 'Aditi', ruler: 'Jupiter', degree: 80 },
  { id: 7, name: 'Pushya', deity: 'Brihaspati', ruler: 'Saturn', degree: 93.333 },
  { id: 8, name: 'Ashlesha', deity: 'Nagas', ruler: 'Mercury', degree: 106.667 },
  { id: 9, name: 'Magha', deity: 'Pitris', ruler: 'Ketu', degree: 120 },
  { id: 10, name: 'Purva Phalguni', deity: 'Bhaga', ruler: 'Venus', degree: 133.333 },
  { id: 11, name: 'Uttara Phalguni', deity: 'Aryaman', ruler: 'Sun', degree: 146.667 },
  { id: 12, name: 'Hasta', deity: 'Savitar', ruler: 'Moon', degree: 160 },
  { id: 13, name: 'Chitra', deity: 'Vishwakarma', ruler: 'Mars', degree: 173.333 },
  { id: 14, name: 'Swati', deity: 'Vayu', ruler: 'Rahu', degree: 186.667 },
  { id: 15, name: 'Vishakha', deity: 'Indragni', ruler: 'Jupiter', degree: 200 },
  { id: 16, name: 'Anuradha', deity: 'Mitra', ruler: 'Saturn', degree: 213.333 },
  { id: 17, name: 'Jyeshtha', deity: 'Indra', ruler: 'Mercury', degree: 226.667 },
  { id: 18, name: 'Mula', deity: 'Nirriti', ruler: 'Ketu', degree: 240 },
  { id: 19, name: 'Purva Ashadha', deity: 'Apas', ruler: 'Venus', degree: 253.333 },
  { id: 20, name: 'Uttara Ashadha', deity: 'Vishvadevas', ruler: 'Sun', degree: 266.667 },
  { id: 21, name: 'Shravana', deity: 'Vishnu', ruler: 'Moon', degree: 280 },
  { id: 22, name: 'Dhanishta', deity: 'Vasus', ruler: 'Mars', degree: 293.333 },
  { id: 23, name: 'Shatabhisha', deity: 'Varuna', ruler: 'Rahu', degree: 306.667 },
  { id: 24, name: 'Purva Bhadrapada', deity: 'Aja Ekapada', ruler: 'Jupiter', degree: 320 },
  { id: 25, name: 'Uttara Bhadrapada', deity: 'Ahir Budhnya', ruler: 'Saturn', degree: 333.333 },
  { id: 26, name: 'Revati', deity: 'Pushan', ruler: 'Mercury', degree: 346.667 },
];

// Planet exaltation and debilitation signs
export const DIGNITY = {
  Sun: { exalted: 0, debilitated: 6 }, // Aries/Libra
  Moon: { exalted: 1, debilitated: 7 }, // Taurus/Scorpio
  Mercury: { exalted: 5, debilitated: 11 }, // Virgo/Pisces
  Venus: { exalted: 11, debilitated: 5 }, // Pisces/Virgo
  Mars: { exalted: 9, debilitated: 3 }, // Capricorn/Cancer
  Jupiter: { exalted: 3, debilitated: 9 }, // Cancer/Capricorn
  Saturn: { exalted: 6, debilitated: 0 }, // Libra/Aries
};

/**
 * Calculate Julian Day Number from a date
 */
function dateToJD(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate() + (date.getHours() + date.getMinutes() / 60) / 24;

  let y = year;
  let m = month;
  if (month <= 2) {
    y = year - 1;
    m = month + 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);

  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

/**
 * Calculate Ayanamsha for a given date (Lahiri)
 */
function calculateAyanamsha(date) {
  const jd = dateToJD(date);
  const t = (jd - 2451545.0) / 365.25; // Years from J2000
  return AYANAMSHA_J2000 + AYANAMSHA_RATE * t;
}

/**
 * Normalize angle to 0-360 degrees
 */
function normalizeAngle(angle) {
  angle = angle % 360;
  return angle < 0 ? angle + 360 : angle;
}

/**
 * Calculate planetary position (tropical longitude) for a date
 */
function calculateTropicalLongitude(planet, date) {
  const jd = dateToJD(date);
  const daysFromJ2000 = jd - 2451545.0;
  const data = PLANETS[planet];
  
  // Mean longitude calculation
  let longitude = data.longitude0 + data.dailyMotion * daysFromJ2000;
  
  // Add perturbations for inner planets
  if (planet === 'Mercury' || planet === 'Venus') {
    // Simplified perturbation
    const sunLong = calculateTropicalLongitude('Sun', date);
    const anomaly = (daysFromJ2000 * 360 / data.period) % 360;
    longitude += 5 * Math.sin(anomaly * Math.PI / 180);
  }
  
  return normalizeAngle(longitude);
}

/**
 * Calculate sidereal longitude (Vedic)
 */
function calculateSiderealLongitude(planet, date) {
  const tropical = calculateTropicalLongitude(planet, date);
  const ayanamsha = calculateAyanamsha(date);
  return normalizeAngle(tropical - ayanamsha);
}

/**
 * Get Rashi (zodiac sign) from longitude
 */
function getRashiFromLongitude(longitude) {
  const rashiIndex = Math.floor(longitude / 30);
  return RASHIS[rashiIndex];
}

/**
 * Get Nakshatra from longitude
 */
function getNakshatraFromLongitude(longitude) {
  const nakshatraIndex = Math.floor(longitude / (360 / 27));
  const pada = Math.floor((longitude % (360 / 27)) / (360 / 108)) + 1;
  return { ...NAKSHATRAS[nakshatraIndex], pada };
}

/**
 * Get dignity status of a planet
 */
function getDignity(planet, rashiIndex) {
  const dignity = DIGNITY[planet];
  if (!dignity) return null;
  
  if (rashiIndex === dignity.exalted) return 'exalted';
  if (rashiIndex === dignity.debilitated) return 'debilitated';
  return null;
}

/**
 * Calculate planetary positions for a given date
 */
export function calculatePlanetaryPositions(date) {
  const positions = {};
  
  for (const planet of Object.keys(PLANETS)) {
    const longitude = calculateSiderealLongitude(planet, date);
    const rashi = getRashiFromLongitude(longitude);
    const nakshatra = getNakshatraFromLongitude(longitude);
    
    positions[planet] = {
      planet,
      longitude: longitude.toFixed(2),
      rashi,
      nakshatra,
      dignity: getDignity(planet, rashi.id),
    };
  }
  
  return positions;
}

/**
 * Find conjunctions (planets in the same rashi)
 */
export function findConjunctions(positions) {
  const rashiPlanets = {};
  
  for (const [planet, data] of Object.entries(positions)) {
    const rashiName = data.rashi.name;
    if (!rashiPlanets[rashiName]) {
      rashiPlanets[rashiName] = [];
    }
    rashiPlanets[rashiName].push(planet);
  }
  
  const conjunctions = [];
  for (const [rashi, planets] of Object.entries(rashiPlanets)) {
    if (planets.length >= 2) {
      conjunctions.push({
        rashi,
        planets,
        description: `${planets.join(', ')} in ${rashi}`,
      });
    }
  }
  
  return conjunctions;
}

/**
 * Calculate aspects (drishti) between planets
 */
export function calculateAspects(positions) {
  const aspects = [];
  const planetList = Object.entries(positions);
  
  // Vedic aspects are based on house relationships
  // Full aspects: 7th house (opposition)
  // Special aspects: Mars (4,8), Jupiter (5,9), Saturn (3,10)
  
  for (let i = 0; i < planetList.length; i++) {
    const [planet1, data1] = planetList[i];
    const rashi1 = data1.rashi.id;
    
    for (let j = i + 1; j < planetList.length; j++) {
      const [planet2, data2] = planetList[j];
      const rashi2 = data2.rashi.id;
      
      const distance = (rashi2 - rashi1 + 12) % 12;
      
      // 7th house aspect (opposition) - all planets
      if (distance === 6) {
        aspects.push({
          planet1,
          planet2,
          type: 'opposition',
          description: `${planet1} aspects ${planet2} (7th house)`,
        });
      }
      
      // Mars special aspects (4th and 8th)
      if (planet1 === 'Mars' && (distance === 3 || distance === 7)) {
        aspects.push({
          planet1,
          planet2,
          type: 'special',
          description: `Mars aspects ${planet2} (${distance + 1}th house)`,
        });
      }
      
      // Jupiter special aspects (5th and 9th)
      if (planet1 === 'Jupiter' && (distance === 4 || distance === 8)) {
        aspects.push({
          planet1,
          planet2,
          type: 'special',
          description: `Jupiter aspects ${planet2} (${distance + 1}th house)`,
        });
      }
      
      // Saturn special aspects (3rd and 10th)
      if (planet1 === 'Saturn' && (distance === 2 || distance === 9)) {
        aspects.push({
          planet1,
          planet2,
          type: 'special',
          description: `Saturn aspects ${planet2} (${distance + 1}th house)`,
        });
      }
    }
  }
  
  return aspects;
}

/**
 * Get complete Vedic chart data for a date
 */
export function getVedicChart(date) {
  const positions = calculatePlanetaryPositions(date);
  const conjunctions = findConjunctions(positions);
  const aspects = calculateAspects(positions);
  const ayanamsha = calculateAyanamsha(date);
  
  return {
    date: date.toISOString(),
    ayanamsha: ayanamsha.toFixed(2),
    positions,
    conjunctions,
    aspects,
  };
}

/**
 * Get a summary of notable astrological features
 */
export function getChartSummary(chart) {
  const summary = [];
  
  // Check for exalted/debilitated planets
  for (const [planet, data] of Object.entries(chart.positions)) {
    if (data.dignity === 'exalted') {
      summary.push(`${planet} exalted in ${data.rashi.name}`);
    } else if (data.dignity === 'debilitated') {
      summary.push(`${planet} debilitated in ${data.rashi.name}`);
    }
  }
  
  // Add conjunctions
  for (const conj of chart.conjunctions) {
    summary.push(`Conjunction: ${conj.description}`);
  }
  
  return summary;
}
