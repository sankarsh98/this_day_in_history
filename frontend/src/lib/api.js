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
  
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await api.get(`/events/${month}/${day}${query}`);
  return response.data;
}

export async function getCategories() {
  const response = await api.get('/categories');
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

export async function getCorrelatedEvents(month, day, minScore = 3, limit = 20) {
  const response = await api.get(`/vedic/correlations/${month}/${day}`, {
    params: { min_score: minScore, limit }
  });
  return response.data;
}

export async function searchByPlanetaryPosition(planet, month, day, nakshatra = null, rashi = null) {
  const params = { planet, month, day };
  if (nakshatra) params.nakshatra = nakshatra;
  if (rashi) params.rashi = rashi;
  
  const response = await api.get('/vedic/search', { params });
  return response.data;
}
