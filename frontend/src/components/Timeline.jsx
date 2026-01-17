import React, { useRef, useEffect } from 'react';

function Timeline({ events, onYearClick, selectedYear }) {
  const timelineRef = useRef(null);

  // Group events by century
  const centuries = {};
  events?.forEach(event => {
    const century = Math.floor(event.year / 100) * 100;
    if (!centuries[century]) {
      centuries[century] = [];
    }
    centuries[century].push(event);
  });

  const sortedCenturies = Object.keys(centuries).sort((a, b) => b - a);

  useEffect(() => {
    if (selectedYear && timelineRef.current) {
      const yearElement = timelineRef.current.querySelector(`[data-year="${selectedYear}"]`);
      if (yearElement) {
        yearElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedYear]);

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="timeline" ref={timelineRef}>
      <h3>Timeline</h3>
      <div className="timeline-track">
        {sortedCenturies.map(century => (
          <div key={century} className="timeline-century">
            <div className="century-label">{century}s</div>
            <div className="century-events">
              {centuries[century].slice(0, 5).map((event, i) => (
                <div
                  key={`${event.year}-${i}`}
                  className={`timeline-event ${selectedYear === event.year ? 'selected' : ''}`}
                  data-year={event.year}
                  onClick={() => onYearClick?.(event.year)}
                  title={`${event.year}: ${event.text.substring(0, 100)}...`}
                >
                  <span className="event-dot"></span>
                  <span className="event-year">{event.year}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Timeline;
