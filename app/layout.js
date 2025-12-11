import { Inter } from 'next/font/google';
import './globals.css';
import { JobProvider } from '@/context/JobContext';
import AppHeader from '@/components/AppHeader';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Job Swiper - Find Your Dream Job',
  description: 'Swipe through job opportunities and find your perfect match',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <body className={`${inter.className} h-full overflow-x-hidden`}>
        <JobProvider>
          <div className="flex flex-col h-full">
            {/* Fixed header with hamburger and jobs counter */}
            <AppHeader />
            
            {/* Main content area - starts below header */}
            <main className="flex-1 pt-14 overflow-hidden">
              {children}
            </main>
          </div>
        </JobProvider>
      </body>
    </html>
  );
}
