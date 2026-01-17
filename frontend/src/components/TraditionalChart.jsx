import React, { useState } from 'react';
import { format } from 'date-fns';

// Planet symbols and colors
const PLANET_INFO = {
  Sun: { symbol: '☉', abbr: 'Su', color: '#FF6B35', name: 'Surya' },
  Moon: { symbol: '☽', abbr: 'Mo', color: '#9B59B6', name: 'Chandra' },
  Mercury: { symbol: '☿', abbr: 'Me', color: '#2ECC71', name: 'Budha' },
  Venus: { symbol: '♀', abbr: 'Ve', color: '#E91E63', name: 'Shukra' },
  Mars: { symbol: '♂', abbr: 'Ma', color: '#E74C3C', name: 'Mangal' },
  Jupiter: { symbol: '♃', abbr: 'Ju', color: '#F39C12', name: 'Guru' },
  Saturn: { symbol: '♄', abbr: 'Sa', color: '#34495E', name: 'Shani' },
  Rahu: { symbol: '☊', abbr: 'Ra', color: '#8E44AD', name: 'Rahu' },
  Ketu: { symbol: '☋', abbr: 'Ke', color: '#7F8C8D', name: 'Ketu' },
};

const RASHI_INFO = [
  { id: 0, name: 'Mesha', abbr: 'Ar', symbol: '♈', english: 'Aries' },
  { id: 1, name: 'Vrishabha', abbr: 'Ta', symbol: '♉', english: 'Taurus' },
  { id: 2, name: 'Mithuna', abbr: 'Ge', symbol: '♊', english: 'Gemini' },
  { id: 3, name: 'Karka', abbr: 'Ca', symbol: '♋', english: 'Cancer' },
  { id: 4, name: 'Simha', abbr: 'Le', symbol: '♌', english: 'Leo' },
  { id: 5, name: 'Kanya', abbr: 'Vi', symbol: '♍', english: 'Virgo' },
  { id: 6, name: 'Tula', abbr: 'Li', symbol: '♎', english: 'Libra' },
  { id: 7, name: 'Vrishchika', abbr: 'Sc', symbol: '♏', english: 'Scorpio' },
  { id: 8, name: 'Dhanu', abbr: 'Sa', symbol: '♐', english: 'Sagittarius' },
  { id: 9, name: 'Makara', abbr: 'Ca', symbol: '♑', english: 'Capricorn' },
  { id: 10, name: 'Kumbha', abbr: 'Aq', symbol: '♒', english: 'Aquarius' },
  { id: 11, name: 'Meena', abbr: 'Pi', symbol: '♓', english: 'Pisces' },
];

// South Indian chart house positions (fixed signs)
// The grid positions for 4x4 layout where each cell maps to a rashi
const SOUTH_INDIAN_LAYOUT = [
  // Row 0: Pisces, Aries, Taurus, Gemini
  [11, 0, 1, 2],
  // Row 1: Aquarius, (empty), (empty), Cancer
  [10, -1, -1, 3],
  // Row 2: Capricorn, (empty), (empty), Leo
  [9, -1, -1, 4],
  // Row 3: Sagittarius, Scorpio, Libra, Virgo
  [8, 7, 6, 5],
];

// North Indian chart layout (diamond style - houses numbered 1-12 from Ascendant)
const NORTH_INDIAN_POSITIONS = {
  // Position in the diamond layout [top, left, width, height] as percentages
  1: { points: '50,0 100,25 100,50 50,25' },   // House 1 (top)
  2: { points: '100,25 100,50 75,50 75,25' },  // House 2
  3: { points: '75,50 100,50 100,75 75,75' },  // House 3
  4: { points: '100,50 100,75 75,75 50,50' },  // House 4
  5: { points: '75,75 100,75 100,100 75,100' },// House 5
  6: { points: '50,75 75,75 75,100 50,100' },  // House 6
  7: { points: '50,75 50,100 25,100 25,75' },  // House 7 (bottom)
  8: { points: '25,75 25,100 0,100 0,75' },    // House 8
  9: { points: '0,50 25,50 25,75 0,75' },      // House 9
  10: { points: '0,25 25,25 50,50 0,50' },     // House 10
  11: { points: '0,0 25,0 25,25 0,25' },       // House 11
  12: { points: '25,0 50,0 50,25 25,25' },     // House 12
};

