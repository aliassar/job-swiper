'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import JobCard from './JobCard';
import FloatingActions from './FloatingActions';
import { useJobs } from '@/context/JobContext';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

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

  const [exitX, setExitX] = useState(0);

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
    const threshold = 120;
    const velocity = Math.abs(info.velocity.x);
    const offset = info.offset.x;

    // Determine action based on drag offset and velocity
    const shouldAccept = offset > threshold || (velocity > 500 && offset > 50);
    const shouldReject = offset < -threshold || (velocity > 500 && offset < -50);

    if (shouldAccept) {
      // Animate off to the right
      setExitX(window.innerWidth * 1.2);
      setTimeout(() => {
        acceptJob(currentJob);
        setExitX(0);
      }, 300);
      return;
    }

    if (shouldReject) {
      // Animate off to the left
      setExitX(-window.innerWidth * 1.2);
      setTimeout(() => {
        rejectJob(currentJob);
        setExitX(0);
      }, 300);
      return;
    }

    // Spring back to center if threshold not met
    x.set(0);
  };

  const handleAccept = () => {
    setExitX(window.innerWidth * 1.2);
    setTimeout(() => {
      acceptJob(currentJob);
      setExitX(0);
    }, 300);
  };

  const handleReject = () => {
    setExitX(-window.innerWidth * 1.2);
    setTimeout(() => {
      rejectJob(currentJob);
      setExitX(0);
    }, 300);
  };

  const handleSkip = () => {
    setExitX(window.innerWidth * 1.2);
    setTimeout(() => {
      skipJob(currentJob);
      setExitX(0);
    }, 300);
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
          <AnimatePresence mode="wait" onExitComplete={() => x.set(0)}>
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
                  dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: isTopCard ? 1 : scale, opacity: 1 }}
                  exit={{
                    x: exitX,
                    opacity: 0,
                    transition: { duration: 0.3, ease: 'easeOut' }
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
            className="fixed bottom-6 right-6 z-40 bg-gray-800 text-white rounded-full p-3 shadow-xl hover:scale-110 transition-transform active:scale-95 flex items-center gap-2"
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
