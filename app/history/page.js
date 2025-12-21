'use client';

import { useState, useCallback, useEffect } from 'react';
import SearchInput from '@/components/SearchInput';
import { applicationsApi } from '@/lib/api';

export default function HistoryPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Fetch applications with pagination and filters
  const fetchApplications = useCallback(async (pageNum = 0, search = '', stage = 'all') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '20');
      if (search) params.append('search', search);
      if (stage !== 'all') params.append('stage', stage);

      const data = await applicationsApi.getApplications(search);

      if (pageNum === 0) {
        setApplications(data.items || []);
      } else {
        setApplications(prev => [...prev, ...(data.applications || [])]);
      }

      setHasMore(data.hasMore || false);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchApplications(0, searchQuery, stageFilter);
  }, [searchQuery, stageFilter, fetchApplications]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setPage(0);
  }, []);

  const handleStageFilter = useCallback((stage) => {
    setStageFilter(stage);
    setPage(0);
  }, []);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchApplications(nextPage, searchQuery, stageFilter);
  }, [page, searchQuery, stageFilter, fetchApplications]);

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const headers = ['Date', 'Job Title', 'Company', 'Location', 'Stage'];
    const rows = applications.map(app => [
      new Date(app.appliedAt).toLocaleDateString(),
      app.position,
      app.company,
      app.location,
      app.stage,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `application-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [applications]);

  // Export to PDF (simple text-based approach)
  const handleExportPDF = useCallback(() => {
    // For a real implementation, you'd use a library like jsPDF
    // This is a simplified version that opens a print dialog
    const printContent = `
      <html>
        <head>
          <title>Application History</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Application History</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Job Title</th>
                <th>Company</th>
                <th>Location</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              ${applications.map(app => `
                <tr>
                  <td>${new Date(app.appliedAt).toLocaleDateString()}</td>
                  <td>${app.position}</td>
                  <td>${app.company}</td>
                  <td>${app.location}</td>
                  <td>${app.stage}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }, [applications]);

  const getStageColor = (stage) => {
    switch (stage) {
      case 'applied': return 'bg-blue-100 text-blue-700';
      case 'screening': return 'bg-purple-100 text-purple-700';
      case 'interview': return 'bg-yellow-100 text-yellow-700';
      case 'offer': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'accepted': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-full p-4 pb-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Application History
          </h2>
          <p className="text-sm text-gray-600">
            Track and manage all your job applications
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 space-y-3">
          <SearchInput
            placeholder="Search by company, position, or location..."
            onSearch={handleSearch}
          />

          {/* Filter and Export Controls */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Stage Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Stage:</label>
              <select
                value={stageFilter}
                onChange={(e) => handleStageFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Stages</option>
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Export Buttons */}
            {applications.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Export PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        {!loading && applications.length > 0 && (
          <p className="text-sm text-gray-600 mb-3">
            Showing {applications.length} of {total} application{total !== 1 ? 's' : ''}
          </p>
        )}

        {/* Loading State */}
        {loading && page === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading applications...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && applications.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No applications yet</h2>
            <p className="text-gray-600">
              Start swiping on jobs to build your application history.
            </p>
          </div>
        )}

        {/* Applications Table - Mobile optimized */}
        {!loading && applications.length > 0 && (
          <div className="space-y-3">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(app.appliedAt)}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {app.position}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {app.company}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(app.stage)}`}>
                          {app.stage}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => window.location.href = `/application/${app.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {app.position}
                      </h3>
                      <p className="text-sm text-gray-600">{app.company}</p>
                    </div>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStageColor(app.stage)}`}>
                      {app.stage}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {formatDate(app.appliedAt)}
                    </span>
                    <button
                      onClick={() => window.location.href = `/application/${app.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
