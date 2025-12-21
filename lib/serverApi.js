/**
 * Server-side API utilities for fetching data in server components
 * These functions are used to pre-fetch data before sending to client
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Fetch saved jobs from server (no auth required for initial load)
 * Client will revalidate with proper auth on mount
 */
export async function fetchSavedJobs(search = '', page = 1, limit = 20) {
    try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);

        const response = await fetch(`${API_URL}/api/saved?${params}`, {
            cache: 'no-store', // Always fetch fresh
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) return { items: [], total: 0 };

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Server fetch saved jobs error:', error);
        return { items: [], total: 0 };
    }
}

/**
 * Fetch applications from server
 */
export async function fetchApplications(search = '', page = 1, limit = 20) {
    try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);

        const response = await fetch(`${API_URL}/api/applications?${params}`, {
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) return { items: [], total: 0 };

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Server fetch applications error:', error);
        return { items: [], total: 0 };
    }
}

/**
 * Fetch skipped jobs from server
 */
export async function fetchSkippedJobs(search = '', page = 1, limit = 20) {
    try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);

        const response = await fetch(`${API_URL}/api/skipped?${params}`, {
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) return { items: [], total: 0 };

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Server fetch skipped jobs error:', error);
        return { items: [], total: 0 };
    }
}

/**
 * Fetch reported jobs from server
 */
export async function fetchReportedJobs(search = '', page = 1, limit = 20) {
    try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);

        const response = await fetch(`${API_URL}/api/reported?${params}`, {
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) return { items: [], total: 0 };

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Server fetch reported jobs error:', error);
        return { items: [], total: 0 };
    }
}
