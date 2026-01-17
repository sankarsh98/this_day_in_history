import React from 'react';
import { 
  Swords, Crown, Lightbulb, Star, CloudLightning, Palette, 
  Clock, User, Skull, ExternalLink, BookOpen, Search 
} from 'lucide-react';

const CATEGORY_ICONS = {
  battle: Swords,
  political: Crown,
  discovery: Lightbulb,
  religious: Star,
  disaster: CloudLightning,
  cultural: Palette,
  general: Clock,
  birth: User,
  death: Skull,
};

const CATEGORY_COLORS = {
  battle: '#E63946',
  political: '#457B9D',
  discovery: '#2A9D8F',
  religious: '#E9C46A',
  disaster: '#F4A261',
  cultural: '#9B59B6',
  general: '#6C757D',
  birth: '#27AE60',
  death: '#7F8C8D',
};

function EventCard({ event, onClick }) {
  const Icon = CATEGORY_ICONS[event.category] || Clock;
  const color = CATEGORY_COLORS[event.category] || '#6C757D';

  const getWikipediaSearchUrl = (text) => {
    const searchQuery = encodeURIComponent(text.substring(0, 100));
    return `https://en.wikipedia.org/w/index.php?search=${searchQuery}`;
  };

  const getGoogleSearchUrl = (text, year) => {
    const searchQuery = encodeURIComponent(`${text.substring(0, 80)} ${year} history`);
    return `https://www.google.com/search?q=${searchQuery}`;
  };

  const getBritannicaUrl = (text) => {
    const searchQuery = encodeURIComponent(text.substring(0, 60));
    return `https://www.britannica.com/search?query=${searchQuery}`;
  };

  const getGoogleScholarUrl = (text, year) => {
    const searchQuery = encodeURIComponent(`${text.substring(0, 60)} ${year}`);
    return `https://scholar.google.com/scholar?q=${searchQuery}`;
  };

  return (
    <div className="event-card" onClick={() => onClick?.(event)}>
      <div className="event-year" style={{ borderColor: color }}>
        {event.year}
      </div>
      <div className="event-content">
        <div className="event-category" style={{ color }}>
          <Icon size={14} />
          <span>{event.category}</span>
        </div>
        <p className="event-text">{event.text}</p>
        
        {/* Research Links Section */}
        <div className="event-research">
          {/* Wikipedia Direct Links */}
          {event.links && event.links.length > 0 && (
            <div className="wiki-links">
              {event.links.slice(0, 3).map((link, i) => (
                <a
                  key={i}
                  href={link.content_urls?.desktop?.page || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="research-link wiki"
                  title={`Wikipedia: ${link.title}`}
                >
                  <BookOpen size={12} />
                  {link.title?.substring(0, 25) || 'Wikipedia'}
                  {link.title?.length > 25 && '...'}
                </a>
              ))}
            </div>
          )}
          
          {/* Additional Research Links */}
          <div className="more-research">
            <a
              href={getWikipediaSearchUrl(event.text)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="research-link search-wiki"
              title="Search Wikipedia"
            >
              <Search size={12} />
              Wiki
            </a>
            <a
              href={getGoogleSearchUrl(event.text, event.year)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="research-link search-google"
              title="Search Google"
            >
              <ExternalLink size={12} />
              Google
            </a>
            <a
              href={getBritannicaUrl(event.text)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="research-link search-britannica"
              title="Search Britannica"
            >
              <BookOpen size={12} />
              Britannica
            </a>
            <a
              href={getGoogleScholarUrl(event.text, event.year)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="research-link search-scholar"
              title="Search Google Scholar"
            >
              <Search size={12} />
              Scholar
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventCard;
