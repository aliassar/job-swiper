/**
 * Custom SWR hooks for data fetching in Job Swiper
 * Uses stale-while-revalidate pattern for optimal UX
 */

import useSWR from 'swr';
import { favoritesApi, applicationsApi, reportedApi, jobsApi } from '@/lib/api';

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
  const key = search ? `/api/favorites?search=${search}` : '/api/favorites';
  
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => favoritesApi.getFavorites(search),
    swrConfig
  );

  return {
    savedJobs: data?.favorites || [],
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

  return {
    applications: data?.applications || [],
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
