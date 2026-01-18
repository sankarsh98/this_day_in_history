import axios from 'axios';

// Use environment variable for production, fallback to localhost for development
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // Increased timeout for correlation calculations
});

export async function getTodayEvents() {
  const response = await api.get('/today');
  return response.data;
}

export async function getEventsByDate(month, day, filters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.yearFrom) params.append('year_from', filters.yearFrom);
  if (filters.yearTo) params.append('year_to', filters.yearTo);
  if (filters.country) params.append('country', filters.country);
  if (filters.region) params.append('region', filters.region);
  
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await api.get(`/events/${month}/${day}${query}`);
  return response.data;
}

export async function getCategories() {
  const response = await api.get('/categories');
  return response.data;
}

export async function getCountries() {
  const response = await api.get('/countries');
  return response.data;
}

export async function getVedicChartToday() {
  const response = await api.get('/vedic/today');
  return response.data;
}

export async function getVedicChart(month, day, year) {
  const response = await api.get(`/vedic/chart/${month}/${day}/${year}`);
  return response.data;
}

export async function getCorrelatedEvents(month, day, year = null, hour = null, minScore = 2, limit = 30) {
  const params = { min_score: minScore, limit };
  if (year) params.year = year;
  if (hour !== null) params.hour = hour;
  
  const response = await api.get(`/vedic/correlations/${month}/${day}`, { params });
  return response.data;
}

export async function searchByPlanetaryPosition(planet, month, day, nakshatra = null, rashi = null) {
  const params = { planet, month, day };
  if (nakshatra) params.nakshatra = nakshatra;
  if (rashi) params.rashi = rashi;
  
  const response = await api.get('/vedic/search', { params });
  return response.data;
}

export async function searchByAspect(planet1, planet2, aspectType, month, day, country = null, region = null) {
  const params = { 
    planet1, 
    planet2, 
    aspect_type: aspectType, 
    month, 
    day 
  };
  if (country) params.country = country;
  if (region) params.region = region;
  
  const response = await api.get('/vedic/aspect-search', { params });
  return response.data;
}
