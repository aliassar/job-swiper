/**
 * Custom SWR hooks for data fetching in Job Swiper
 * Uses stale-while-revalidate pattern for optimal UX
 * Includes offline fallback using IndexedDB cached data
 */

import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { savedJobsApi, applicationsApi, reportedApi, jobsApi } from '@/lib/api';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { useOnlineStatus } from './useOnlineStatus';
import { getIndexedDBStore } from '@/lib/indexedDB';
import http from '@/lib/http';
import { useEffect, useState } from 'react';

// SWR configuration with sensible defaults
const swrConfig = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  focusThrottleInterval: 5000,
};

// Offline-aware SWR config - don't retry when offline
const getOfflineAwareConfig = (isOnline) => ({
  ...swrConfig,
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    if (error?.status >= 400 && error?.status < 500) return;
    if (retryCount >= 3) return;
    setTimeout(() => revalidate({ retryCount }), 5000);
  },
  revalidateOnFocus: isOnline,
  revalidateOnReconnect: true,
});

// Cache keys for IndexedDB
const CACHE_KEYS = {
  savedJobs: 'swr_cache_saved_jobs',
  applications: 'swr_cache_applications',
  skippedJobs: 'swr_cache_skipped_jobs',
  reportedJobs: 'swr_cache_reported_jobs',
};

/**
 * Hook to get cached data from IndexedDB
 */
function useCachedData(cacheKey) {
  const [cached, setCached] = useState([]);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const store = getIndexedDBStore();
        const data = await store.get(cacheKey);
        if (data) setCached(data);
      } catch (e) {
        console.error('Error loading cache:', e);
      }
    };
    loadCache();
  }, [cacheKey]);

  return cached;
}

/**
 * Hook to save data to IndexedDB cache
 */
function useSaveToCache(cacheKey, data) {
  useEffect(() => {
    if (data && data.length > 0) {
      const store = getIndexedDBStore();
      store.set(cacheKey, data).catch(e => console.error('Error saving cache:', e));
    }
  }, [cacheKey, data]);
}

/**
 * Hook to fetch saved jobs with offline fallback
 */
export function useSavedJobs(search = '') {
  const { isOnline } = useOnlineStatus();
  const cachedSavedJobs = useCachedData(CACHE_KEYS.savedJobs);
  const key = search ? `/api/saved?search=${search}` : '/api/saved';

  const { data, error, isLoading, mutate } = useSWR(
    isOnline ? key : null,
    () => savedJobsApi.getSaveds(search),
    getOfflineAwareConfig(isOnline)
  );

  const savedJobs = isOnline && data?.saveds ? data.saveds :
    isOnline && data?.items ? data.items :
      cachedSavedJobs || [];

  // Cache the data for offline use
  useSaveToCache(CACHE_KEYS.savedJobs, isOnline && data ? (data.saveds || data.items) : null);

  return {
    savedJobs,
    isLoading: isOnline ? isLoading : false,
    isError: error,
    isOffline: !isOnline,
    mutate,
  };
}

/**
 * Hook to fetch applications with offline fallback
 * @param {string} search - Search query
 * @param {object} options - Options including fallbackData for server-rendered initial data
 */
export function useApplications(search = '', options = {}) {
  const { isOnline } = useOnlineStatus();
  const cachedApplications = useCachedData(CACHE_KEYS.applications);
  const key = search ? `/api/applications?search=${search}` : '/api/applications';

  const { data, error, isLoading, mutate } = useSWR(
    isOnline ? key : null,
    () => applicationsApi.getApplications(search),
    getOfflineAwareConfig(isOnline)
  );

  let applications;
  if (isOnline && data?.items) {
    applications = data.items.map(app => ({
      ...app,
      company: app.job?.company || '',
      position: app.job?.position || '',
      location: app.job?.location || '',
      jobId: app.job?.id || app.jobId,
    }));
  } else {
    applications = cachedApplications || [];
  }

  // Cache the data for offline use
  useSaveToCache(CACHE_KEYS.applications, applications.length > 0 ? applications : null);

  return {
    applications,
    isLoading: isOnline ? isLoading : false,
    isError: error,
    isOffline: !isOnline,
    mutate,
  };
}

/**
 * Hook to fetch skipped jobs with offline fallback
 */
