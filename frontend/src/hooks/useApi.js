"use client";
import { useState, useCallback } from "react";

/**
 * Generic hook for API data fetching with loading/error states
 */
export function useApi(apiFn) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const execute = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiFn(...args);
            setData(result);
            return result;
        } catch (err) {
            setError(err.message || "An error occurred");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiFn]);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return { data, loading, error, execute, reset, setData };
}

/**
 * Hook for fetching data on mount
 */
export function useFetch(apiFn, deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refetch = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiFn(...args);
            setData(result);
            return result;
        } catch (err) {
            setError(err.message || "An error occurred");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiFn]);

    // Auto-fetch on mount
    useState(() => {
        refetch();
    });

    return { data, loading, error, refetch, setData };
}

/**
 * Hook for mutation operations (create, update, delete)
 */
export function useMutation(apiFn, options = {}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mutate = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiFn(...args);
            if (options.onSuccess) {
                options.onSuccess(result);
            }
            return result;
        } catch (err) {
            setError(err.message || "An error occurred");
            if (options.onError) {
                options.onError(err);
            }
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiFn, options]);

    return { mutate, loading, error };
}
