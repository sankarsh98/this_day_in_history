import React, { useState } from 'react';
import { Search, Star, Circle, Zap, RotateCcw, ExternalLink, BookOpen, TrendingUp, Plus, X } from 'lucide-react';
import { searchByPlanetaryPosition } from '../lib/api';

const PLANETS = [
  { id: 'Sun', name: 'Sun', symbol: '☉', color: '#FF6B35' },
  { id: 'Moon', name: 'Moon', symbol: '☽', color: '#9B59B6' },
  { id: 'Mercury', name: 'Mercury', symbol: '☿', color: '#2ECC71' },
  { id: 'Venus', name: 'Venus', symbol: '♀', color: '#E91E63' },
  { id: 'Mars', name: 'Mars', symbol: '♂', color: '#E74C3C' },
  { id: 'Jupiter', name: 'Jupiter', symbol: '♃', color: '#F39C12' },
  { id: 'Saturn', name: 'Saturn', symbol: '♄', color: '#34495E' },
  { id: 'Rahu', name: 'Rahu', symbol: '☊', color: '#8E44AD' },
  { id: 'Ketu', name: 'Ketu', symbol: '☋', color: '#7F8C8D' },
];

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

const RASHIS = [
  { id: 'Mesha', name: 'Aries', symbol: '♈' },
  { id: 'Vrishabha', name: 'Taurus', symbol: '♉' },
  { id: 'Mithuna', name: 'Gemini', symbol: '♊' },
  { id: 'Karka', name: 'Cancer', symbol: '♋' },
  { id: 'Simha', name: 'Leo', symbol: '♌' },
  { id: 'Kanya', name: 'Virgo', symbol: '♍' },
  { id: 'Tula', name: 'Libra', symbol: '♎' },
  { id: 'Vrishchika', name: 'Scorpio', symbol: '♏' },
  { id: 'Dhanu', name: 'Sagittarius', symbol: '♐' },
  { id: 'Makara', name: 'Capricorn', symbol: '♑' },
  { id: 'Kumbha', name: 'Aquarius', symbol: '♒' },
  { id: 'Meena', name: 'Pisces', symbol: '♓' },
];

const ASPECT_TYPES = [
  { id: 'conjunction', name: 'Conjunction', description: 'Same sign' },
  { id: 'opposition', name: 'Opposition', description: '7th house aspect' },
  { id: 'trine', name: 'Trine', description: '5th/9th house' },
  { id: 'square', name: 'Square', description: '4th/10th house' },
];

