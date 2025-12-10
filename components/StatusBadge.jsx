/**
 * StatusBadge Component
 * Displays a colored badge for job application status
 */
export default function StatusBadge({ status }) {
  const statusConfig = {
    applied: {
      label: 'Applied',
      color: 'bg-blue-100 text-blue-800',
    },
    in_review: {
      label: 'In Review',
      color: 'bg-yellow-100 text-yellow-800',
    },
    interview: {
      label: 'Interview Scheduled',
      color: 'bg-purple-100 text-purple-800',
    },
    offer: {
      label: 'Offer Received',
      color: 'bg-green-100 text-green-800',
    },
    hired: {
      label: 'Hired',
      color: 'bg-emerald-100 text-emerald-800',
    },
    rejected_by_company: {
      label: 'Rejected',
      color: 'bg-red-100 text-red-800',
    },
  };

  const config = statusConfig[status] || statusConfig.applied;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
}
