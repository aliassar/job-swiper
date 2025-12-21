import { fetchSavedJobs } from '@/lib/serverApi';
import SavedJobsClient from '@/components/SavedJobsClient';

/**
 * Saved Jobs Page - Server Component
 * Pre-fetches initial data on the server for faster First Contentful Paint
 */
export default async function SavedJobsPage() {
  // Fetch initial data on the server
  const initialData = await fetchSavedJobs('', 1, 20);

  // Pass to client component for interactivity
  return <SavedJobsClient initialData={initialData} />;
}
