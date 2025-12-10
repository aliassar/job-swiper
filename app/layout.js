import { Inter } from 'next/font/google';
import './globals.css';
import { JobProvider } from '@/context/JobContext';
import BottomNav from '@/components/BottomNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Job Swiper - Find Your Dream Job',
  description: 'Swipe through job opportunities and find your perfect match',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className={`${inter.className} overflow-x-hidden`}>
        <JobProvider>
          <div className="flex flex-col h-full">
            {/* Main content - now takes full height minus bottom nav */}
            <main className="flex-1 overflow-hidden" style={{ paddingBottom: 'var(--bottom-nav-height)' }}>
              {children}
            </main>

            {/* Bottom navigation */}
            <BottomNav />
          </div>
        </JobProvider>
      </body>
    </html>
  );
}
