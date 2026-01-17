import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format, addDays, subDays, setHours, setMinutes } from 'date-fns';

function DateSelector({ selectedDate, onDateChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePrevDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleDateChange = (e) => {
    const value = e.target.value;
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      const newDate = new Date(selectedDate);
      newDate.setFullYear(year);
      newDate.setMonth(month - 1);
      newDate.setDate(day);
      onDateChange(newDate);
    }
  };

  const handleTimeChange = (e) => {
    const value = e.target.value;
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      let newDate = setHours(selectedDate, hours);
      newDate = setMinutes(newDate, minutes);
      onDateChange(newDate);
    }
  };

  const handleYearChange = (e) => {
    const year = parseInt(e.target.value);
    if (year && year >= 525 && year <= 2100) {
      const newDate = new Date(selectedDate);
      newDate.setFullYear(year);
      onDateChange(newDate);
    }
  };

  const handleMonthChange = (e) => {
    const month = parseInt(e.target.value);
    if (month >= 1 && month <= 12) {
      const newDate = new Date(selectedDate);
      newDate.setMonth(month - 1);
      onDateChange(newDate);
    }
  };

  const handleDayChange = (e) => {
    const day = parseInt(e.target.value);
    if (day >= 1 && day <= 31) {
      const newDate = new Date(selectedDate);
      newDate.setDate(day);
      onDateChange(newDate);
    }
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="date-selector-wrapper">
      {/* Main Date Display Row */}
      <div className="date-main-row">
        <button className="nav-btn prev" onClick={handlePrevDay} title="Previous day">
          <ChevronLeft size={20} />
        </button>

        <div className="date-center">
          <div className="date-primary">
            <span className="date-day">{format(selectedDate, 'd')}</span>
            <div className="date-month-year">
              <span className="date-month">{format(selectedDate, 'MMMM')}</span>
              <span className="date-year">{format(selectedDate, 'yyyy')}</span>
            </div>
          </div>
          <div className="date-time">
            <Clock size={12} />
            <span>{format(selectedDate, 'HH:mm')}</span>
          </div>
        </div>

        <button className="nav-btn next" onClick={handleNextDay} title="Next day">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Action Buttons Row */}
      <div className="date-actions-row">
        {!isToday && (
          <button className="action-btn today-btn" onClick={handleToday}>
            <Calendar size={14} />
            Today
          </button>
        )}
        <button
          className={`action-btn expand-btn ${showAdvanced ? 'active' : ''}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showAdvanced ? 'Less' : 'More Options'}
        </button>
      </div>

      {/* Advanced Options Panel */}
      {showAdvanced && (
        <div className="date-advanced-panel">
          <div className="advanced-grid">
            {/* Date Picker */}
            <div className="advanced-section">
              <label>Date</label>
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={handleDateChange}
                className="date-input"
              />
            </div>

            {/* Time Picker */}
            <div className="advanced-section">
              <label>Time</label>
              <input
                type="time"
                value={format(selectedDate, 'HH:mm')}
                onChange={handleTimeChange}
                className="time-input"
              />
            </div>

            {/* Year Input */}
            <div className="advanced-section">
              <label>Year</label>
              <input
                type="number"
                min="525"
                max="2100"
                value={selectedDate.getFullYear()}
                onChange={handleYearChange}
                className="year-input"
              />
            </div>

            {/* Month Select */}
            <div className="advanced-section">
              <label>Month</label>
              <select
                value={selectedDate.getMonth() + 1}
                onChange={handleMonthChange}
                className="month-select"
              >
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            {/* Day Input */}
            <div className="advanced-section">
              <label>Day</label>
              <input
                type="number"
                min="1"
                max="31"
                value={selectedDate.getDate()}
                onChange={handleDayChange}
                className="day-input"
              />
            </div>
          </div>

          {/* Quick Year Buttons */}
          <div className="quick-years-section">
            <span className="section-label">Jump to year:</span>
            <div className="quick-years-grid">
              {[2000, 1900, 1800, 1700, 1600, 1500, 1400, 1200, 1000, 800, 600].map((year) => (
                <button
                  key={year}
                  className={`quick-year-btn ${selectedDate.getFullYear() === year ? 'active' : ''}`}
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setFullYear(year);
                    onDateChange(newDate);
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DateSelector;
