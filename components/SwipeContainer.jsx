'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import JobCard from './JobCard';
import FloatingActions from './FloatingActions';
import { useJobs } from '@/context/JobContext';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

// Constants
const SWIPE_THRESHOLD = 130;
const EXIT_DISTANCE = 600;
const DRAG_CONSTRAINTS = { top: 0, bottom: 0, left: 0, right: 0 };

export default function SwipeContainer() {
  const { 
    currentJob, 
    jobs, 
    acceptJob, 
    rejectJob, 
    skipJob,
    toggleFavorite,
    favorites,
    loading, 
    remainingJobs,
    sessionActions,
    rollbackLastAction,
  } = useJobs();

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-20, 20]);
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]);

  const [exit, setExit] = useState({ x: 0, y: 0 });

  // Reset motion values when currentJob changes
  useEffect(() => {
    x.set(0);
    setExit({ x: 0, y: 0 });
  }, [currentJob, x]);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading jobs...</p>
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

  const handleDragEnd = (_event, info) => {
    const thresholdX = SWIPE_THRESHOLD;
    const thresholdY = SWIPE_THRESHOLD;

    const draggedRight = info.offset.x > thresholdX;
    const draggedLeft = info.offset.x < -thresholdX;
    const draggedUp = info.offset.y < -thresholdY;

    if (draggedRight) {
      setExit({ x: EXIT_DISTANCE, y: 0 });
      acceptJob(currentJob);
      return;
    }

    if (draggedLeft) {
      setExit({ x: -EXIT_DISTANCE, y: 0 });
      rejectJob(currentJob);
      return;
    }

    if (draggedUp) {
      setExit({ x: 0, y: -EXIT_DISTANCE });
      rejectJob(currentJob);
      return;
    }

    setExit({ x: 0, y: 0 }); // reset if not passed threshold
  };

  const handleAccept = () => {
    setExit({ x: EXIT_DISTANCE, y: 0 });
    acceptJob(currentJob);
  };

  const handleReject = () => {
    setExit({ x: -EXIT_DISTANCE, y: 0 });
    rejectJob(currentJob);
  };

  const handleSkip = () => {
    setExit({ x: 0, y: -EXIT_DISTANCE });
    skipJob(currentJob);
  };

  const handleFavorite = () => {
    if (currentJob) {
      toggleFavorite(currentJob);
    }
  };

  const currentIndex = jobs.indexOf(currentJob);
  const visibleJobs = jobs.slice(currentIndex, currentIndex + 3);
  const isFavorite = currentJob ? favorites.some(fav => fav.id === currentJob.id) : false;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="relative h-full max-w-md mx-auto">
        
        {/* Small jobs remaining counter - top left */}
        <div className="absolute top-4 right-4 z-10 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium">
            {remainingJobs} {remainingJobs === 1 ? 'job' : 'jobs'}
          </div>
        </div>

        {/* Card stack container with padding for floating actions */}
        <div className="relative h-full px-4 pt-4 pb-28">
          <AnimatePresence mode="popLayout" onExitComplete={() => x.set(0)}>
            {visibleJobs.map((job, index) => {
              const isTopCard = index === 0;
              const scale = 1 - index * 0.05;
              const yOffset = index * 12;

              return (
                <motion.div
                  key={`${job.id}-${index}`}
                  className="absolute inset-0"
                  style={
                    isTopCard
                      ? { x, rotate, opacity, zIndex: 10 }
                      : {
                          scale,
                          y: yOffset,
                          pointerEvents: 'none',
                          opacity: 0.95,
                          zIndex: 10 - index,
                        }
                  }
                  drag={isTopCard}
                  dragElastic={0.15}
                  dragConstraints={DRAG_CONSTRAINTS}
                  onDragEnd={handleDragEnd}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: isTopCard ? 1 : scale, opacity: 1 }}
                  exit={{
                    x: exit.x,
                    y: exit.y,
                    scale: 0.8,
                    transition: { 
                      x: { duration: 0.2, ease: 'easeOut' },
                      y: { duration: 0.2, ease: 'easeOut' },
                      scale: { duration: 0.2, ease: 'easeOut' }
                    }
                  }}
                >
                  <JobCard job={job} />
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
          onFavorite={handleFavorite}
          isFavorite={isFavorite}
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
      </div>
    </div>
  );
}