export function useSkippedJobs(search = '') {
  const { isOnline } = useOnlineStatus();
  const cachedSkippedJobs = useCachedData(CACHE_KEYS.skippedJobs);
  const key = search ? `/api/jobs/skipped?search=${search}` : '/api/jobs/skipped';

  const { data, error, isLoading, mutate } = useSWR(
    isOnline ? key : null,
    () => jobsApi.getSkippedJobs(search),
    getOfflineAwareConfig(isOnline)
  );

  const skippedJobs = isOnline && data?.jobs ? data.jobs :
    isOnline && data?.items ? data.items :
      cachedSkippedJobs || [];

  // Cache the data for offline use
  useSaveToCache(CACHE_KEYS.skippedJobs, isOnline && data ? (data.jobs || data.items) : null);

  return {
    skippedJobs,
    isLoading: isOnline ? isLoading : false,
    isError: error,
    isOffline: !isOnline,
    mutate,
  };
}

/**
 * Hook to fetch reported jobs with offline fallback
 */
export function useReportedJobs(search = '') {
  const { isOnline } = useOnlineStatus();
  const cachedReportedJobs = useCachedData(CACHE_KEYS.reportedJobs);
  const key = search ? `/api/reported?search=${search}` : '/api/reported';

  const { data, error, isLoading, mutate } = useSWR(
    isOnline ? key : null,
    () => reportedApi.getReportedJobs(search),
    getOfflineAwareConfig(isOnline)
  );

  const reportedJobs = isOnline && data?.reportedJobs ? data.reportedJobs : cachedReportedJobs || [];

  // Cache the data for offline use
  useSaveToCache(CACHE_KEYS.reportedJobs, isOnline && data?.reportedJobs ? data.reportedJobs : null);

  return {
    reportedJobs,
    isLoading: isOnline ? isLoading : false,
    isError: error,
    isOffline: !isOnline,
    mutate,
  };
}

/**
 * Infinite scroll hook for saved jobs with offline fallback
 * @param {string} search - Search query
 * @param {object} options - Options including fallbackData for server-rendered initial data
 */
