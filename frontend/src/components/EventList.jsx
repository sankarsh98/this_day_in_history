import React from 'react';
import EventCard from './EventCard';

function EventList({ events, title, loading, error, onEventClick }) {
  if (loading) {
    return (
      <div className="event-list loading">
        <div className="spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-list error">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="event-list empty">
        <p>No events found for this date.</p>
      </div>
    );
  }

  return (
    <div className="event-list">
      {title && <h3>{title} ({events.length})</h3>}
      <div className="events-container">
        {events.map((event, index) => (
          <EventCard key={`${event.year}-${index}`} event={event} onClick={onEventClick} />
        ))}
      </div>
    </div>
  );
}

export default EventList;
