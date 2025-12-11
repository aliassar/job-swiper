'use client';

import { useJobs } from '@/context/JobContext';
import { usePathname } from 'next/navigation';
import HamburgerMenu from './HamburgerMenu';

export default function AppHeader() {
  const { remainingJobs } = useJobs();
  const pathname = usePathname();
  
  // Only show jobs counter on the home page (swipe page)
  const showJobsCounter = pathname === '/';

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white shadow-sm z-50 flex items-center justify-between px-4">
      <div className="flex-1">
        {showJobsCounter && (
          <span className="text-xs text-gray-500 font-medium">
            {remainingJobs} {remainingJobs === 1 ? 'job' : 'jobs'} remaining
          </span>
        )}
      </div>
      <HamburgerMenu />
    </header>
  );
}
