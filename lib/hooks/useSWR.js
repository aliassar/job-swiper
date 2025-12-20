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
import { useJobs } from '@/context/JobContext';

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

/**
 * Hook to fetch saved jobs with offline fallback
 */
export function useSavedJobs(search = '') {
  const { isOnline } = useOnlineStatus();
  const { savedJobs: cachedSavedJobs } = useJobs();
  const key = search ? `/api/saved?search=${search}` : '/api/saved';

  const { data, error, isLoading, mutate } = useSWR(
    isOnline ? key : null,
    () => savedJobsApi.getSaveds(search),
    getOfflineAwareConfig(isOnline)
  );

  const savedJobs = isOnline && data?.saveds ? data.saveds : cachedSavedJobs || [];

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
 */
export function useApplications(search = '') {
  const { isOnline } = useOnlineStatus();
  const { applications: cachedApplications } = useJobs();
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
  const { skippedJobs: cachedSkippedJobs } = useJobs();
  const key = search ? `/api/jobs/skipped?search=${search}` : '/api/jobs/skipped';

  const { data, error, isLoading, mutate } = useSWR(
    isOnline ? key : null,
    () => jobsApi.getSkippedJobs(search),
    getOfflineAwareConfig(isOnline)
  );

  const skippedJobs = isOnline && data?.jobs ? data.jobs : cachedSkippedJobs || [];

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
  const { reportedJobs: cachedReportedJobs } = useJobs();
  const key = search ? `/api/reported?search=${search}` : '/api/reported';

  const { data, error, isLoading, mutate } = useSWR(
    isOnline ? key : null,
    () => reportedApi.getReportedJobs(search),
    getOfflineAwareConfig(isOnline)
  );

  const reportedJobs = isOnline && data?.reportedJobs ? data.reportedJobs : cachedReportedJobs || [];

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
 */
export function useSavedJobsInfinite(search = '') {
  const { isOnline } = useOnlineStatus();
  const { savedJobs: cachedSavedJobs } = useJobs();

  const getKey = (pageIndex, previousPageData) => {
    if (!isOnline) return null;
    if (previousPageData && !previousPageData.hasMore) return null;
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return `/api/saved?page=${pageIndex}&limit=${ITEMS_PER_PAGE}${searchParam}`;
  };

  const { data, error, size, setSize, isLoading, mutate } = useSWRInfinite(
    getKey,
    (url) => fetch(url).then(r => r.json()),
    getOfflineAwareConfig(isOnline)
  );

  const savedJobs = isOnline && data ? data.flatMap(page => page.saveds || []) : cachedSavedJobs || [];
  const hasMore = isOnline && data ? data[data.length - 1]?.hasMore : false;
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
export function useApplicationsInfinite(search = '') {
  const { isOnline } = useOnlineStatus();
  const { applications: cachedApplications } = useJobs();

  const getKey = (pageIndex, previousPageData) => {
    if (!isOnline) return null;
    if (previousPageData && !previousPageData.hasMore) return null;
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return `/api/applications?page=${pageIndex}&limit=${ITEMS_PER_PAGE}${searchParam}`;
  };

  const { data, error, size, setSize, isLoading, mutate } = useSWRInfinite(
    getKey,
    (url) => fetch(url).then(r => r.json()),
    getOfflineAwareConfig(isOnline)
  );

  const applications = isOnline && data ? data.flatMap(page => page.applications || []) : cachedApplications || [];
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
  const { skippedJobs: cachedSkippedJobs } = useJobs();

  const getKey = (pageIndex, previousPageData) => {
    if (!isOnline) return null;
    if (previousPageData && !previousPageData.hasMore) return null;
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return `/api/jobs/skipped?page=${pageIndex}&limit=${ITEMS_PER_PAGE}${searchParam}`;
  };

  const { data, error, size, setSize, isLoading, mutate } = useSWRInfinite(
    getKey,
    (url) => fetch(url).then(r => r.json()),
    getOfflineAwareConfig(isOnline)
  );

  const skippedJobs = isOnline && data ? data.flatMap(page => page.jobs || []) : cachedSkippedJobs || [];
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
  const { reportedJobs: cachedReportedJobs } = useJobs();

  const getKey = (pageIndex, previousPageData) => {
    if (!isOnline) return null;
    if (previousPageData && !previousPageData.hasMore) return null;
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return `/api/reported?page=${pageIndex}&limit=${ITEMS_PER_PAGE}${searchParam}`;
  };

  const { data, error, size, setSize, isLoading, mutate } = useSWRInfinite(
    getKey,
    (url) => fetch(url).then(r => r.json()),
    getOfflineAwareConfig(isOnline)
  );

  const reportedJobs = isOnline && data ? data.flatMap(page => page.reportedJobs || []) : cachedReportedJobs || [];
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
