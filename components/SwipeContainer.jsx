'use client';

import { useState, useEffect } from 'react';
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
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-300, 300], [-20, 20]);
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]);

  const [exit, setExit] = useState({ x: 0, y: 0 });

  useEffect(() => {
    x.set(0);
    y.set(0);
    setExit({ x: 0, y: 0 });
  }, [currentJob]);

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
    const thresholdX = 130;
    const thresholdY = 130;

    const draggedRight = info.offset.x > thresholdX;
    const draggedLeft = info.offset.x < -thresholdX;
    const draggedUp = info.offset.y < -thresholdY;

    if (draggedRight) {
      setExit({ x: 600, y: 0 });
      acceptJob(currentJob);
      return;
    }

    if (draggedLeft) {
      setExit({ x: -600, y: 0 });
      rejectJob(currentJob);
      return;
    }

    if (draggedUp) {
      setExit({ x: 0, y: -600 });
      skipJob(currentJob);
      return;
    }

    setExit({ x: 0, y: 0 }); // reset if not passed threshold
  };

  const handleAccept = () => {
    setExit({ x: 600, y: 0 });
    acceptJob(currentJob);
  };

  const handleReject = () => {
    setExit({ x: -600, y: 0 });
    rejectJob(currentJob);
  };

  const handleSkip = () => {
    setExit({ x: 0, y: -600 });
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
      <div className="relative h-full w-full overflow-hidden px-4 py-6">
        <div className="relative h-full max-w-md mx-auto overflow-hidden">

          {/* Small jobs remaining counter - top right */}
          <div className="absolute top-0 right-0 z-10 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium">
              {remainingJobs} {remainingJobs === 1 ? 'job' : 'jobs'}
            </div>
          </div>

          <div className="relative h-full overflow-hidden pt-8 pb-28">
            <AnimatePresence initial={false}>
              {visibleJobs.map((job, index) => {
                const isTopCard = index === 0;
                const scale = 1 - index * 0.05;
                const yOffset = index * 12;

                return (
                    <motion.div
                        key={isTopCard ? currentJob.id : job.id}
                        className="absolute w-full h-full"
                        style={
                          isTopCard
                              ? { x, y, rotate, opacity, zIndex: 10 }
                              : {
                                scale,
                                y: yOffset,
                                pointerEvents: 'none',
                                opacity: 0.95,
                                zIndex: index * -1,
                              }
                        }
                        drag={isTopCard}
                        dragElastic={0.25}
                        dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                        onDragEnd={handleDragEnd}
                        initial={{ scale, opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{
                          x: exit.x,
                          y: exit.y,
                          opacity: 0,
                          transition: { duration: 0.35 }
                        }}
                        onAnimationComplete={() => {
                          if (!isTopCard) return;
                          x.set(0);
                          y.set(0);
                          setExit({ x: 0, y: 0 });
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

          {/* Rollback button - positioned higher to avoid overlap */}
          {sessionActions.length > 0 && (
            <button
              onClick={rollbackLastAction}
              className="fixed bottom-28 right-6 z-40 bg-gray-800 text-white rounded-full p-3 shadow-xl hover:scale-110 transition-transform active:scale-95 flex items-center gap-2"
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
