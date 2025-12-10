'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import JobCard from './JobCard';
import { useJobs } from '@/context/JobContext';

export default function SwipeContainer() {
  const { currentJob, jobs, acceptJob, rejectJob, loading, remainingJobs } = useJobs();
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

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

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 100;
    
    if (Math.abs(info.offset.x) > swipeThreshold) {
      // Set exit direction based on swipe
      setExitX(info.offset.x > 0 ? 500 : -500);
      
      if (info.offset.x > 0) {
        acceptJob(currentJob);
      } else {
        rejectJob(currentJob);
      }
    }
  };

  // Get next few jobs for stack effect
  const currentJobIndex = jobs.indexOf(currentJob);
  const visibleJobs = jobs.slice(currentJobIndex, currentJobIndex + 3);

  return (
    <div className="relative h-full w-full overflow-hidden px-4 py-6">
      <div className="relative h-full max-w-md mx-auto overflow-hidden">
        {/* Job counter */}
        <div className="text-center mb-4">
          <p className="text-sm font-medium text-gray-600">
            {remainingJobs} {remainingJobs === 1 ? 'job' : 'jobs'} remaining
          </p>
        </div>

        {/* Card stack */}
        <div className="relative h-full overflow-hidden">
          <AnimatePresence>
            {visibleJobs.map((job, index) => {
              const isTopCard = index === 0;
              
              // Stack effect: cards behind are slightly offset and scaled
              const scale = 1 - index * 0.05;
              const yOffset = index * 10;
              
              if (isTopCard) {
                return (
                  <motion.div
                    key={job.id}
                    className="absolute w-full h-full"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                    initial={{ scale: 1, y: 0 }}
                    exit={{ 
                      x: exitX, 
                      opacity: 0,
                      transition: { duration: 0.3 }
                    }}
                    style={{
                      x,
                      rotate,
                      cursor: 'grab',
                    }}
                    whileDrag={{ cursor: 'grabbing' }}
                  >
                    <JobCard job={job} />
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={job.id}
                  className="absolute w-full h-full pointer-events-none"
                  initial={{ scale, y: yOffset }}
                  style={{ 
                    scale, 
                    y: yOffset,
                    zIndex: -index,
                  }}
                >
                  <JobCard job={job} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-8 z-10">
          <button
            onClick={() => {
              setExitX(-500);
              rejectJob(currentJob);
            }}
            className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          >
            <span className="text-3xl">❌</span>
          </button>
          
          <button
            onClick={() => {
              setExitX(500);
              acceptJob(currentJob);
            }}
            className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          >
            <span className="text-3xl">✅</span>
          </button>
        </div>
      </div>
    </div>
  );
}
