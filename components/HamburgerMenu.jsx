'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BriefcaseIcon, 
  BookmarkIcon, 
  ClockIcon,
  ArrowPathIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      name: 'Swipe Jobs',
      href: '/',
      icon: BriefcaseIcon,
      description: 'Browse and swipe through job opportunities',
    },
    {
      name: 'Saved Jobs',
      href: '/saved',
      icon: BookmarkIcon,
      description: 'View your saved job postings',
    },
    {
      name: 'Application Status',
      href: '/applications',
      icon: ClockIcon,
      description: 'Track your job applications',
    },
    {
      name: 'Skipped Jobs',
      href: '/skipped',
      icon: ArrowPathIcon,
      description: 'Review jobs you skipped',
    },
    {
      name: 'Reported Jobs',
      href: '/reported',
      icon: FlagIcon,
      description: 'View jobs you\'ve reported',
    },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger Button - Fixed position */}
      <button
        onClick={toggleMenu}
        className="fixed top-2 right-4 z-50 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        aria-label="Open menu"
      >
        <div className="w-6 flex flex-col gap-1.5">
          <span className={`h-0.5 bg-gray-800 rounded-full transition-all ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`h-0.5 bg-gray-800 rounded-full transition-all ${isOpen ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 bg-gray-800 rounded-full transition-all ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </div>
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 w-80 bg-white z-50 shadow-2xl overflow-y-auto"
          >
            {/* Menu Items - no header, just navigation */}
            <nav className="p-4 pt-6">
              <ul className="space-y-2">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={closeMenu}
                        className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
                          isActive 
                            ? 'bg-blue-50 text-blue-600' 
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Icon className={`h-6 w-6 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold mb-0.5">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.description}</div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                © 2024 Job Swiper. All rights reserved.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
