import React from 'react';

const PLANET_INFO = {
  Sun: { symbol: '☉', color: '#FF6B35', name: 'Surya', element: 'fire' },
  Moon: { symbol: '☽', color: '#9B59B6', name: 'Chandra', element: 'water' },
  Mercury: { symbol: '☿', color: '#2ECC71', name: 'Budha', element: 'earth' },
  Venus: { symbol: '♀', color: '#E91E63', name: 'Shukra', element: 'water' },
  Mars: { symbol: '♂', color: '#E74C3C', name: 'Mangal', element: 'fire' },
  Jupiter: { symbol: '♃', color: '#F39C12', name: 'Guru', element: 'ether' },
  Saturn: { symbol: '♄', color: '#34495E', name: 'Shani', element: 'air' },
  Rahu: { symbol: '☊', color: '#8E44AD', name: 'Rahu', element: 'shadow' },
  Ketu: { symbol: '☋', color: '#7F8C8D', name: 'Ketu', element: 'shadow' },
};

function PlanetaryTable({ positions }) {
  if (!positions) return null;

  const planets = Object.entries(positions);

  return (
    <div className="planetary-table-enhanced">
      <h3>Planetary Positions</h3>
      
      {/* Card-based layout for mobile */}
      <div className="planet-cards">
        {planets.map(([planet, data]) => {
          const info = PLANET_INFO[planet];
          return (
            <div 
              key={planet} 
              className={`planet-card ${data.dignity || ''} ${info?.element || ''}`}
              style={{ '--planet-accent': info?.color }}
            >
              <div className="planet-header">
                <div className="planet-icon" style={{ backgroundColor: info?.color }}>
                  <span className="symbol">{info?.symbol}</span>
                </div>
                <div className="planet-names">
                  <span className="name-english">{planet}</span>
                  <span className="name-sanskrit">{info?.name}</span>
                </div>
                {data.dignity && (
                  <span className={`dignity-badge ${data.dignity}`}>
                    {data.dignity === 'exalted' ? '↑' : '↓'}
                  </span>
                )}
              </div>
              
              <div className="planet-positions">
                <div className="position-item rashi">
                  <span className="label">Rashi</span>
                  <span className="value">
                    <span className="rashi-symbol">{data.rashi.symbol}</span>
                    {data.rashi.name}
                  </span>
                </div>
                <div className="position-item nakshatra">
                  <span className="label">Nakshatra</span>
                  <span className="value">{data.nakshatra.name}</span>
                </div>
                <div className="position-item pada">
                  <span className="label">Pada</span>
                  <span className="value">{data.nakshatra.pada}</span>
                </div>
                <div className="position-item longitude">
                  <span className="label">Longitude</span>
                  <span className="value">{data.longitude}°</span>
                </div>
              </div>
              
              {data.dignity && (
                <div className={`dignity-bar ${data.dignity}`}>
                  {data.dignity === 'exalted' ? 'Exalted' : 'Debilitated'} in {data.rashi.name}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Traditional table for desktop */}
      <div className="planet-table-wrapper">
        <table className="planet-table">
          <thead>
            <tr>
              <th>Planet</th>
              <th>Rashi</th>
              <th>Nakshatra</th>
              <th>Pada</th>
              <th>Longitude</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {planets.map(([planet, data]) => {
              const info = PLANET_INFO[planet];
              return (
                <tr key={planet} className={data.dignity || ''}>
                  <td className="col-planet">
                    <span className="planet-symbol" style={{ color: info?.color }}>
                      {info?.symbol}
                    </span>
                    <span className="planet-name">{planet}</span>
                    <span className="planet-sanskrit">{info?.name}</span>
                  </td>
                  <td className="col-rashi">
                    <span className="rashi-symbol">{data.rashi.symbol}</span>
                    <span>{data.rashi.name}</span>
                  </td>
                  <td className="col-nakshatra">{data.nakshatra.name}</td>
                  <td className="col-pada">{data.nakshatra.pada}</td>
                  <td className="col-longitude">{data.longitude}°</td>
                  <td className={`col-dignity ${data.dignity || ''}`}>
                    {data.dignity ? (
                      <span className={`dignity-tag ${data.dignity}`}>
                        {data.dignity === 'exalted' ? '↑ Exalted' : '↓ Debilitated'}
                      </span>
                    ) : (
                      <span className="dignity-neutral">Normal</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PlanetaryTable;
