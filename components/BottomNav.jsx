'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BriefcaseIcon, 
  HeartIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';
import { 
  BriefcaseIcon as BriefcaseIconSolid, 
  HeartIcon as HeartIconSolid, 
  ClockIcon as ClockIconSolid 
} from '@heroicons/react/24/solid';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Jobs',
      href: '/',
      icon: BriefcaseIcon,
      iconSolid: BriefcaseIconSolid,
    },
    {
      name: 'Saved',
      href: '/saved',
      icon: HeartIcon,
      iconSolid: HeartIconSolid,
    },
    {
      name: 'History',
      href: '/history',
      icon: ClockIcon,
      iconSolid: ClockIconSolid,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50" style={{ height: 'var(--bottom-nav-height)' }}>
      <div className="flex justify-around items-center h-full max-w-md mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = isActive ? item.iconSolid : item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
