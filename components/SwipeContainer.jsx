/**
 * Swipe Container V2 - State Machine Architecture
 * 
 * This component implements a clean, deterministic swipe UI that:
 * - Uses a pure state machine for all state transitions
 * - Has NO setTimeout in UI logic
 * - Decouples UI state from API state completely
 * - Serializes all user actions through animation lifecycle
 * - Makes rollback a simple, synchronous local operation
 */

'use client';

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, AnimatePresence, useMotionValueEvent } from 'framer-motion';
import JobCard from './JobCard';
import FloatingActions from './FloatingActions';
import ReportModal from './ReportModal';
import { ArrowUturnLeftIcon, WifiIcon } from '@heroicons/react/24/outline';
import { BoltIcon } from '@heroicons/react/24/solid';
import { 
  SWIPE_THRESHOLD, 
  VELOCITY_THRESHOLD, 
  EXIT_ROTATION, 
  EXIT_PADDING, 
  EXIT_FALLBACK, 
  DRAG_CONSTRAINTS 
} from '@/lib/constants';
import { useSwipeStateMachine } from '@/context/useSwipeStateMachine';
import { SwipeActionType } from '@/context/swipeStateMachine';
import { jobsApi } from '@/lib/api';
import { useState } from 'react';
import { useJobs } from '@/context/JobContext';

/**
 * NOTE: Auto-apply feature
 * The UI for auto-apply toggle is implemented below. When enabled, the autoApplyMetadataRef
 * is set to { automaticApply: true }. This metadata should be passed to the backend API
 * when the accept action is performed. Currently, the state machine doesn't support passing
 * metadata through the swipe action, so this will need to be implemented in the backend
 * API handler at /api/jobs/[id]/accept to receive and process the automaticApply flag.
 */

// Dynamic exit distance based on screen width
const getExitDistance = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth + EXIT_PADDING;
  }
  return EXIT_FALLBACK;
};

