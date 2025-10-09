"use client";

import { useState, useEffect, useCallback } from "react";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: string) => void;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: unknown[] = [],
  options: UseApiOptions = {}
): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { immediate = true, onSuccess, onError } = options;

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
      onSuccess?.(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setState({ data: null, loading: false, error: errorMessage });
      onError?.(errorMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiCall, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, immediate, ...dependencies]);

  return {
    ...state,
    refetch: execute,
  };
}

// Custom hook for paginated data
interface UsePaginatedApiOptions extends UseApiOptions {
  pageSize?: number;
}

export function usePaginatedApi<T>(
  apiCall: (page: number, limit: number, search?: string) => Promise<{
    data: T[];
    total: number;
    page: number;
    totalPages: number;
  }>,
  options: UsePaginatedApiOptions = {}
) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  
  const { pageSize = 20, ...apiOptions } = options;

  const apiCallWithParams = useCallback(
    () => apiCall(page, pageSize, search),
    [apiCall, page, pageSize, search]
  );

  const apiState = useApi(apiCallWithParams, [], {
    ...apiOptions,
    onSuccess: (data: unknown) => {
      const typedData = data as {
        data: T[];
        total: number;
        page: number;
        totalPages: number;
      };
      setTotalPages(typedData.totalPages);
      setTotal(typedData.total);
      apiOptions.onSuccess?.(data);
    },
  });

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setSearch(term);
    setPage(1); // Reset to first page when searching
  }, []);

  return {
    ...apiState,
    page,
    totalPages,
    total,
    goToPage,
    setSearchTerm,
    search,
  };
}

// Error handling utilities
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  
  return "An unexpected error occurred";
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("fetch") || 
           error.message.includes("network") ||
           error.message.includes("Failed to fetch");
  }
  return false;
}

export function isServerError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("500") || 
           error.message.includes("Internal Server Error");
  }
  return false;
}
