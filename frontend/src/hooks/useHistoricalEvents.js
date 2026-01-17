import { useState, useEffect } from 'react';
import { getTodayEvents, getEventsByDate, getCategories } from '../lib/api';

export function useHistoricalEvents(selectedDate, filters) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const month = selectedDate.getMonth() + 1;
        const day = selectedDate.getDate();
        const result = await getEventsByDate(month, day, filters);
        setData(result);
      } catch (err) {
        setError(err.message || 'Failed to fetch events');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedDate, filters]);

  return { data, loading, error };
}

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const result = await getCategories();
        setCategories(result.categories);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  return { categories, loading };
}
