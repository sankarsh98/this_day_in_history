import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getCorrelatedEvents } from '../lib/api';
import { Sparkles, TrendingUp, Star, Zap, Circle, ExternalLink, BookOpen, Search } from 'lucide-react';

const MATCH_TYPE_INFO = {
  planet_in_nakshatra: { label: 'Nakshatra Match', icon: Star, color: '#9B59B6' },
  planet_in_rashi: { label: 'Rashi Match', icon: Circle, color: '#3498DB' },
  conjunctions: { label: 'Conjunction', icon: Zap, color: '#E74C3C' },
  aspects: { label: 'Aspect', icon: TrendingUp, color: '#F39C12' },
  dignities: { label: 'Dignity', icon: Sparkles, color: '#27AE60' },
};

// Helper functions for research links
const getWikipediaSearchUrl = (text) => {
  const searchQuery = encodeURIComponent(text.substring(0, 100));
  return `https://en.wikipedia.org/w/index.php?search=${searchQuery}`;
};

const getGoogleSearchUrl = (text, year) => {
  const searchQuery = encodeURIComponent(`${text.substring(0, 80)} ${year} history`);
  return `https://www.google.com/search?q=${searchQuery}`;
};

const getGoogleScholarUrl = (text, year) => {
  const searchQuery = encodeURIComponent(`${text.substring(0, 60)} ${year}`);
  return `https://scholar.google.com/scholar?q=${searchQuery}`;
};

