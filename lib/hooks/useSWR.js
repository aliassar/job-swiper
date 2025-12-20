/**
 * Custom SWR hooks for data fetching in Job Swiper
 * Uses stale-while-revalidate pattern for optimal UX
 */

import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { savedJobsApi, applicationsApi, reportedApi, jobsApi } from '@/lib/api';
import { ITEMS_PER_PAGE } from '@/lib/constants';

// SWR configuration with sensible defaults
const swrConfig = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000, // Prevent duplicate requests within 2s
  focusThrottleInterval: 5000, // Throttle revalidation on focus
};

/**
 * Hook to fetch saved jobs with search
 * @param {string} search - Search query
 */
export function useSavedJobs(search = '') {
  const key = search ? `/api/saved?search=${search}` : '/api/saved';

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => savedJobsApi.getSaveds(search),
    swrConfig
  );

  return {
    savedJobs: data?.saveds || [],
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch applications with search
 * @param {string} search - Search query
 */
export function useApplications(search = '') {
  const key = search ? `/api/applications?search=${search}` : '/api/applications';

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => applicationsApi.getApplications(search),
    swrConfig
  );

  // Transform server response format to what the UI expects
  // Server returns: { items: [{ id, stage, job: { company, position, location } }], pagination: {...} }
  // UI expects: [{ id, stage, company, position, location, ... }]
  const applications = (data?.items || []).map(app => ({
    ...app,
    // Flatten job properties for easier access in UI
    company: app.job?.company || '',
    position: app.job?.position || '',
    location: app.job?.location || '',
    jobId: app.job?.id || app.jobId,
  }));

  return {
    applications,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch skipped jobs with search
 * @param {string} search - Search query
 */
export function useSkippedJobs(search = '') {
  const key = search ? `/api/jobs/skipped?search=${search}` : '/api/jobs/skipped';

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => jobsApi.getSkippedJobs(search),
    swrConfig
  );

  return {
    skippedJobs: data?.jobs || [],
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch reported jobs with search
 * @param {string} search - Search query
 */
export function useReportedJobs(search = '') {
  const key = search ? `/api/reported?search=${search}` : '/api/reported';

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => reportedApi.getReportedJobs(search),
    swrConfig
  );

  return {
    reportedJobs: data?.reportedJobs || [],
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Feature 24: Infinite scroll hook for saved jobs
 * @param {string} search - Search query
 */
export function useSavedJobsInfinite(search = '') {
  const getKey = (pageIndex, previousPageData) => {
    // Reached the end
    if (previousPageData && !previousPageData.hasMore) return null;

    // First page
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return `/api/saved?page=${pageIndex}&limit=${ITEMS_PER_PAGE}${searchParam}`;
  };

  const { data, error, size, setSize, isLoading, mutate } = useSWRInfinite(
    getKey,
    (url) => fetch(url).then(r => r.json()),
    swrConfig
  );

  const savedJobs = data ? data.flatMap(page => page.saveds) : [];
  const hasMore = data ? data[data.length - 1]?.hasMore : false;
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');

  return {
    savedJobs,
    isLoading,
    isLoadingMore,
    isError: error,
    hasMore,
    loadMore: () => setSize(size + 1),
    mutate,
  };
}

/**
 * Feature 24: Infinite scroll hook for applications
 * @param {string} search - Search query
 */
export function useApplicationsInfinite(search = '') {
  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && !previousPageData.hasMore) return null;

    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return `/api/applications?page=${pageIndex}&limit=${ITEMS_PER_PAGE}${searchParam}`;
  };

  const { data, error, size, setSize, isLoading, mutate } = useSWRInfinite(
    getKey,
    (url) => fetch(url).then(r => r.json()),
    swrConfig
  );

  const applications = data ? data.flatMap(page => page.applications) : [];
  const hasMore = data ? data[data.length - 1]?.hasMore : false;
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');

  return {
    applications,
    isLoading,
    isLoadingMore,
    isError: error,
    hasMore,
    loadMore: () => setSize(size + 1),
    mutate,
  };
}

/**
 * Feature 24: Infinite scroll hook for skipped jobs
 * @param {string} search - Search query
 */
export function useSkippedJobsInfinite(search = '') {
  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && !previousPageData.hasMore) return null;

    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return `/api/jobs/skipped?page=${pageIndex}&limit=${ITEMS_PER_PAGE}${searchParam}`;
  };

  const { data, error, size, setSize, isLoading, mutate } = useSWRInfinite(
    getKey,
    (url) => fetch(url).then(r => r.json()),
    swrConfig
  );

  const skippedJobs = data ? data.flatMap(page => page.jobs) : [];
  const hasMore = data ? data[data.length - 1]?.hasMore : false;
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');

  return {
    skippedJobs,
    isLoading,
    isLoadingMore,
    isError: error,
    hasMore,
    loadMore: () => setSize(size + 1),
    mutate,
  };
}

/**
 * Feature 24: Infinite scroll hook for reported jobs
 * @param {string} search - Search query
 */
export function useReportedJobsInfinite(search = '') {
  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && !previousPageData.hasMore) return null;

    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return `/api/reported?page=${pageIndex}&limit=${ITEMS_PER_PAGE}${searchParam}`;
  };

  const { data, error, size, setSize, isLoading, mutate } = useSWRInfinite(
    getKey,
    (url) => fetch(url).then(r => r.json()),
    swrConfig
  );

  const reportedJobs = data ? data.flatMap(page => page.reportedJobs) : [];
  const hasMore = data ? data[data.length - 1]?.hasMore : false;
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');

  return {
    reportedJobs,
    isLoading,
    isLoadingMore,
    isError: error,
    hasMore,
    loadMore: () => setSize(size + 1),
    mutate,
  };
}
