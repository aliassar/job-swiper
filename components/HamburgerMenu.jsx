'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, signOut } from '@/lib/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/lib/hooks/useNotifications';
import {
  BriefcaseIcon,
  BookmarkIcon,
  ClockIcon,
  ArrowPathIcon,
  FlagIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  CogIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useAuth();

  // Use shared useNotifications hook with SSE real-time updates
  const { unreadCount } = useNotifications({ enabled: status === 'authenticated' });

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
      name: 'Archived',
      href: '/archived',
      icon: ArrowPathIcon,
      description: 'View archived applications',
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
    {
      name: 'Settings',
      href: '/settings',
      icon: CogIcon,
      description: 'Manage your preferences',
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

      {/* Notification Icon - Same size as hamburger with more distance */}
      <Link
        href="/notifications"
        className="fixed top-2 right-[90px] z-50 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6 text-gray-800" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>

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
            {/* User Info Section */}
            {status === 'authenticated' && session?.user && (
              <div className="p-4 pt-6 border-b border-gray-200">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="w-12 h-12 text-blue-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {session.user.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                        className={`flex items-start gap-4 p-4 rounded-xl transition-all ${isActive
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
            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-gray-50">
              {/* Auth Section */}
              <div className="p-4">
                {status === 'authenticated' ? (
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/login' });
                      closeMenu();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      router.push('/login');
                      closeMenu();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    Sign In
                  </button>
                )}
              </div>

              <div className="px-4 pb-4">
                <p className="text-xs text-gray-500 text-center">
                  © 2024 Job Swiper. All rights reserved.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
