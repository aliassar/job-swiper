'use client';

import { useState } from 'react';
import { useJobs } from '@/context/JobContext';
import StatusBadge from './StatusBadge';

export default function JobStatusList() {
  const { history, updateJobStatus } = useJobs();
  const [expandedJobId, setExpandedJobId] = useState(null);

  // Filter only accepted jobs
  const acceptedJobs = history.filter(job => job.action === 'accepted');

  if (acceptedJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No applications yet</h2>
        <p className="text-gray-600">
          Jobs you accept will appear here so you can track their status.
        </p>
      </div>
    );
  }

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const handleStatusChange = (jobId, newStatus) => {
    updateJobStatus(jobId, newStatus);
    setExpandedJobId(null);
  };

  const statusOptions = [
    { value: 'applied', label: 'Applied' },
    { value: 'in_review', label: 'In Review' },
    { value: 'interview', label: 'Interview Scheduled' },
    { value: 'offer', label: 'Offer Received' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected_by_company', label: 'Rejected by Company' },
  ];

  // Group by status
  const groupedJobs = acceptedJobs.reduce((acc, job) => {
    const status = job.status || 'applied';
    if (!acc[status]) acc[status] = [];
    acc[status].push(job);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {statusOptions.map(({ value, label }) => {
        const jobs = groupedJobs[value] || [];
        if (jobs.length === 0) return null;

        return (
          <div key={value}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              {label}
              <span className="bg-gray-200 text-gray-700 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {jobs.length}
              </span>
            </h3>
            
            <div className="space-y-3">
              {jobs.map((job) => {
                const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&size=60&background=0D8ABC&color=fff&bold=true`;
                const isExpanded = expandedJobId === job.id;
                
                return (
                  <div 
                    key={job.id}
                    className="bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <img 
                        src={logoUrl}
                        alt={`${job.company} logo`}
                        className="w-14 h-14 rounded-xl flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {job.position}
                            </h4>
                            <p className="text-sm text-gray-600 truncate">{job.company}</p>
                            <p className="text-xs text-gray-500 mt-1">{job.location}</p>
                          </div>
                          
                          <StatusBadge status={job.status || 'applied'} />
                        </div>
                        
                        <p className="text-xs text-gray-400 mb-2">
                          Applied {getRelativeTime(job.timestamp)}
                        </p>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            {isExpanded ? 'Cancel' : 'Update Status'}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-700 mb-2">Change status to:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {statusOptions.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => handleStatusChange(job.id, option.value)}
                                  disabled={option.value === (job.status || 'applied')}
                                  className={`text-xs py-2 px-3 rounded-lg font-medium transition-colors ${
                                    option.value === (job.status || 'applied')
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                              +{job.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
