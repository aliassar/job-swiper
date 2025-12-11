import { Inter } from 'next/font/google';
import './globals.css';
import { JobProvider } from '@/context/JobContext';
import { ToastProvider } from '@/context/ToastContext';
import HamburgerMenu from '@/components/HamburgerMenu';
import ToastRenderer from '@/components/ToastRenderer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Job Swiper - Find Your Dream Job',
  description: 'Swipe through job opportunities and find your perfect match',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <body className={`${inter.className} h-full overflow-x-hidden`}>
        <ToastProvider>
          <JobProvider>
            {/* Hamburger menu - available on all pages */}
            <HamburgerMenu />
            
            {/* Toast notifications */}
            <ToastRenderer />
            
            {/* Main content - full height, no top bar */}
            <main className="h-full overflow-hidden">
              {children}
            </main>
          </JobProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
