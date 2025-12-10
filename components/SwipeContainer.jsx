'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import JobCard from './JobCard';
import { useJobs } from '@/context/JobContext';

export default function SwipeContainer() {
  const { currentJob, jobs, acceptJob, rejectJob, skipJob, loading, remainingJobs, sessionActions, rollbackLastAction } = useJobs();

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
      rejectJob(currentJob);
      return;
    }

    setExit({ x: 0, y: 0 }); // reset if not passed threshold
  };

  const currentIndex = jobs.indexOf(currentJob);
  const visibleJobs = jobs.slice(currentIndex, currentIndex + 3);

  return (
      <div className="relative h-full w-full overflow-hidden">
        <div className="relative h-full max-w-md mx-auto overflow-hidden">

          {/* Minimal jobs remaining counter in top-left */}
          <div className="absolute top-4 left-4 z-30">
            <p className="text-xs text-gray-400">
              {remainingJobs} left
            </p>
          </div>

          <div className="relative h-full overflow-hidden">
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

          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 z-20">
            <button
                onClick={() => {
                  setExit({ x: -600, y: 0 });
                  rejectJob(currentJob);
                }}
                className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
            >
              <span className="text-3xl">❌</span>
            </button>

            <button
                onClick={() => {
                  setExit({ x: 0, y: 600 });
                  skipJob(currentJob);
                }}
                className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
            >
              <span className="text-3xl">⏭️</span>
            </button>

            <button
                onClick={() => {
                  setExit({ x: 600, y: 0 });
                  acceptJob(currentJob);
                }}
                className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
            >
              <span className="text-3xl">✅</span>
            </button>
          </div>

          {/* Rollback button */}
          {sessionActions.length > 0 && (
            <div className="absolute bottom-28 left-0 right-0 flex justify-center z-20">
              <button
                  onClick={rollbackLastAction}
                  className="bg-white shadow-lg rounded-full px-6 py-3 flex items-center gap-2 hover:shadow-xl transition-shadow"
              >
                <span className="text-xl">↩️</span>
                <span className="text-sm font-medium text-gray-700">Undo</span>
                <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {sessionActions.length}
                </span>
              </button>
            </div>
          )}

        </div>
      </div>
  );
}
