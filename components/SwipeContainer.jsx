'use client';

import { useState, useRef, useEffect } from 'react';
import Hammer from 'hammerjs';
import JobCard from './JobCard';
import FloatingActions from './FloatingActions';
import { useJobs } from '@/context/JobContext';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

// Constants
const SWIPE_THRESHOLD = 130;
const INDICATOR_THRESHOLD = 100;

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

  const cardRef = useRef(null);
  const hammerRef = useRef(null);
  const [showAcceptIndicator, setShowAcceptIndicator] = useState(false);
  const [showRejectIndicator, setShowRejectIndicator] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Setup Hammer.js for swipe detection
  useEffect(() => {
    if (!cardRef.current || !currentJob || isAnimating) return;

    const hammer = new Hammer(cardRef.current);
    hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });

    let deltaX = 0;
    let deltaY = 0;

    hammer.on('panmove', (e) => {
      if (isAnimating) return;
      
      deltaX = e.deltaX;
      deltaY = e.deltaY;

      // Apply transform for smooth dragging
      if (cardRef.current) {
        const rotation = deltaX * 0.05;
        cardRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
        cardRef.current.style.transition = 'none';
      }

      // Show indicators based on threshold AND direction
      if (deltaX > INDICATOR_THRESHOLD) {
        setShowAcceptIndicator(true);
        setShowRejectIndicator(false);
      } else if (deltaX < -INDICATOR_THRESHOLD) {
        setShowRejectIndicator(true);
        setShowAcceptIndicator(false);
      } else {
        setShowAcceptIndicator(false);
        setShowRejectIndicator(false);
      }
    });

    hammer.on('panend', (e) => {
      if (isAnimating) return;

      const finalDeltaX = e.deltaX;
      const finalDeltaY = e.deltaY;

      // Check if swipe threshold is met
      if (finalDeltaX > SWIPE_THRESHOLD) {
        // Swipe right - accept
        animateOut('right', () => acceptJob(currentJob));
      } else if (finalDeltaX < -SWIPE_THRESHOLD) {
        // Swipe left - reject
        animateOut('left', () => rejectJob(currentJob));
      } else if (finalDeltaY < -SWIPE_THRESHOLD) {
        // Swipe up - skip
        animateOut('up', () => skipJob(currentJob));
      } else {
        // Spring back to center
        if (cardRef.current) {
          cardRef.current.style.transition = 'transform 0.3s ease-out';
          cardRef.current.style.transform = 'translate(0, 0) rotate(0deg)';
        }
        setShowAcceptIndicator(false);
        setShowRejectIndicator(false);
      }
    });

    hammerRef.current = hammer;

    return () => {
      if (hammerRef.current) {
        hammerRef.current.destroy();
        hammerRef.current = null;
      }
    };
  }, [currentJob, isAnimating]);

  const animateOut = (direction, callback) => {
    if (!cardRef.current) return;
    
    setIsAnimating(true);
    setShowAcceptIndicator(false);
    setShowRejectIndicator(false);

    // Add exit animation class
    cardRef.current.classList.add(`card-exit-${direction}`);

    // Execute callback after animation completes
    setTimeout(() => {
      callback();
      setIsAnimating(false);
      
      // Reset card state
      if (cardRef.current) {
        cardRef.current.classList.remove(`card-exit-${direction}`);
        cardRef.current.style.transform = 'translate(0, 0) rotate(0deg)';
        cardRef.current.style.transition = 'none';
      }
    }, 300);
  };

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

  const handleAccept = () => {
    if (isAnimating) return;
    animateOut('right', () => acceptJob(currentJob));
  };

  const handleReject = () => {
    if (isAnimating) return;
    animateOut('left', () => rejectJob(currentJob));
  };

  const handleSkip = () => {
    if (isAnimating) return;
    animateOut('up', () => skipJob(currentJob));
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
        
        {/* Card stack container with padding for floating actions */}
        <div className="relative h-full px-4 pt-4 pb-28">
          {visibleJobs.map((job, index) => {
            const isTopCard = index === 0;
            const scale = 1 - index * 0.05;
            const yOffset = index * 12;

            return (
              <div
                key={`${job.id}-${index}`}
                ref={isTopCard ? cardRef : null}
                className="absolute inset-0"
                style={{
                  transform: isTopCard ? 'translate(0, 0) rotate(0deg)' : `scale(${scale}) translateY(${yOffset}px)`,
                  pointerEvents: isTopCard ? 'auto' : 'none',
                  opacity: 0.95,
                  zIndex: 10 - index,
                  touchAction: 'none',
                }}
              >
                <JobCard 
                  job={job} 
                  showAcceptIndicator={isTopCard && showAcceptIndicator}
                  showRejectIndicator={isTopCard && showRejectIndicator}
                />
              </div>
            );
          })}
        </div>

        {/* Floating action buttons */}
        <FloatingActions
          onReject={handleReject}
          onAccept={handleAccept}
          onSkip={handleSkip}
          onFavorite={handleFavorite}
          isFavorite={isFavorite}
          disabled={!currentJob || isAnimating}
        />

        {/* Rollback button - moved higher to avoid overlap */}
        {sessionActions.length > 0 && (
          <button
            onClick={rollbackLastAction}
            className="fixed bottom-32 right-6 z-40 bg-gray-800 text-white rounded-full p-3 shadow-xl hover:scale-110 transition-transform active:scale-95 flex items-center gap-2"
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
