"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";

type Params = Record<string, string | number | undefined>;

/// Loads one GET resource and tracks loading / error / data, with a `reload`
/// for retry buttons. Unlike `.catch(() => {})`, a failed request surfaces as
/// `error` so the screen can offer a retry instead of loading forever.
///
/// `setData` is exposed for optimistic updates (e.g. marking an appointment
/// cancelled without refetching the list).
export function useApiResource<T>(path: string, params?: Params, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  // Params are keyed by value so callers may pass an inline object.
  const paramsKey = JSON.stringify(params ?? {});

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    apiGet<T>(path, JSON.parse(paramsKey) as Params)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [path, paramsKey, enabled, nonce]);

  /// Refetch from scratch: shows the loading state again. Use for "Try again".
  const reload = useCallback(() => {
    setData(null);
    setError(false);
    setNonce((n) => n + 1);
  }, []);

  /// Refetch quietly: keeps the current data on screen until the new data lands.
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return { data, setData, error, loading: data === null && !error, reload, refresh };
}