function CorrelationView({ selectedDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedEvent, setExpandedEvent] = useState(null);

  useEffect(() => {
    async function fetchCorrelations() {
      setLoading(true);
      setError(null);
      try {
        const month = selectedDate.getMonth() + 1;
        const day = selectedDate.getDate();
        const year = selectedDate.getFullYear();
        const hour = selectedDate.getHours();
        const result = await getCorrelatedEvents(month, day, year, hour, 2, 30);
        setData(result);
      } catch (err) {
        setError(err.message || 'Failed to fetch correlations');
      } finally {
        setLoading(false);
      }
    }
    fetchCorrelations();
  }, [selectedDate]);

  if (loading) {
    return (
      <div className="correlation-view loading">
        <div className="spinner"></div>
        <p>Calculating astrological correlations...</p>
        <p className="loading-hint">Comparing today's planetary positions with historical events</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="correlation-view error">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { today, correlated_events, total_matches } = data;

  return (
    <div className="correlation-view">
      {/* Today's Signatures */}
      <div className="today-signatures">
        <h3>
          <Sparkles size={20} />
          Vedic Signatures for {format(selectedDate, 'MMMM d, yyyy')}
        </h3>
        <p className="signature-intro">
          Events below share these planetary patterns with the selected date:
        </p>
        <div className="signature-list">
          {today.key_signatures.map((sig, i) => (
            <div key={i} className={`signature-badge ${sig.type}`}>
              {sig.description}
            </div>
          ))}
        </div>
      </div>

      {/* Correlated Events */}
      <div className="correlated-events">
        <h3>
          <TrendingUp size={20} />
          Astrologically Correlated Events ({total_matches})
        </h3>
        <p className="correlation-intro">
          Historical events that occurred under similar planetary configurations:
        </p>

        {correlated_events.length === 0 ? (
          <p className="no-correlations">No strong correlations found for this date.</p>
        ) : (
          <div className="correlation-list">
            {correlated_events.map((item, index) => (
              <div
                key={index}
                className={`correlation-card ${expandedEvent === index ? 'expanded' : ''}`}
              >
                <div 
                  className="correlation-header"
                  onClick={() => setExpandedEvent(expandedEvent === index ? null : index)}
                >
                  <div className="correlation-score">
                    <span className="score-value">{item.correlation_score}</span>
                    <span className="score-label">score</span>
                  </div>
                  <div className="correlation-event">
                    <span className="event-year">{item.event.year}</span>
                    <p className="event-text">{item.event.text}</p>
                  </div>
                </div>

                {/* Research Links - Always visible */}
                <div className="correlation-research-links">
                  {item.event.links?.slice(0, 2).map((link, i) => (
                    <a
                      key={i}
                      href={link.content_urls?.desktop?.page || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="research-link wiki"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <BookOpen size={12} />
                      {link.title?.substring(0, 20) || 'Wikipedia'}
                      {link.title?.length > 20 && '...'}
                    </a>
                  ))}
                  <a
                    href={getWikipediaSearchUrl(item.event.text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="research-link search-wiki"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Search size={12} />
                    Wiki
                  </a>
                  <a
                    href={getGoogleSearchUrl(item.event.text, item.event.year)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="research-link search-google"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={12} />
                    Google
                  </a>
                  <a
                    href={getGoogleScholarUrl(item.event.text, item.event.year)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="research-link search-scholar"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <BookOpen size={12} />
                    Scholar
                  </a>
                </div>

                {/* Match Summary */}
                <div 
                  className="match-summary"
                  onClick={() => setExpandedEvent(expandedEvent === index ? null : index)}
                >
                  {Object.entries(item.matches).map(([type, matches]) => {
                    if (matches.length === 0) return null;
                    const info = MATCH_TYPE_INFO[type];
                    const Icon = info?.icon || Star;
                    return (
                      <span
                        key={type}
                        className="match-badge"
                        style={{ backgroundColor: info?.color || '#666' }}
                        title={`${matches.length} ${info?.label || type} matches`}
                      >
                        <Icon size={12} />
                        {matches.length}
                      </span>
                    );
                  })}
                  <span className="expand-hint">
                    {expandedEvent === index ? 'Click to collapse' : 'Click to expand'}
                  </span>
                </div>

                {/* Expanded Details */}
                {expandedEvent === index && (
                  <div className="correlation-details">
                    <h4>Matching Patterns</h4>
                    
                    {item.matches.planet_in_nakshatra.length > 0 && (
                      <div className="match-section">
                        <h5>
                          <Star size={14} /> Same Nakshatra Positions
                        </h5>
                        <ul>
                          {item.matches.planet_in_nakshatra.map((m, i) => (
                            <li key={i}>{m.planet} in {m.nakshatra} (Pada {m.pada})</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.matches.conjunctions.length > 0 && (
                      <div className="match-section">
                        <h5>
                          <Zap size={14} /> Same Conjunctions
                        </h5>
                        <ul>
                          {item.matches.conjunctions.map((m, i) => (
                            <li key={i}>{m.planets.join(', ')} in {m.rashi}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.matches.aspects.length > 0 && (
                      <div className="match-section">
                        <h5>
                          <TrendingUp size={14} /> Same Aspects
                        </h5>
                        <ul>
                          {item.matches.aspects.map((m, i) => (
                            <li key={i}>{m.planet1} {m.type.replace('_', ' ')} {m.planet2}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.matches.dignities.length > 0 && (
                      <div className="match-section">
                        <h5>
                          <Sparkles size={14} /> Same Dignities
                        </h5>
                        <ul>
                          {item.matches.dignities.map((m, i) => (
                            <li key={i}>{m.planet} {m.dignity} in {m.rashi}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.matches.planet_in_rashi.length > 0 && (
                      <div className="match-section">
                        <h5>
                          <Circle size={14} /> Same Rashi Positions
                        </h5>
                        <ul>
                          {item.matches.planet_in_rashi.slice(0, 5).map((m, i) => (
                            <li key={i}>{m.planet} in {m.rashi}</li>
                          ))}
                          {item.matches.planet_in_rashi.length > 5 && (
                            <li className="more">+{item.matches.planet_in_rashi.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Event Chart Positions */}
                    <div className="event-positions">
                      <h5>Planetary Positions in {item.event.year}</h5>
                      <div className="positions-grid">
                        {Object.entries(item.event_chart.positions).map(([planet, pos]) => (
                          <div key={planet} className="position-item">
                            <span className="planet-name">{planet}</span>
                            <span className="position-value">
                              {pos.rashi.name} / {pos.nakshatra.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CorrelationView;
