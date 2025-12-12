import './globals.css';
import { JobProvider } from '@/context/JobContext';
import HamburgerMenu from '@/components/HamburgerMenu';
import ErrorBoundary from '@/components/ErrorBoundary';
import SessionProvider from '@/components/SessionProvider';
import Script from 'next/script';

export const metadata = {
  title: 'Job Swiper - Find Your Dream Job',
  description: 'Swipe through job opportunities and find your perfect match',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Job Swiper',
  },
};

// Feature 22: Next.js viewport fix - move themeColor to viewport
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Job Swiper" />
      </head>
      <body className="h-full overflow-x-hidden">
        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('ServiceWorker registration successful:', registration.scope);
                  },
                  function(err) {
                    console.log('ServiceWorker registration failed:', err);
                  }
                );
              });
            }
          `}
        </Script>

        <ErrorBoundary>
          <SessionProvider>
            <JobProvider>
              {/* Hamburger menu - available on all pages */}
              <HamburgerMenu />
              
              {/* Main content - full height, no top bar */}
              <main className="h-full overflow-hidden">
                {children}
              </main>
            </JobProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