export function useSavedJobsInfinite(search = '', options = {}) {
  const { isOnline } = useOnlineStatus();
  const cachedSavedJobs = useCachedData(CACHE_KEYS.savedJobs);

  const getKey = (pageIndex, previousPageData) => {
    if (!isOnline) return null;
    if (previousPageData && !previousPageData.hasMore) return null;
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return `/api/saved?page=${pageIndex + 1}&limit=${ITEMS_PER_PAGE}${searchParam}`;
  };

  const { data, error, size, setSize, isLoading, mutate } = useSWRInfinite(
    getKey,
    (url) => http.get(url).then(res => res.data || res),
    {
      ...getOfflineAwareConfig(isOnline),
      fallbackData: options.fallbackData,
    }
  );

  let savedJobs;
  if (isOnline && data) {
    savedJobs = data.flatMap(page => page.items || []);
  } else {
    savedJobs = cachedSavedJobs || [];
  }

  // Cache the data for offline use
  useSaveToCache(CACHE_KEYS.savedJobs, savedJobs.length > 0 ? savedJobs : null);

  const hasMore = isOnline && data ? data[data.length - 1]?.pagination?.page < data[data.length - 1]?.pagination?.totalPages : false;
  const isLoadingMore = isOnline && (isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined'));

  return {
    savedJobs,
    isLoading: isOnline ? isLoading : false,
    isLoadingMore,
    isError: error,
    isOffline: !isOnline,
    hasMore,
    loadMore: () => isOnline && setSize(size + 1),
    mutate,
  };
}

/**
 * Infinite scroll hook for applications with offline fallback
 */
export function useApplicationsInfinite(search = '', { stage = '', sort = '' } = {}) {
  const { isOnline } = useOnlineStatus();
  const cachedApplications = useCachedData(CACHE_KEYS.applications);

  const getKey = (pageIndex, previousPageData) => {
    if (!isOnline) return null;
    if (previousPageData && !previousPageData.hasMore) return null;
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    const stageParam = stage ? `&stage=${encodeURIComponent(stage)}` : '';
    const sortParam = sort ? `&sort=${encodeURIComponent(sort)}` : '';
    return `/api/applications?page=${pageIndex + 1}&limit=${ITEMS_PER_PAGE}${searchParam}${stageParam}${sortParam}`;
  };

  const { data, error, size, setSize, isLoading, mutate } = useSWRInfinite(
    getKey,
    (url) => http.get(url).then(res => res.data || res),
    getOfflineAwareConfig(isOnline)
  );

  const applications = isOnline && data ? data.flatMap(page => page.items || page.applications || []) : cachedApplications || [];

  // Cache the data for offline use
  useSaveToCache(CACHE_KEYS.applications, applications.length > 0 ? applications : null);

  const hasMore = isOnline && data ? data[data.length - 1]?.hasMore : false;
  const isLoadingMore = isOnline && (isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined'));

  return {
    applications,
    isLoading: isOnline ? isLoading : false,
    isLoadingMore,
    isError: error,
    isOffline: !isOnline,
    hasMore,
    loadMore: () => isOnline && setSize(size + 1),
    mutate,
  };
}

/**
 * Infinite scroll hook for skipped jobs with offline fallback
 */
export function useSkippedJobsInfinite(search = '') {
  const { isOnline } = useOnlineStatus();
  const cachedSkippedJobs = useCachedData(CACHE_KEYS.skippedJobs);

  const getKey = (pageIndex, previousPageData) => {
    if (!isOnline) return null;
    if (previousPageData && !previousPageData.hasMore) return null;
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return `/api/jobs/skipped?page=${pageIndex + 1}&limit=${ITEMS_PER_PAGE}${searchParam}`;
  };

  const { data, error, size, setSize, isLoading, mutate } = useSWRInfinite(
    getKey,
    (url) => http.get(url).then(res => res.data || res),
    getOfflineAwareConfig(isOnline)
  );

  const skippedJobs = isOnline && data ? data.flatMap(page => page.jobs || page.items || []) : cachedSkippedJobs || [];

  // Cache the data for offline use
  useSaveToCache(CACHE_KEYS.skippedJobs, skippedJobs.length > 0 ? skippedJobs : null);

  const hasMore = isOnline && data ? data[data.length - 1]?.hasMore : false;
  const isLoadingMore = isOnline && (isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined'));

  return {
    skippedJobs,
    isLoading: isOnline ? isLoading : false,
    isLoadingMore,
    isError: error,
    isOffline: !isOnline,
    hasMore,
    loadMore: () => isOnline && setSize(size + 1),
    mutate,
  };
}

/**
 * Infinite scroll hook for reported jobs with offline fallback
 */
export function useReportedJobsInfinite(search = '') {
  const { isOnline } = useOnlineStatus();
  const cachedReportedJobs = useCachedData(CACHE_KEYS.reportedJobs);

  const getKey = (pageIndex, previousPageData) => {
    if (!isOnline) return null;
    if (previousPageData && !previousPageData.hasMore) return null;
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return `/api/reported?page=${pageIndex + 1}&limit=${ITEMS_PER_PAGE}${searchParam}`;
  };

  const { data, error, size, setSize, isLoading, mutate } = useSWRInfinite(
    getKey,
    (url) => http.get(url).then(res => res.data || res),
    getOfflineAwareConfig(isOnline)
  );

  const reportedJobs = isOnline && data ? data.flatMap(page => page.reportedJobs || []) : cachedReportedJobs || [];

  // Cache the data for offline use
  useSaveToCache(CACHE_KEYS.reportedJobs, reportedJobs.length > 0 ? reportedJobs : null);

  const hasMore = isOnline && data ? data[data.length - 1]?.hasMore : false;
  const isLoadingMore = isOnline && (isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined'));

  return {
    reportedJobs,
    isLoading: isOnline ? isLoading : false,
    isLoadingMore,
    isError: error,
    isOffline: !isOnline,
    hasMore,
    loadMore: () => isOnline && setSize(size + 1),
    mutate,
  };
}

/**
 * Hook for updating application stage with optimistic updates
 */
export function useUpdateApplicationStage() {
  const updateStage = async (applicationId, stage, mutate) => {
    try {
      await applicationsApi.updateStage(applicationId, stage);
      // Revalidate applications data
      if (mutate) mutate();
      return true;
    } catch (error) {
      console.error('Error updating stage:', error);
      return false;
    }
  };

  return { updateStage };
}

/**
 * Hook to fetch blocked companies with offline fallback
 */
export function useBlockedCompanies() {
  const { isOnline } = useOnlineStatus();
  const key = '/api/blocked-companies';

  const { data, error, isLoading, mutate } = useSWR(
    isOnline ? key : null,
    () => http.get(key).then(res => res.data || res),
    getOfflineAwareConfig(isOnline)
  );

  const blockedCompanies = isOnline && data?.blockedCompanies ? data.blockedCompanies : [];

  return {
    blockedCompanies,
    isLoading: isOnline ? isLoading : false,
    isError: error,
    isOffline: !isOnline,
    mutate,
  };
}
