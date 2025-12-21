/**
 * SWR hook for fetching jobs to swipe on
 * Used by the main swipe page
 */

import useSWRInfinite from 'swr/infinite';
import { jobsApi } from '@/lib/api';
import { useOnlineStatus } from './useOnlineStatus';
import http from '@/lib/http';

const JOBS_PER_PAGE = 20;

// SWR configuration
const swrConfig = {
    revalidateOnFocus: false, // Don't refetch when tab gains focus (would reset swipe position)
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;
        if (error?.status >= 400 && error?.status < 500) return;
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount }), 5000);
    },
};

/**
 * Hook to fetch swipeable jobs with infinite loading
 * Returns jobs array starting from the current swipe index
 */
export function useSwipeJobs(currentIndex = 0) {
    const { isOnline } = useOnlineStatus();

    const getKey = (pageIndex, previousPageData) => {
        // Don't fetch if offline
        if (!isOnline) return null;
        // Reached the end
        if (previousPageData && !previousPageData.pagination?.hasMore) return null;
        return `/api/jobs?page=${pageIndex + 1}&limit=${JOBS_PER_PAGE}`;
    };

    const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite(
        getKey,
        (url) => http.get(url).then(res => res.data || res),
        swrConfig
    );

    // Flatten all pages into a single array
    const allJobs = data ? data.flatMap(page => page.jobs || []) : [];

    // Get the current job based on index
    const currentJob = allJobs[currentIndex] || null;

    // Calculate remaining jobs
    const remainingJobs = allJobs.length - currentIndex;

    // Check if there are more jobs to load from server
    const hasMore = data ? data[data.length - 1]?.pagination?.hasMore : true;

    // Get total count from server
    const totalCount = data?.[0]?.pagination?.total || allJobs.length;

    // Auto-load more jobs when approaching the end
    const loadMore = () => {
        if (hasMore && !isValidating) {
            setSize(size + 1);
        }
    };

    // Check if we need to prefetch more jobs
    const shouldPrefetch = remainingJobs <= 5 && hasMore && !isValidating;

    return {
        jobs: allJobs,
        currentJob,
        currentIndex,
        remainingJobs,
        totalCount,
        hasMore,
        isLoading: isOnline ? isLoading : false,
        isValidating,
        isOffline: !isOnline,
        isError: error,
        loadMore,
        shouldPrefetch,
        mutate,
    };
}

/**
 * Hook to fetch a single job by ID
 */
export function useJob(jobId) {
    const { isOnline } = useOnlineStatus();

    const { data, error, isLoading, mutate } = useSWRInfinite(
        isOnline && jobId ? `/api/jobs/${jobId}` : null,
        () => jobsApi.getJob ? jobsApi.getJob(jobId) : http.get(`/api/jobs/${jobId}`),
        {
            ...swrConfig,
            revalidateOnFocus: true,
        }
    );

    return {
        job: data,
        isLoading: isOnline ? isLoading : false,
        isOffline: !isOnline,
        isError: error,
        mutate,
    };
}