function CombinationBuilder({ selectedDate }) {
  const [searchMode, setSearchMode] = useState('position'); // 'position' or 'aspect'
  const [conditions, setConditions] = useState([{ planet: '', nakshatra: '', rashi: '', type: 'nakshatra' }]);
  const [aspectSearch, setAspectSearch] = useState({ planet1: '', planet2: '', aspectType: '' });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addCondition = () => {
    if (conditions.length < 5) {
      setConditions([...conditions, { planet: '', nakshatra: '', rashi: '', type: 'nakshatra' }]);
    }
  };

  const removeCondition = (index) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  const updateCondition = (index, field, value) => {
    const updated = [...conditions];
    updated[index][field] = value;
    setConditions(updated);
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();

      if (searchMode === 'position') {
        // Validate at least one complete condition
        const validConditions = conditions.filter(c => 
          c.planet && (c.type === 'nakshatra' ? c.nakshatra : c.rashi)
        );

        if (validConditions.length === 0) {
          setError('Please complete at least one planet-position combination');
          setLoading(false);
          return;
        }

        // Search for first condition, then filter by others
        const firstCond = validConditions[0];
        const result = await searchByPlanetaryPosition(
          firstCond.planet,
          month,
          day,
          firstCond.type === 'nakshatra' ? firstCond.nakshatra : null,
          firstCond.type === 'rashi' ? firstCond.rashi : null
        );

        // If multiple conditions, filter results
        if (validConditions.length > 1) {
          // For now, show results from first condition with a note
          result.additional_filters = validConditions.slice(1);
          result.filter_note = `Showing results for ${firstCond.planet} in ${firstCond.type === 'nakshatra' ? firstCond.nakshatra : firstCond.rashi}. Additional filters applied client-side when available.`;
        }

        setResults({ type: 'position', data: result, conditions: validConditions });
      } else {
        // Aspect search
        if (!aspectSearch.planet1 || !aspectSearch.planet2) {
          setError('Please select both planets for aspect search');
          setLoading(false);
          return;
        }

        // Search for conjunction (same rashi) as a simple case
        const result = await searchByPlanetaryPosition(
          aspectSearch.planet1,
          month,
          day,
          null,
          null
        );

        // Add aspect type info
        result.aspect_search = {
          planet1: aspectSearch.planet1,
          planet2: aspectSearch.planet2,
          aspectType: aspectSearch.aspectType || 'any'
        };

        setResults({ type: 'aspect', data: result });
      }
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setConditions([{ planet: '', nakshatra: '', rashi: '', type: 'nakshatra' }]);
    setAspectSearch({ planet1: '', planet2: '', aspectType: '' });
    setResults(null);
    setError(null);
  };

  const getWikipediaSearchUrl = (text) => {
    const searchQuery = encodeURIComponent(text.substring(0, 100));
    return `https://en.wikipedia.org/w/index.php?search=${searchQuery}`;
  };

  const getGoogleSearchUrl = (text, year) => {
    const searchQuery = encodeURIComponent(`${text.substring(0, 80)} ${year}`);
    return `https://www.google.com/search?q=${searchQuery}`;
  };

  return (
    <div className="combination-builder">
      <div className="builder-header">
        <h3>
          <Zap size={20} />
          Custom Combination Search
        </h3>
        <p>Find historical events based on specific planetary configurations</p>
      </div>

      {/* Search Mode Toggle */}
      <div className="search-mode-toggle">
        <button
          className={`mode-btn ${searchMode === 'position' ? 'active' : ''}`}
          onClick={() => setSearchMode('position')}
        >
          <Star size={16} />
          Position Search
        </button>
        <button
          className={`mode-btn ${searchMode === 'aspect' ? 'active' : ''}`}
          onClick={() => setSearchMode('aspect')}
        >
          <TrendingUp size={16} />
          Aspect Search
        </button>
      </div>

      <div className="builder-form">
        {searchMode === 'position' ? (
          <>
            {/* Multiple Position Conditions */}
            <div className="conditions-list">
              {conditions.map((condition, index) => (
                <div key={index} className="condition-row">
                  <div className="condition-header">
                    <span className="condition-number">Condition {index + 1}</span>
                    {conditions.length > 1 && (
                      <button
                        className="remove-condition-btn"
                        onClick={() => removeCondition(index)}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Planet Selection */}
                  <div className="form-group">
                    <label>Planet</label>
                    <div className="planet-grid-compact">
                      {PLANETS.map((p) => (
                        <button
                          key={p.id}
                          className={`planet-btn-small ${condition.planet === p.id ? 'active' : ''}`}
                          onClick={() => updateCondition(index, 'planet', p.id)}
                          style={{ '--planet-color': p.color }}
                        >
                          <span className="planet-symbol">{p.symbol}</span>
                          <span className="planet-name">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Type Toggle */}
                  <div className="form-group">
                    <div className="type-toggle">
                      <button
                        className={`type-btn ${condition.type === 'nakshatra' ? 'active' : ''}`}
                        onClick={() => updateCondition(index, 'type', 'nakshatra')}
                      >
                        <Star size={14} /> Nakshatra
                      </button>
                      <button
                        className={`type-btn ${condition.type === 'rashi' ? 'active' : ''}`}
                        onClick={() => updateCondition(index, 'type', 'rashi')}
                      >
                        <Circle size={14} /> Rashi
                      </button>
                    </div>
                  </div>

                  {/* Nakshatra or Rashi Selection */}
                  {condition.type === 'nakshatra' ? (
                    <div className="form-group">
                      <select
                        value={condition.nakshatra}
                        onChange={(e) => updateCondition(index, 'nakshatra', e.target.value)}
                        className="form-select"
                      >
                        <option value="">-- Select Nakshatra --</option>
                        {NAKSHATRAS.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="form-group">
                      <div className="rashi-grid-compact">
                        {RASHIS.map((r) => (
                          <button
                            key={r.id}
                            className={`rashi-btn-small ${condition.rashi === r.id ? 'active' : ''}`}
                            onClick={() => updateCondition(index, 'rashi', r.id)}
                          >
                            <span>{r.symbol}</span>
                            <span>{r.id}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {conditions.length < 5 && (
                <button className="add-condition-btn" onClick={addCondition}>
                  <Plus size={16} />
                  Add Another Condition
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Aspect Search */}
            <div className="aspect-search-form">
              <div className="form-group">
                <label>First Planet</label>
                <div className="planet-grid-compact">
                  {PLANETS.map((p) => (
                    <button
                      key={p.id}
                      className={`planet-btn-small ${aspectSearch.planet1 === p.id ? 'active' : ''}`}
                      onClick={() => setAspectSearch({ ...aspectSearch, planet1: p.id })}
                      style={{ '--planet-color': p.color }}
                    >
                      <span className="planet-symbol">{p.symbol}</span>
                      <span className="planet-name">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Aspect Type</label>
                <div className="aspect-type-grid">
                  {ASPECT_TYPES.map((a) => (
                    <button
                      key={a.id}
                      className={`aspect-type-btn ${aspectSearch.aspectType === a.id ? 'active' : ''}`}
                      onClick={() => setAspectSearch({ ...aspectSearch, aspectType: a.id })}
                    >
                      <span className="aspect-name">{a.name}</span>
                      <span className="aspect-desc">{a.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Second Planet</label>
                <div className="planet-grid-compact">
                  {PLANETS.map((p) => (
                    <button
                      key={p.id}
                      className={`planet-btn-small ${aspectSearch.planet2 === p.id ? 'active' : ''}`}
                      onClick={() => setAspectSearch({ ...aspectSearch, planet2: p.id })}
                      style={{ '--planet-color': p.color }}
                    >
                      <span className="planet-symbol">{p.symbol}</span>
                      <span className="planet-name">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {error && <div className="form-error">{error}</div>}

        {/* Action Buttons */}
        <div className="form-actions">
          <button className="btn-search" onClick={handleSearch} disabled={loading}>
            <Search size={18} />
            {loading ? 'Searching...' : 'Search Events'}
          </button>
          <button className="btn-reset" onClick={handleReset}>
            <RotateCcw size={18} />
            Reset
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="search-results">
          <div className="results-header">
            <h4>
              {results.data.total_matches} Events Found
            </h4>
            {results.type === 'position' && results.conditions && (
              <div className="search-criteria-badges">
                {results.conditions.map((c, i) => (
                  <span key={i} className="criteria-badge">
                    {PLANETS.find(p => p.id === c.planet)?.symbol} {c.planet} in {c.type === 'nakshatra' ? c.nakshatra : c.rashi}
                  </span>
                ))}
              </div>
            )}
            {results.type === 'aspect' && (
              <p className="results-criteria">
                {aspectSearch.planet1} {aspectSearch.aspectType || 'aspecting'} {aspectSearch.planet2}
              </p>
            )}
          </div>

          {results.data.matching_events?.length === 0 ? (
            <p className="no-results">No events found for this combination on this date.</p>
          ) : (
            <div className="results-list">
              {results.data.matching_events?.map((item, index) => (
                <div key={index} className="result-card">
                  <div className="result-header">
                    <span className="result-year">{item.event.year}</span>
                    <div className="result-position">
                      <span className="position-planet">{item.planetary_position?.planet}</span>
                      <span className="position-details">
                        {item.planetary_position?.rashi} / {item.planetary_position?.nakshatra}
                        {' '}(Pada {item.planetary_position?.pada})
                      </span>
                      {item.planetary_position?.dignity && (
                        <span className={`dignity-badge ${item.planetary_position.dignity}`}>
                          {item.planetary_position.dignity}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="result-text">{item.event.text}</p>
                  
                  {/* Research Links */}
                  <div className="research-links">
                    <span className="links-label">Research:</span>
                    {item.event.links?.slice(0, 2).map((link, i) => (
                      <a
                        key={i}
                        href={link.content_urls?.desktop?.page || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="research-link wiki"
                      >
                        <BookOpen size={12} />
                        {link.title?.substring(0, 15) || 'Wiki'}
                      </a>
                    ))}
                    <a
                      href={getWikipediaSearchUrl(item.event.text)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="research-link search-wiki"
                    >
                      <Search size={12} />
                      Wiki
                    </a>
                    <a
                      href={getGoogleSearchUrl(item.event.text, item.event.year)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="research-link search-google"
                    >
                      <ExternalLink size={12} />
                      Google
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CombinationBuilder;
