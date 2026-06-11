import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Reusable hook for paginated API responses: { data, meta }.
 */
export function usePaginatedQuery(fetchFn, { dependencies = [], defaultLimit = 10, enabled = true }) {
  const [page, setPage] = useState(1);
  const [limit] = useState(defaultLimit);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: defaultLimit, total: 0, pages: 1 });
  const fetchRef = useRef(fetchFn);

  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRef.current({ page, limit });
      setItems(res.data ?? []);
      setMeta(res.meta ?? { page, limit, total: 0, pages: 1 });
    } catch (err) {
      setError(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, enabled]);

  useEffect(() => {
    setPage(1);
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch();
  }, [fetch, ...dependencies]);

  return {
    items,
    meta,
    page,
    setPage,
    limit,
    loading,
    error,
    retry: fetch
  };
}
