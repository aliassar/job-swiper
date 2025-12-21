import { fetchApplications } from '@/lib/serverApi';
import ApplicationsClient from '@/components/ApplicationsClient';

/**
 * Applications Page - Server Component
 * Pre-fetches initial data on the server for faster First Contentful Paint
 */
export default async function ApplicationsPage() {
  // Fetch initial data on the server
  const initialData = await fetchApplications('', 1, 20);

  // Pass to client component for interactivity
  return <ApplicationsClient initialData={initialData} />;
}
