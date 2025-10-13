import React from 'react';

// Helper functions to fetch available stock from backend
// Usage: import { fetchAvailableStock, fetchAvailableStocks } from '@/api/stock'

export async function fetchAvailableStock(productId: number): Promise<number> {
  const res = await fetch(`/api/products/${productId}/available-stock`);
  if (!res.ok) {
    throw new Error(`Failed to fetch stock for product ${productId}`);
  }
  const body = await res.json();
  // body shape: { success: true, data: { productId, availableStock } }
  return body?.data?.availableStock ?? 0;
}

export async function fetchAvailableStocks(productIds: number[]): Promise<Record<number, number>> {
  const results: Record<number, number> = {};
  await Promise.all(productIds.map(async (id) => {
    try {
      results[id] = await fetchAvailableStock(id);
    } catch (e) {
      // on error, return 0 to avoid blocking UI
      results[id] = 0;
    }
  }));
  return results;
}

// Simple React hook example (can be moved to your hooks folder)
// import useAvailableStock from '@/api/stock';
export function useAvailableStock(productId: number) {
  const [available, setAvailable] = React.useState<number | null>(null);

  React.useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const val = await fetchAvailableStock(productId);
        if (mounted) setAvailable(val);
      } catch (e) {
        if (mounted) setAvailable(null);
      }
    }
    refresh();
    const id = setInterval(refresh, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, [productId]);

  return { available, refresh: () => fetchAvailableStock(productId).then(v => setAvailable(v)) };
}
