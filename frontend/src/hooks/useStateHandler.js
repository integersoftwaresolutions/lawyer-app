import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Custom hook for managing API-driven state (loading, error, retry)
 * Supports both single and multiple parallel API calls
 * 
 * @param {Function|Array<Function>} fetchFn - Single fetch function or array of fetch functions
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Whether to fetch automatically on mount (default: true)
 * @param {Array} options.dependencies - Dependencies array for useEffect (default: [])
 * @returns {Object} State and control functions
 */
export function useStateHandler(fetchFn, options = {}) {
  const { autoFetch = true, dependencies = [] } = options;
  
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const fetchFnRef = useRef(fetchFn);
  
  // Keep fetchFn ref updated
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fn = fetchFnRef.current;
      
      // Handle single function or array of functions
      if (Array.isArray(fn)) {
        // Multiple parallel API calls
        const results = await Promise.all(fn.map(f => f()));
        setData(results);
      } else {
        // Single API call
        const result = await fn();
        setData(result);
      }
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    fetch();
  }, [fetch]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, ...dependencies]);

  return {
    loading,
    error,
    data,
    fetch,
    retry,
    setData, // Allow manual data updates if needed
  };
}