function TraditionalChart({ chart, chartStyle = 'south' }) {
  const [selectedHouse, setSelectedHouse] = useState(null);

  if (!chart || !chart.positions) return null;

  const { positions, date, ayanamsha } = chart;
  const chartDate = date ? new Date(date) : new Date();

  // Group planets by rashi
  const planetsByRashi = {};
  Object.entries(positions).forEach(([planet, data]) => {
    const rashiId = data.rashi.id;
    if (!planetsByRashi[rashiId]) {
      planetsByRashi[rashiId] = [];
    }
    planetsByRashi[rashiId].push({ planet, ...data });
  });

  const renderPlanetBadge = (planetData, size = 'normal') => {
    const info = PLANET_INFO[planetData.planet];
    const isExalted = planetData.dignity === 'exalted';
    const isDebilitated = planetData.dignity === 'debilitated';

    return (
      <div
        key={planetData.planet}
        className={`chart-planet ${size} ${isExalted ? 'exalted' : ''} ${isDebilitated ? 'debilitated' : ''}`}
        style={{ '--planet-color': info?.color }}
        title={`${planetData.planet} (${info?.name}) - ${planetData.nakshatra.name} Pada ${planetData.nakshatra.pada}${planetData.dignity ? ` - ${planetData.dignity}` : ''}`}
      >
        <span className="planet-sym">{info?.symbol}</span>
        {size !== 'small' && <span className="planet-abbr">{info?.abbr}</span>}
      </div>
    );
  };

  // South Indian Style Chart
  const renderSouthIndianChart = () => (
    <div className="south-indian-chart">
      <div className="si-grid">
        {SOUTH_INDIAN_LAYOUT.flat().map((rashiId, idx) => {
          if (rashiId === -1) {
            // Center cells - show chart info
            const centerIdx = idx;
            if (centerIdx === 5) {
              return (
                <div key={idx} className="si-cell center-cell">
                  <div className="chart-info">
                    <div className="chart-title">Rashi Chart</div>
                    <div className="chart-date">{format(chartDate, 'dd MMM yyyy')}</div>
                    <div className="chart-time">{format(chartDate, 'HH:mm')}</div>
                  </div>
                </div>
              );
            }
            return <div key={idx} className="si-cell center-cell empty"></div>;
          }

          const rashi = RASHI_INFO[rashiId];
          const planets = planetsByRashi[rashiId] || [];
          const isSelected = selectedHouse === rashiId;

          return (
            <div
              key={idx}
              className={`si-cell ${planets.length > 0 ? 'has-planets' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedHouse(isSelected ? null : rashiId)}
            >
              <div className="cell-header">
                <span className="rashi-num">{rashiId + 1}</span>
                <span className="rashi-sym">{rashi.symbol}</span>
              </div>
              <div className="cell-planets">
                {planets.map(p => renderPlanetBadge(p, planets.length > 3 ? 'small' : 'normal'))}
              </div>
              <div className="cell-footer">
                <span className="rashi-name">{rashi.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // North Indian Style Chart
  const renderNorthIndianChart = () => (
    <div className="north-indian-chart">
      <svg viewBox="0 0 100 100" className="ni-svg">
        {/* Outer border */}
        <rect x="0" y="0" width="100" height="100" className="ni-border" />
        
        {/* Diagonal lines */}
        <line x1="0" y1="0" x2="100" y2="100" className="ni-line" />
        <line x1="100" y1="0" x2="0" y2="100" className="ni-line" />
        <line x1="50" y1="0" x2="50" y2="100" className="ni-line" />
        <line x1="0" y1="50" x2="100" y2="50" className="ni-line" />
        
        {/* Inner diamond */}
        <polygon points="50,25 75,50 50,75 25,50" className="ni-inner" />
      </svg>
      
      <div className="ni-houses">
        {/* Top row houses */}
        <div className="ni-house house-12" onClick={() => setSelectedHouse(11)}>
          <span className="house-num">12</span>
          <span className="rashi-sym">{RASHI_INFO[11].symbol}</span>
          <div className="house-planets">
            {(planetsByRashi[11] || []).map(p => renderPlanetBadge(p, 'small'))}
          </div>
        </div>
        <div className="ni-house house-1" onClick={() => setSelectedHouse(0)}>
          <span className="house-num">1</span>
          <span className="rashi-sym">{RASHI_INFO[0].symbol}</span>
          <div className="house-planets">
            {(planetsByRashi[0] || []).map(p => renderPlanetBadge(p, 'small'))}
          </div>
        </div>
        <div className="ni-house house-2" onClick={() => setSelectedHouse(1)}>
          <span className="house-num">2</span>
          <span className="rashi-sym">{RASHI_INFO[1].symbol}</span>
          <div className="house-planets">
            {(planetsByRashi[1] || []).map(p => renderPlanetBadge(p, 'small'))}
          </div>
        </div>
        
        {/* Left side houses */}
        <div className="ni-house house-11" onClick={() => setSelectedHouse(10)}>
          <span className="house-num">11</span>
          <span className="rashi-sym">{RASHI_INFO[10].symbol}</span>
          <div className="house-planets">
            {(planetsByRashi[10] || []).map(p => renderPlanetBadge(p, 'small'))}
          </div>
        </div>
        <div className="ni-house house-10" onClick={() => setSelectedHouse(9)}>
          <span className="house-num">10</span>
          <span className="rashi-sym">{RASHI_INFO[9].symbol}</span>
          <div className="house-planets">
            {(planetsByRashi[9] || []).map(p => renderPlanetBadge(p, 'small'))}
          </div>
        </div>
        
        {/* Center info */}
        <div className="ni-center">
          <div className="chart-title">Rashi</div>
          <div className="chart-date">{format(chartDate, 'dd/MM/yyyy')}</div>
          <div className="chart-time">{format(chartDate, 'HH:mm')}</div>
        </div>
        
        {/* Right side houses */}
        <div className="ni-house house-3" onClick={() => setSelectedHouse(2)}>
          <span className="house-num">3</span>
          <span className="rashi-sym">{RASHI_INFO[2].symbol}</span>
          <div className="house-planets">
            {(planetsByRashi[2] || []).map(p => renderPlanetBadge(p, 'small'))}
          </div>
        </div>
        <div className="ni-house house-4" onClick={() => setSelectedHouse(3)}>
          <span className="house-num">4</span>
          <span className="rashi-sym">{RASHI_INFO[3].symbol}</span>
          <div className="house-planets">
            {(planetsByRashi[3] || []).map(p => renderPlanetBadge(p, 'small'))}
          </div>
        </div>
        
        {/* Bottom row houses */}
        <div className="ni-house house-9" onClick={() => setSelectedHouse(8)}>
          <span className="house-num">9</span>
          <span className="rashi-sym">{RASHI_INFO[8].symbol}</span>
          <div className="house-planets">
            {(planetsByRashi[8] || []).map(p => renderPlanetBadge(p, 'small'))}
          </div>
        </div>
        <div className="ni-house house-8" onClick={() => setSelectedHouse(7)}>
          <span className="house-num">8</span>
          <span className="rashi-sym">{RASHI_INFO[7].symbol}</span>
          <div className="house-planets">
            {(planetsByRashi[7] || []).map(p => renderPlanetBadge(p, 'small'))}
          </div>
        </div>
        <div className="ni-house house-7" onClick={() => setSelectedHouse(6)}>
          <span className="house-num">7</span>
          <span className="rashi-sym">{RASHI_INFO[6].symbol}</span>
          <div className="house-planets">
            {(planetsByRashi[6] || []).map(p => renderPlanetBadge(p, 'small'))}
          </div>
        </div>
        <div className="ni-house house-6" onClick={() => setSelectedHouse(5)}>
          <span className="house-num">6</span>
          <span className="rashi-sym">{RASHI_INFO[5].symbol}</span>
          <div className="house-planets">
            {(planetsByRashi[5] || []).map(p => renderPlanetBadge(p, 'small'))}
          </div>
        </div>
        <div className="ni-house house-5" onClick={() => setSelectedHouse(4)}>
          <span className="house-num">5</span>
          <span className="rashi-sym">{RASHI_INFO[4].symbol}</span>
          <div className="house-planets">
            {(planetsByRashi[4] || []).map(p => renderPlanetBadge(p, 'small'))}
          </div>
        </div>
      </div>
    </div>
  );

  // Selected house detail panel
  const renderHouseDetail = () => {
    if (selectedHouse === null) return null;

    const rashi = RASHI_INFO[selectedHouse];
    const planets = planetsByRashi[selectedHouse] || [];

    return (
      <div className="house-detail-panel">
        <div className="detail-header">
          <span className="detail-rashi-sym">{rashi.symbol}</span>
          <div className="detail-rashi-info">
            <span className="detail-rashi-name">{rashi.name}</span>
            <span className="detail-rashi-english">{rashi.english}</span>
          </div>
          <button className="close-detail" onClick={() => setSelectedHouse(null)}>×</button>
        </div>
        
        {planets.length === 0 ? (
          <p className="no-planets">No planets in this sign</p>
        ) : (
          <div className="detail-planets">
            {planets.map(p => (
              <div key={p.planet} className="detail-planet-row">
                <div className="planet-main">
                  <span className="planet-symbol" style={{ color: PLANET_INFO[p.planet]?.color }}>
                    {PLANET_INFO[p.planet]?.symbol}
                  </span>
                  <span className="planet-name">{p.planet}</span>
                  {p.dignity && (
                    <span className={`dignity-tag ${p.dignity}`}>{p.dignity}</span>
                  )}
                </div>
                <div className="planet-details">
                  <span className="nakshatra">{p.nakshatra.name}</span>
                  <span className="pada">Pada {p.nakshatra.pada}</span>
                  <span className="longitude">{p.longitude}°</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="traditional-chart-container">
      {chartStyle === 'south' ? renderSouthIndianChart() : renderNorthIndianChart()}
      {renderHouseDetail()}
      
      <div className="chart-footer">
        <span className="ayanamsha">Lahiri Ayanamsha: {ayanamsha}°</span>
      </div>
    </div>
  );
}

export default TraditionalChart;
