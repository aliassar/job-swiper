import ApplicationDetailClient from '@/components/ApplicationDetailClient';

export default async function ApplicationDetailPage({ params }) {
    const { id } = await params;
    return <ApplicationDetailClient applicationId={id} />;
}
