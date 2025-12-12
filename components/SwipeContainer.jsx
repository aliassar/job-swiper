'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, useMotionValueEvent } from 'framer-motion';
import JobCard from './JobCard';
import FloatingActions from './FloatingActions';
import ReportModal from './ReportModal';
import { useJobs } from '@/context/JobContext';
import { ArrowUturnLeftIcon, WifiIcon } from '@heroicons/react/24/outline';

// Constants - optimized for better responsiveness
const SWIPE_THRESHOLD = 60; // Reduced from 130
const VELOCITY_THRESHOLD = 300; // New: for flick detection
const EXIT_ROTATION = 20; // Rotation angle for exit animation
const EXIT_PADDING = 200; // Extra distance beyond viewport to ensure card fully exits
const EXIT_FALLBACK = 800; // Fallback exit distance for SSR
const DRAG_CONSTRAINTS = { top: 0, bottom: 0, left: 0, right: 0 };

// Dynamic exit distance based on screen width
const getExitDistance = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth + EXIT_PADDING;
  }
  return EXIT_FALLBACK;
};

export default function SwipeContainer() {
  const { 
    currentJob, 
    jobs, 
    acceptJob, 
    rejectJob, 
    skipJob,
    toggleSaveJob,
    savedJobs,
    loading, 
    remainingJobs,
    sessionActions,
    rollbackLastAction,
    reportJob,
    fetchError,
    retryCount,
    manualRetry,
  } = useJobs();

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-EXIT_ROTATION, EXIT_ROTATION]);

  const [exit, setExit] = useState({ x: 0, y: 0 });
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [jobToReport, setJobToReport] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState(''); // '', 'swiping-right', or 'swiping-left'
  
  // Memoize exit distance to avoid repeated calculations
  const exitDistance = useMemo(() => getExitDistance(), []);

  // Track swipe direction for CSS class updates
  useMotionValueEvent(x, "change", (latest) => {
    if (latest > 20) {
      setSwipeDirection('swiping-right');
    } else if (latest < -20) {
      setSwipeDirection('swiping-left');
    } else {
      setSwipeDirection('');
    }
  });

  // Reset motion values when currentJob changes
  useEffect(() => {
    x.set(0);
    setExit({ x: 0, y: 0 });
    setSwipeDirection('');
  }, [currentJob, x]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ALL useCallback and useMemo hooks MUST be here, BEFORE any conditional returns
  const handleDragEnd = useCallback((_event, info) => {
    // Check for velocity-based swipes (flicks)
    const flickedRight = info.velocity.x > VELOCITY_THRESHOLD;
    const flickedLeft = info.velocity.x < -VELOCITY_THRESHOLD;
    const flickedUp = info.velocity.y < -VELOCITY_THRESHOLD;

    // Check for position-based swipes
    const draggedRight = info.offset.x > SWIPE_THRESHOLD;
    const draggedLeft = info.offset.x < -SWIPE_THRESHOLD;
    const draggedUp = info.offset.y < -SWIPE_THRESHOLD;

    if (draggedRight || flickedRight) {
      setExit({ x: exitDistance, y: 0 });
      acceptJob(currentJob);
      return;
    }

    if (draggedLeft || flickedLeft) {
      setExit({ x: -exitDistance, y: 0 });
      rejectJob(currentJob);
      return;
    }

    if (draggedUp || flickedUp) {
      setExit({ x: 0, y: -exitDistance });
      rejectJob(currentJob);
      return;
    }

    setExit({ x: 0, y: 0 }); // reset if not passed threshold
    setSwipeDirection(''); // reset swipe direction
  }, [currentJob, acceptJob, rejectJob, exitDistance]);

  const handleAccept = useCallback(() => {
    setExit({ x: exitDistance, y: 0 });
    acceptJob(currentJob);
  }, [currentJob, acceptJob, exitDistance]);

  const handleReject = useCallback(() => {
    setExit({ x: -exitDistance, y: 0 });
    rejectJob(currentJob);
  }, [currentJob, rejectJob, exitDistance]);

  const handleSkip = useCallback(() => {
    setExit({ x: 0, y: -exitDistance });
    skipJob(currentJob);
  }, [currentJob, skipJob, exitDistance]);

  const handleSaveJob = useCallback(() => {
    if (currentJob) {
      toggleSaveJob(currentJob);
    }
  }, [currentJob, toggleSaveJob]);

  const handleOpenReportModal = useCallback((job) => {
    setJobToReport(job);
    setReportModalOpen(true);
  }, []);

  const handleReport = useCallback((reason) => {
    if (jobToReport) {
      reportJob(jobToReport, reason);
    }
  }, [jobToReport, reportJob]);

  const currentIndex = jobs.indexOf(currentJob);
  const visibleJobs = useMemo(() => jobs.slice(currentIndex, currentIndex + 2), [jobs, currentIndex]);
  const isSaved = useMemo(() => currentJob ? savedJobs.some(saved => saved.id === currentJob.id) : false, [currentJob, savedJobs]);

  // Show error state with manual retry option
  if (fetchError && !loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-6 max-w-sm">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Jobs</h2>
          <p className="text-gray-600 mb-6">{fetchError.message}</p>
          
          {fetchError.canRetry && (
            <button
              onClick={manualRetry}
              className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors shadow-lg"
            >
              Try Again
            </button>
          )}
          
          {!isOnline && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm">
              <WifiIcon className="h-4 w-4" />
              <span>You're offline</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-6">
          {/* Animated loading spinner */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading jobs...</h2>
          <p className="text-sm text-gray-500">Finding the best opportunities for you</p>
          
          {/* Show retry count if retrying */}
          {retryCount > 0 && (
            <p className="text-xs text-gray-400 mt-2">Retry attempt {retryCount}/5</p>
          )}
          
          {/* Network status indicator */}
          {!isOnline && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm">
              <WifiIcon className="h-4 w-4" />
              <span>You're offline - will retry when connected</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentJob || remainingJobs === 0) {
    return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center px-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h2>
            <p className="text-gray-600">You've reviewed all available jobs.</p>
            <p className="text-sm text-gray-500 mt-2">Check back later for more opportunities!</p>
          </div>
        </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="relative h-full max-w-md mx-auto">
        
        {/* Small jobs remaining counter - top left */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium">
            {remainingJobs} {remainingJobs === 1 ? 'job' : 'jobs'}
          </div>
        </div>

        {/* Network status indicator when offline */}
        {!isOnline && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="bg-orange-500 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-lg">
              <WifiIcon className="h-3.5 w-3.5" />
              <span>Offline Mode</span>
            </div>
          </div>
        )}

        {/* Card stack container with padding for floating actions */}
        <div className="relative h-full px-4 pt-4 pb-28">
          <AnimatePresence mode="popLayout" onExitComplete={() => x.set(0)}>
            {visibleJobs.map((job, index) => {
              const isTopCard = index === 0;
              const scale = 1 - index * 0.05;
              const yOffset = index * 12;

              return (
                <motion.div
                  key={isTopCard ? job.id : `${job.id}-bottom`}
                  className={`absolute inset-0 ${isTopCard ? swipeDirection : ''}`}
                  style={
                    isTopCard
                      ? { 
                          x, 
                          rotate, 
                          zIndex: 10,
                          touchAction: 'none',
                          willChange: 'transform'
                        }
                      : {
                          scale,
                          y: yOffset,
                          pointerEvents: 'none',
                          zIndex: 10 - index,
                        }
                  }
                  drag={isTopCard}
                  dragElastic={0.8}
                  dragConstraints={DRAG_CONSTRAINTS}
                  onDragEnd={handleDragEnd}
                  initial={{ scale: 0.95 }}
                  animate={{ scale: isTopCard ? 1 : scale }}
                  exit={{
                    x: exit.x,
                    y: exit.y,
                    rotate: exit.x > 0 ? EXIT_ROTATION : exit.x < 0 ? -EXIT_ROTATION : 0,
                    transition: { duration: 0.5, ease: 'easeOut' }
                  }}
                  onAnimationComplete={() => {
                    if (isTopCard) {
                      x.set(0);
                      setExit({ x: 0, y: 0 });
                      setSwipeDirection('');
                    }
                  }}
                >
                  <JobCard 
                    job={job} 
                    onReportClick={() => handleOpenReportModal(job)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Floating action buttons */}
        <FloatingActions
          onReject={handleReject}
          onAccept={handleAccept}
          onSkip={handleSkip}
          onFavorite={handleSaveJob}
          isFavorite={isSaved}
          disabled={!currentJob}
        />

        {/* Rollback button - bottom right */}
        {sessionActions.length > 0 && (
          <button
            onClick={rollbackLastAction}
            className="fixed bottom-24 right-6 z-40 bg-gray-800 text-white rounded-full p-3 shadow-xl hover:scale-110 transition-transform active:scale-95 flex items-center gap-2"
            aria-label="Undo last action"
          >
            <ArrowUturnLeftIcon className="h-6 w-6" />
            <span className="text-sm font-medium pr-1">{sessionActions.length}</span>
          </button>
        )}

        {/* Report Modal */}
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          onReport={handleReport}
          job={jobToReport}
        />
      </div>
    </div>
  );
}
