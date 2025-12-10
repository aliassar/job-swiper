import './globals.css';
import { JobProvider } from '@/context/JobContext';
import HamburgerMenu from '@/components/HamburgerMenu';

export const metadata = {
  title: 'Job Swiper - Find Your Dream Job',
  description: 'Swipe through job opportunities and find your perfect match',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="font-sans overflow-x-hidden">
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