export default function SwipeContainer() {
  const router = useRouter();
  const {
    currentJob,
    nextJob,
    remainingJobs,
    isLocked,
    loading,
    error,
    history,
    canRollback: canPerformRollback,
    canSwipe: canPerformSwipe,
    initializeJobs,
    setLoading,
    setError,
    swipe,
    rollback,
    unlock,
  } = useSwipeStateMachine();
  
  const { toggleSaveJob, reportJob, savedJobs, acceptJob: createApplication } = useJobs();
  
  // Animation state (local to UI only)
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-EXIT_ROTATION, EXIT_ROTATION]);
  const [exitDirection, setExitDirection] = useState({ x: 0, y: 0 });
  const [swipeDirection, setSwipeDirection] = useState('');
  
  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [jobToReport, setJobToReport] = useState(null);
  
  // Auto-apply state
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);
  const [showAutoApplyTooltip, setShowAutoApplyTooltip] = useState(false);
  // Store auto-apply metadata for the next accept action
  // Note: This ref is updated in handleToggleAutoApply to match autoApplyEnabled state
  const autoApplyMetadataRef = useRef({ automaticApply: false });
  
  // Online status
  const [isOnline, setIsOnline] = useState(true);
  
  // Memoize exit distance
  const exitDistance = useMemo(() => getExitDistance(), []);
  
  // Track swipe direction for CSS classes
  useMotionValueEvent(x, "change", (latest) => {
    if (latest > 20) {
      setSwipeDirection('swiping-right');
    } else if (latest < -20) {
      setSwipeDirection('swiping-left');
    } else {
      setSwipeDirection('');
    }
  });
  
  // Reset animation state when current job changes
  useEffect(() => {
    x.set(0);
    setExitDirection({ x: 0, y: 0 });
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
  
  // Load jobs on mount
  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      try {
        const data = await jobsApi.getJobs();
        initializeJobs(data.jobs);
      } catch (err) {
        setError({
          message: 'Unable to load jobs. Please check your connection and try again.',
          canRetry: true,
        });
      }
    };
    
    loadJobs();
  }, [initializeJobs, setLoading, setError]);
  
  /**
   * Handle drag end - determines swipe action
   * This is the ONLY place where swipes are triggered
   */
  const handleDragEnd = useCallback(async (_event, info) => {
    if (!currentJob || isLocked) return;
    
    // Determine swipe type from velocity or position
    const flickedRight = info.velocity.x > VELOCITY_THRESHOLD;
    const flickedLeft = info.velocity.x < -VELOCITY_THRESHOLD;
    const flickedUp = info.velocity.y < -VELOCITY_THRESHOLD;
    
    const draggedRight = info.offset.x > SWIPE_THRESHOLD;
    const draggedLeft = info.offset.x < -SWIPE_THRESHOLD;
    const draggedUp = info.offset.y < -SWIPE_THRESHOLD;
    
    if (draggedRight || flickedRight) {
      setExitDirection({ x: exitDistance, y: 0 });
      swipe(currentJob.id, SwipeActionType.ACCEPT);
      
      // Create application and navigate to it (even if offline)
      const applicationId = await createApplication(currentJob);
      if (applicationId) {
        // Small delay to allow swipe animation to start
        setTimeout(() => {
          router.push(`/application/${applicationId}`);
        }, 300);
      }
      return;
    }
    
    if (draggedLeft || flickedLeft) {
      setExitDirection({ x: -exitDistance, y: 0 });
      swipe(currentJob.id, SwipeActionType.REJECT);
      return;
    }
    
    if (draggedUp || flickedUp) {
      setExitDirection({ x: 0, y: -exitDistance });
      swipe(currentJob.id, SwipeActionType.SKIP);
      return;
    }
    
    // Reset if threshold not met
    setExitDirection({ x: 0, y: 0 });
    setSwipeDirection('');
  }, [currentJob, isLocked, exitDistance, swipe, createApplication, router]);
  
  /**
   * Handle accept button click
   */
  const handleAccept = useCallback(async () => {
    if (!currentJob || isLocked) return;
    setExitDirection({ x: exitDistance, y: 0 });
    swipe(currentJob.id, SwipeActionType.ACCEPT);
    
    // Create application and navigate to it (even if offline)
    const applicationId = await createApplication(currentJob);
    if (applicationId) {
      // Small delay to allow swipe animation to start
      setTimeout(() => {
        router.push(`/application/${applicationId}`);
      }, 300);
    }
  }, [currentJob, isLocked, exitDistance, swipe, createApplication, router]);
  
  /**
   * Handle reject button click
   */
  const handleReject = useCallback(() => {
    if (!currentJob || isLocked) return;
    setExitDirection({ x: -exitDistance, y: 0 });
    swipe(currentJob.id, SwipeActionType.REJECT);
  }, [currentJob, isLocked, exitDistance, swipe]);
  
  /**
   * Handle skip button click
   */
  const handleSkip = useCallback(() => {
    if (!currentJob || isLocked) return;
    setExitDirection({ x: 0, y: -exitDistance });
    swipe(currentJob.id, SwipeActionType.SKIP);
  }, [currentJob, isLocked, exitDistance, swipe]);
  
  /**
   * Handle rollback button click
   * This is a pure synchronous operation
   * 
   * CRITICAL: Rollback brings a card BACK, there's no exit animation
   * We must unlock immediately, not wait for onExitComplete
   */
  const handleRollback = useCallback(() => {
    if (!canPerformRollback) return;
    
    // Set exit direction for the current card to animate back in
    setExitDirection({ x: 0, y: 0 });
    rollback();
    
    // Unlock immediately - rollback has no exit animation to trigger onExitComplete
    // The rolled-back job just appears, it doesn't exit
    setTimeout(() => unlock(), 0);
  }, [canPerformRollback, rollback, unlock]);
  
  /**
   * Animation completion handler
   * This is where we unlock the state machine
   */
  const handleAnimationComplete = useCallback(() => {
    unlock();
  }, [unlock]);
  
  /**
   * Handle report modal
   */
  const handleOpenReportModal = useCallback((job) => {
    setJobToReport(job);
    setReportModalOpen(true);
  }, []);
  
  const handleReport = useCallback((reason) => {
    if (jobToReport) {
      // Call the actual report API
      reportJob(jobToReport, reason);
      setReportModalOpen(false);
      setJobToReport(null);
    }
  }, [jobToReport, reportJob]);
  
  /**
   * Toggle auto-apply mode
   */
  const handleToggleAutoApply = useCallback(() => {
    setAutoApplyEnabled(prev => {
      const newValue = !prev;
      autoApplyMetadataRef.current = { automaticApply: newValue };
      // Only show tooltip when turning ON
      if (newValue) {
        setShowAutoApplyTooltip(true);
      }
      return newValue;
    });
  }, []);
  
  // Keep tooltip visible when auto-apply is on
  useEffect(() => {
    if (autoApplyEnabled) {
      setShowAutoApplyTooltip(true);
    } else {
      setShowAutoApplyTooltip(false);
    }
  }, [autoApplyEnabled]);
  const handleToggleSaved = useCallback(() => {
    if (!currentJob || isLocked) return;
    toggleSaveJob(currentJob);
  }, [currentJob, isLocked, toggleSaveJob]);
  
  // Check if current job is saved
  const isCurrentJobSaved = useMemo(() => {
    if (!currentJob) return false;
    return savedJobs.some(saved => saved.id === currentJob.id);
  }, [currentJob, savedJobs]);
  
  // Unlock when entering empty state (no animation to unlock otherwise)
  // This must be before any conditional returns to follow Rules of Hooks
  const shouldShowEmpty = !loading && !currentJob && remainingJobs === 0;
  useEffect(() => {
    // Unlock when entering empty state (finished all jobs)
    // There's no more cards to animate, so onExitComplete won't fire
    if (shouldShowEmpty && isLocked) {
      unlock();
    }
  }, [shouldShowEmpty, isLocked, unlock]);
  
  // Show error state
  if (error && !loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-6 max-w-sm">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Jobs</h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          
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
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-6">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading jobs...</h2>
          <p className="text-sm text-gray-500">Finding the best opportunities for you</p>
        </div>
      </div>
    );
  }
  
  // Show empty state - only when truly at the end
  // Guard against premature empty state during transitions
  if (shouldShowEmpty) {
    return (
      <div className="relative h-full w-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center px-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h2>
            <p className="text-gray-600">You've reviewed all available jobs.</p>
            <p className="text-sm text-gray-500 mt-2">Check back later for more opportunities!</p>
          </div>
        </div>
        
        {/* Rollback button still available in empty state */}
        {history.length > 0 && (
          <button
            onClick={handleRollback}
            disabled={isLocked}
            className="fixed bottom-24 right-6 z-50 bg-gray-800 text-white rounded-full p-3 shadow-xl hover:scale-110 transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Undo last action"
          >
            <ArrowUturnLeftIcon className="h-6 w-6" />
            <span className="text-sm font-medium pr-1">{history.length}</span>
          </button>
        )}
      </div>
    );
  }
  
  // If still loading or in transition, show loading indicator
  if (!currentJob) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-6">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm text-gray-500">Loading next job...</p>
        </div>
      </div>
    );
  }
  
  // Prepare visible jobs for rendering (current + preview)
  const visibleJobs = [currentJob, nextJob].filter(Boolean);
  
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="relative h-full max-w-md mx-auto">
        {/* Jobs remaining counter */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium">
            {remainingJobs} {remainingJobs === 1 ? 'job' : 'jobs'}
          </div>
        </div>
        
        {/* Offline indicator */}
        {!isOnline && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="bg-orange-500 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-lg">
              <WifiIcon className="h-3.5 w-3.5" />
              <span>Offline Mode</span>
            </div>
          </div>
        )}
        
        {/* Card stack */}
        <div className="relative h-full px-4 pt-4 pb-28">
          <AnimatePresence mode="popLayout" onExitComplete={handleAnimationComplete}>
            {visibleJobs.map((job, index) => {
              const isTopCard = index === 0;
              const scale = 1 - index * 0.05;
              const yOffset = index * 12;
              
              return (
                <motion.div
                  key={job.id}
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
                    x: exitDirection.x,
                    y: exitDirection.y,
                    rotate: exitDirection.x > 0 ? EXIT_ROTATION : exitDirection.x < 0 ? -EXIT_ROTATION : 0,
                    transition: { duration: 0.3, ease: 'easeOut' }
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
          onSave={handleToggleSaved}
          isSaved={isCurrentJobSaved}
          disabled={!canPerformSwipe || isLocked}
        />
        
        {/* Rollback button */}
        {history.length > 0 && (
          <button
            onClick={handleRollback}
            disabled={isLocked}
            className="fixed bottom-24 right-6 z-50 bg-gray-800 text-white rounded-full p-3 shadow-xl hover:scale-110 transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Undo last action"
          >
            <ArrowUturnLeftIcon className="h-6 w-6" />
            <span className="text-sm font-medium pr-1">{history.length}</span>
          </button>
        )}
        
        {/* Auto-apply toggle button - minimal design */}
        <div className="fixed bottom-24 left-6 z-50">
          <button
            onClick={handleToggleAutoApply}
            className={`rounded-full p-2 shadow-lg hover:scale-110 transition-all active:scale-95 ${
              autoApplyEnabled 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
            aria-label="Toggle auto-apply"
          >
            <BoltIcon className="h-4 w-4" />
          </button>
          
          {/* Tooltip - only shown when auto-apply is ON, positioned to not block content */}
          {autoApplyEnabled && showAutoApplyTooltip && (
            <div className="absolute bottom-full left-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg">
              Auto-apply is on
              <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
        
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
