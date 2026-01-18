import React, { useEffect, useState } from 'react';
import { Filter, X, Globe, MapPin } from 'lucide-react';
import { getCountries } from '../lib/api';

function FilterPanel({ filters, setFilters, categories, isOpen, onToggle }) {
  const [countriesData, setCountriesData] = useState({ countries: [], regions: [] });

  useEffect(() => {
    getCountries()
      .then(data => setCountriesData(data))
      .catch(err => console.error('Failed to load countries:', err));
  }, []);

  const handleCategoryChange = (categoryId) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category === categoryId ? null : categoryId
    }));
  };

  const handleYearChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value ? parseInt(value) : null
    }));
  };

  const handleCountryChange = (value) => {
    setFilters(prev => ({
      ...prev,
      country: value || null,
      region: null // Clear region when country is selected
    }));
  };

  const handleRegionChange = (value) => {
    setFilters(prev => ({
      ...prev,
      region: value || null,
      country: null // Clear country when region is selected
    }));
  };

  const clearFilters = () => {
    setFilters({ category: null, yearFrom: null, yearTo: null, country: null, region: null });
  };

  const hasActiveFilters = filters.category || filters.yearFrom || filters.yearTo || filters.country || filters.region;

  return (
    <div className={`filter-panel ${isOpen ? 'open' : ''}`}>
      <button className="filter-toggle" onClick={onToggle}>
        <Filter size={18} />
        <span>Filters</span>
        {hasActiveFilters && <span className="filter-badge">!</span>}
      </button>

      {isOpen && (
        <div className="filter-content">
          <div className="filter-header">
            <h4>Filter Events</h4>
            {hasActiveFilters && (
              <button className="clear-filters" onClick={clearFilters}>
                <X size={14} /> Clear
              </button>
            )}
          </div>

          <div className="filter-section">
            <label>Category</label>
            <div className="category-buttons">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`category-btn ${filters.category === cat.id ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <label>Year Range</label>
            <div className="year-inputs">
              <input
                type="number"
                placeholder="From (e.g., 1000)"
                value={filters.yearFrom || ''}
                onChange={(e) => handleYearChange('yearFrom', e.target.value)}
                min="525"
                max="2024"
              />
              <span>to</span>
              <input
                type="number"
                placeholder="To (e.g., 1500)"
                value={filters.yearTo || ''}
                onChange={(e) => handleYearChange('yearTo', e.target.value)}
                min="525"
                max="2024"
              />
            </div>
          </div>

          <div className="filter-section">
            <label><Globe size={14} /> Region</label>
            <select
              value={filters.region || ''}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="filter-select"
            >
              <option value="">All Regions</option>
              {countriesData.regions?.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="filter-section">
            <label><MapPin size={14} /> Country</label>
            <select
              value={filters.country || ''}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="filter-select"
            >
              <option value="">All Countries</option>
              {countriesData.countries?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterPanel;
