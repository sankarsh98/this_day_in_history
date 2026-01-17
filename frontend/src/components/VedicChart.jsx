import React from 'react';
import { RASHIS } from '../lib/vedicCalculations';
import { format } from 'date-fns';

// Beautiful Rashi icons with colors and elements
const RASHI_STYLES = {
  0: { gradient: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A24 100%)', element: 'fire' },     // Mesha
  1: { gradient: 'linear-gradient(135deg, #7CB342 0%, #558B2F 100%)', element: 'earth' },    // Vrishabha
  2: { gradient: 'linear-gradient(135deg, #64B5F6 0%, #1E88E5 100%)', element: 'air' },      // Mithuna
  3: { gradient: 'linear-gradient(135deg, #4DD0E1 0%, #00ACC1 100%)', element: 'water' },    // Karka
  4: { gradient: 'linear-gradient(135deg, #FFB74D 0%, #FF9800 100%)', element: 'fire' },     // Simha
  5: { gradient: 'linear-gradient(135deg, #A1887F 0%, #6D4C41 100%)', element: 'earth' },    // Kanya
  6: { gradient: 'linear-gradient(135deg, #BA68C8 0%, #8E24AA 100%)', element: 'air' },      // Tula
  7: { gradient: 'linear-gradient(135deg, #E57373 0%, #C62828 100%)', element: 'water' },    // Vrishchika
  8: { gradient: 'linear-gradient(135deg, #FF8A65 0%, #D84315 100%)', element: 'fire' },     // Dhanu
  9: { gradient: 'linear-gradient(135deg, #90A4AE 0%, #455A64 100%)', element: 'earth' },    // Makara
  10: { gradient: 'linear-gradient(135deg, #7986CB 0%, #3949AB 100%)', element: 'air' },     // Kumbha
  11: { gradient: 'linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%)', element: 'water' },   // Meena
};

const PLANET_SYMBOLS = {
  Sun: { symbol: '☉', name: 'Surya', color: '#FF6B35', glow: '#FFD700' },
  Moon: { symbol: '☽', name: 'Chandra', color: '#E8E8E8', glow: '#C9B1FF' },
  Mercury: { symbol: '☿', name: 'Budha', color: '#2ECC71', glow: '#4ECDC4' },
  Venus: { symbol: '♀', name: 'Shukra', color: '#FF69B4', glow: '#FFB6C1' },
  Mars: { symbol: '♂', name: 'Mangal', color: '#E74C3C', glow: '#FF6B6B' },
  Jupiter: { symbol: '♃', name: 'Guru', color: '#F39C12', glow: '#FFD700' },
  Saturn: { symbol: '♄', name: 'Shani', color: '#34495E', glow: '#5D6D7E' },
  Rahu: { symbol: '☊', name: 'Rahu', color: '#8E44AD', glow: '#9B59B6' },
  Ketu: { symbol: '☋', name: 'Ketu', color: '#7F8C8D', glow: '#95A5A6' },
};

function VedicChart({ chart, showTime = true }) {
  if (!chart) return null;

  const { positions, conjunctions, aspects, date, ayanamsha } = chart;

  // Create 12-house grid with rashi positions
  const houses = RASHIS.map((rashi) => {
    const planetsInHouse = Object.entries(positions)
      .filter(([_, data]) => data.rashi.id === rashi.id)
      .map(([planet, data]) => ({ planet, ...data }));
    
    return { rashi, planets: planetsInHouse };
  });

  // Parse date if it's a string
  const chartDate = date ? new Date(date) : null;

  return (
    <div className="vedic-chart-enhanced">
      <div className="chart-header">
        <h3>Vedic Chart</h3>
        <div className="chart-meta">
          {chartDate && showTime && (
            <span className="chart-time">
              {format(chartDate, 'MMM d, yyyy HH:mm')}
            </span>
          )}
          <span className="chart-ayanamsha">
            Lahiri Ayanamsha: {ayanamsha}°
          </span>
        </div>
      </div>
      
      {/* South Indian Style Chart Grid */}
      <div className="chart-grid-enhanced">
        {houses.map((house, index) => {
          const style = RASHI_STYLES[index];
          const hasPlanets = house.planets.length > 0;
          
          return (
            <div 
              key={index} 
              className={`house-enhanced ${style.element} ${hasPlanets ? 'has-planets' : ''}`}
            >
              {/* Rashi Header */}
              <div className="rashi-header" style={{ background: style.gradient }}>
                <span className="rashi-symbol-large">{house.rashi.symbol}</span>
                <div className="rashi-info">
                  <span className="rashi-name">{house.rashi.name}</span>
                  <span className="rashi-english">{house.rashi.english}</span>
                </div>
              </div>
              
              {/* Planets in this house */}
              <div className="house-content">
                {house.planets.length === 0 ? (
                  <span className="empty-house">-</span>
                ) : (
                  <div className="planets-container">
                    {house.planets.map(({ planet, dignity, nakshatra, longitude }) => {
                      const planetInfo = PLANET_SYMBOLS[planet];
                      return (
                        <div
                          key={planet}
                          className={`planet-badge ${dignity || ''}`}
                          style={{ 
                            '--planet-color': planetInfo?.color,
                            '--planet-glow': planetInfo?.glow,
                          }}
                          title={`${planet} (${planetInfo?.name}) at ${longitude}°\nNakshatra: ${nakshatra?.name}\n${dignity ? `Dignity: ${dignity}` : ''}`}
                        >
                          <span className="planet-symbol">{planetInfo?.symbol}</span>
                          <span className="planet-abbr">{planet.substring(0, 2)}</span>
                          {dignity && (
                            <span className={`dignity-indicator ${dignity}`}>
                              {dignity === 'exalted' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Ruler indicator */}
              <div className="rashi-ruler">
                <span>Ruler: {house.rashi.ruler}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Planetary Positions Summary */}
      <div className="planets-summary">
        <h4>Planetary Positions</h4>
        <div className="planets-row">
          {Object.entries(positions).map(([planet, data]) => {
            const info = PLANET_SYMBOLS[planet];
            return (
              <div key={planet} className="planet-summary-item">
                <span 
                  className="planet-icon" 
                  style={{ color: info?.color }}
                  title={info?.name}
                >
                  {info?.symbol}
                </span>
                <span className="planet-position">
                  {data.rashi.name.substring(0, 3)}
                </span>
                <span className="planet-nakshatra">
                  {data.nakshatra.name.substring(0, 4)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conjunctions and Aspects */}
      <div className="chart-details">
        {conjunctions.length > 0 && (
          <div className="detail-section conjunctions-section">
            <h4>Conjunctions</h4>
            <div className="detail-list">
              {conjunctions.map((conj, i) => (
                <div key={i} className="detail-item conjunction">
                  <span className="conjunction-planets">
                    {conj.planets.map(p => PLANET_SYMBOLS[p]?.symbol).join(' ')}
                  </span>
                  <span className="conjunction-text">
                    {conj.planets.join(', ')} in {conj.rashi}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {aspects.length > 0 && (
          <div className="detail-section aspects-section">
            <h4>Notable Aspects</h4>
            <div className="detail-list">
              {aspects.slice(0, 6).map((asp, i) => (
                <div key={i} className="detail-item aspect">
                  <span className="aspect-planets">
                    {PLANET_SYMBOLS[asp.planet1]?.symbol} → {PLANET_SYMBOLS[asp.planet2]?.symbol}
                  </span>
                  <span className="aspect-text">{asp.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VedicChart;
