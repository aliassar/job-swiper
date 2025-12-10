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
    <html lang="en">
      <body className={inter.className}>
        <JobProvider>
          <div className="flex flex-col h-full">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 shadow-lg">
              <div className="max-w-md mx-auto">
                <h1 className="text-2xl font-bold">Job Swiper 💼</h1>
                <p className="text-sm text-blue-100">Find your dream job</p>
              </div>
            </header>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto pb-20">
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
