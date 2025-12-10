'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  BriefcaseIcon, 
  HeartIcon, 
  ClipboardDocumentListIcon,
  ForwardIcon,
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Jobs',
      href: '/',
      icon: BriefcaseIcon,
    },
    {
      name: 'Favorites',
      href: '/favorites',
      icon: HeartIcon,
    },
    {
      name: 'Job Status',
      href: '/status',
      icon: ClipboardDocumentListIcon,
    },
    {
      name: 'Skipped',
      href: '/skipped',
      icon: ForwardIcon,
    },
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-50 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6 text-gray-700" />
        ) : (
          <Bars3Icon className="h-6 w-6 text-gray-700" />
        )}
      </button>

      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={closeMenu}
        />
      )}

      {/* Slide-out Menu Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-20 px-6">
          <nav className="flex-1">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-600 font-semibold' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-lg">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          <div className="py-6 text-center text-sm text-gray-500">
            <p>Job Swiper v1.0</p>
          </div>
        </div>
      </div>
    </>
  );
}
