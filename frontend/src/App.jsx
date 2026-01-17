import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import DateSelector from './components/DateSelector';
import EventList from './components/EventList';
import VedicChart from './components/VedicChart';
import TraditionalChart from './components/TraditionalChart';
import PlanetaryTable from './components/PlanetaryTable';
import FilterPanel from './components/FilterPanel';
import Timeline from './components/Timeline';
import CorrelationView from './components/CorrelationView';
import CombinationBuilder from './components/CombinationBuilder';
import { useHistoricalEvents, useCategories } from './hooks/useHistoricalEvents';
import { getVedicChart, getChartSummary } from './lib/vedicCalculations';
import './App.css';

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filters, setFilters] = useState({ category: null, yearFrom: null, yearTo: null });
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('correlations');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [chartStyle, setChartStyle] = useState('south'); // 'south', 'north', or 'grid'

  const { data, loading, error } = useHistoricalEvents(selectedDate, filters);
  const { categories } = useCategories();

  // Calculate Vedic chart for selected date
  const vedicChart = useMemo(() => {
    return getVedicChart(selectedDate);
  }, [selectedDate]);

  const chartSummary = useMemo(() => {
    return getChartSummary(vedicChart);
  }, [vedicChart]);

  // Calculate chart for a historical event's year
  const eventChart = useMemo(() => {
    if (!selectedEvent) return null;
    const eventDate = new Date(
      selectedEvent.year, 
      selectedDate.getMonth(), 
      selectedDate.getDate(),
      selectedDate.getHours(),
      selectedDate.getMinutes()
    );
    return getVedicChart(eventDate);
  }, [selectedEvent, selectedDate]);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setActiveTab('event-chart');
  };

  const handleYearClick = (year) => {
    const event = data?.events?.find(e => e.year === year);
    if (event) {
      handleEventClick(event);
    }
  };

  const renderChartStyleToggle = () => (
    <div className="chart-style-toggle">
      <span className="toggle-label">Chart Style:</span>
      <button 
        className={`style-btn ${chartStyle === 'south' ? 'active' : ''}`}
        onClick={() => setChartStyle('south')}
      >
        South Indian
      </button>
      <button 
        className={`style-btn ${chartStyle === 'north' ? 'active' : ''}`}
        onClick={() => setChartStyle('north')}
      >
        North Indian
      </button>
      <button 
        className={`style-btn ${chartStyle === 'grid' ? 'active' : ''}`}
        onClick={() => setChartStyle('grid')}
      >
        Grid View
      </button>
    </div>
  );

  const renderChart = (chart) => {
    if (!chart) return null;
    
    if (chartStyle === 'grid') {
      return <VedicChart chart={chart} showTime={true} />;
    }
    return <TraditionalChart chart={chart} chartStyle={chartStyle} />;
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>This Day in History</h1>
        <p className="subtitle">Vedic Edition</p>
      </header>

      <main className="app-main">
        <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />

        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          categories={categories}
          isOpen={filterOpen}
          onToggle={() => setFilterOpen(!filterOpen)}
        />

        <div className="content-tabs">
          <button
            className={`tab ${activeTab === 'correlations' ? 'active' : ''}`}
            onClick={() => setActiveTab('correlations')}
          >
            Correlations
          </button>
          <button
            className={`tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            Search
          </button>
          <button
            className={`tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
          <button
            className={`tab ${activeTab === 'chart' ? 'active' : ''}`}
            onClick={() => setActiveTab('chart')}
          >
            Chart
          </button>
          <button
            className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
          {selectedEvent && (
            <button
              className={`tab event-tab ${activeTab === 'event-chart' ? 'active' : ''}`}
              onClick={() => setActiveTab('event-chart')}
            >
              {selectedEvent.year}
            </button>
          )}
        </div>

        <div className="content-area">
          {activeTab === 'correlations' && (
            <CorrelationView selectedDate={selectedDate} />
          )}

          {activeTab === 'search' && (
            <CombinationBuilder selectedDate={selectedDate} />
          )}

          {activeTab === 'events' && (
            <div className="events-section">
              <EventList
                events={data?.events}
                title="Historical Events"
                loading={loading}
                error={error}
                onEventClick={handleEventClick}
              />
              
              {data?.births?.length > 0 && (
                <details className="births-deaths">
                  <summary>Notable Births ({data.births.length})</summary>
                  <EventList events={data.births} onEventClick={handleEventClick} />
                </details>
              )}

              {data?.deaths?.length > 0 && (
                <details className="births-deaths">
                  <summary>Notable Deaths ({data.deaths.length})</summary>
                  <EventList events={data.deaths} onEventClick={handleEventClick} />
                </details>
              )}
            </div>
          )}

          {activeTab === 'chart' && (
            <div className="chart-section">
              <div className="chart-header-row">
                <h3>Vedic Chart for {format(selectedDate, 'MMMM d, yyyy HH:mm')}</h3>
                {renderChartStyleToggle()}
              </div>
              
              {chartSummary.length > 0 && (
                <div className="chart-highlights">
                  <h4>Highlights</h4>
                  <ul>
                    {chartSummary.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {renderChart(vedicChart)}
              <PlanetaryTable positions={vedicChart?.positions} />
            </div>
          )}

          {activeTab === 'timeline' && (
            <Timeline
              events={data?.events}
              onYearClick={handleYearClick}
              selectedYear={selectedEvent?.year}
            />
          )}

          {activeTab === 'event-chart' && selectedEvent && (
            <div className="event-chart-section">
              <div className="event-detail">
                <h3>{selectedEvent.year}: {selectedEvent.text.substring(0, 100)}...</h3>
                <p className="full-text">{selectedEvent.text}</p>
              </div>
              
              <div className="chart-header-row">
                <h4>Vedic Chart for {format(selectedDate, 'MMMM d HH:mm')}, {selectedEvent.year}</h4>
                {renderChartStyleToggle()}
              </div>
              
              {renderChart(eventChart)}
              <PlanetaryTable positions={eventChart?.positions} />
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Data from Wikipedia | Vedic Calculations with Lahiri Ayanamsha</p>
      </footer>
    </div>
  );
}

export default App;
