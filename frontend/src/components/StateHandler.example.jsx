/**
 * StateHandler Usage Examples
 * 
 * This file demonstrates how to use the StateHandler component and useStateHandler hook
 * for consistent loading, error, and retry handling across the application.
 */

import { useState } from "react";
import { StateHandler } from "./ui";
import { useStateHandler } from "../hooks/useStateHandler";
import { someApi } from "../services/some.api";

// ============================================
// Example 1: Single API Call
// ============================================
export function SingleApiCallExample() {
  const { loading, error, data, retry } = useStateHandler(
    async () => {
      const res = await someApi.getData();
      return res.data;
    }
  );

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <div>
        <h2>Data: {data?.name}</h2>
        {/* Your content here */}
      </div>
    </StateHandler>
  );
}

// ============================================
// Example 2: Multiple Parallel API Calls
// ============================================
export function MultipleApiCallsExample() {
  const { loading, error, data, retry } = useStateHandler(
    async () => {
      const [statsRes, profileRes] = await Promise.all([
        someApi.getStats(),
        someApi.getProfile()
      ]);
      return {
        stats: statsRes.data,
        profile: profileRes.data,
      };
    }
  );

  const stats = data?.stats;
  const profile = data?.profile;

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <div>
        <h2>Stats: {stats?.count}</h2>
        <h2>Profile: {profile?.name}</h2>
      </div>
    </StateHandler>
  );
}

// ============================================
// Example 3: With Filter/Dependencies
// ============================================
export function WithFilterExample() {
  const [filter, setFilter] = useState("");

  const { loading, error, data, retry } = useStateHandler(
    async () => {
      const params = filter ? { status: filter } : {};
      const res = await someApi.getItems(params);
      return res.data || [];
    },
    { dependencies: [filter] } // Re-fetch when filter changes
  );

  const items = data || [];

  return (
    <div>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">All</option>
        <option value="active">Active</option>
      </select>

      <StateHandler loading={loading} error={error} retry={retry}>
        {items.length === 0 ? (
          <p>No items found</p>
        ) : (
          <ul>
            {items.map(item => <li key={item.id}>{item.name}</li>)}
          </ul>
        )}
      </StateHandler>
    </div>
  );
}

// ============================================
// Example 4: Custom Loader
// ============================================
export function CustomLoaderExample() {
  const { loading, error, data, retry } = useStateHandler(
    async () => {
      const res = await someApi.getData();
      return res.data;
    }
  );

  const customLoader = (
    <div className="custom-skeleton">
      <div className="skeleton-line" />
      <div className="skeleton-line" />
    </div>
  );

  return (
    <StateHandler 
      loading={loading} 
      error={error} 
      retry={retry}
      loader={customLoader}
    >
      <div>{/* Your content */}</div>
    </StateHandler>
  );
}

// ============================================
// Example 5: Manual Fetch (No Auto-fetch)
// ============================================
export function ManualFetchExample() {
  const { loading, error, data, fetch } = useStateHandler(
    async () => {
      const res = await someApi.getData();
      return res.data;
    },
    { autoFetch: false } // Don't fetch on mount
  );

  return (
    <div>
      <button onClick={fetch}>Load Data</button>
      <StateHandler loading={loading} error={error} retry={fetch}>
        <div>{data?.name}</div>
      </StateHandler>
    </div>
  );
}

// ============================================
// Example 6: Nested StateHandlers
// ============================================
export function NestedStateHandlersExample() {
  const { loading: walletLoading, error: walletError, data: wallet, retry: retryWallet } = useStateHandler(
    async () => {
      const res = await someApi.getWallet();
      return res.data;
    }
  );

  const { loading: ledgerLoading, error: ledgerError, data: ledger, retry: retryLedger } = useStateHandler(
    async () => {
      const res = await someApi.getLedger();
      return res.data || [];
    }
  );

  return (
    <StateHandler loading={walletLoading} error={walletError} retry={retryWallet}>
      <div>
        <h2>Wallet: {wallet?.balance}</h2>
        
        <StateHandler loading={ledgerLoading} error={ledgerError} retry={retryLedger}>
          <ul>
            {ledger.map(item => <li key={item.id}>{item.name}</li>)}
          </ul>
        </StateHandler>
      </div>
    </StateHandler>
  );
}

