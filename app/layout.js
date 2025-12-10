import { Inter } from 'next/font/google';
import './globals.css';
import { JobProvider } from '@/context/JobContext';
import HamburgerMenu from '@/components/HamburgerMenu';

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
            {/* Hamburger menu */}
            <HamburgerMenu />
            
            {/* Main content - now takes full height */}
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </JobProvider>
      </body>
    </html>
  );
}
