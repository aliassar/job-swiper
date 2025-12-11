import { Inter } from 'next/font/google';
import './globals.css';
import { JobProvider } from '@/context/JobContext';

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
            {/* Main content area - full screen */}
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </JobProvider>
      </body>
    </html>
  );
}
