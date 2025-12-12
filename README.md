# Job Swiper 💼

A mobile-first job swiping application built with Next.js, where users can swipe through job listings similar to Tinder. Find your dream job by swiping right to accept or left to reject!

## 🎨 UI Screenshots

### Main Swipe Interface
![Main Interface](https://github.com/user-attachments/assets/4a2e5b31-2a3f-4fcb-bfdb-2088b9492a96)

### Hamburger Menu
![Menu](https://github.com/user-attachments/assets/bb2be0e9-2cbb-44e8-8580-a1f49271d4e9)

### Application Status Tracking
![Applications](https://github.com/user-attachments/assets/915f33e5-3e66-4d67-b7a0-5f3879a43f82)

## Features

### 🎯 Core Functionality
- **Full-Screen Swipe Interface**: Immersive, card-based swiping with Framer Motion animations
  - Swipe right to accept jobs
  - Swipe left to reject jobs
  - Tap Skip to skip jobs for later review
  - Visual feedback with smooth animations
  - Card stack effect showing next jobs behind the current one
  - Jobs remaining counter (unobtrusive pill in top-right)

### 🍔 Navigation
- **Hamburger Menu**: Slide-out navigation drawer accessible from top-left
  - Swipe Jobs - Main swipe interface
  - Favorites - Saved job postings
  - Application Status - Track accepted jobs
  - Skipped Jobs - Review jobs you skipped

### 💼 Job Cards
Each full-screen job card displays:
- Company logo (dynamically generated)
- Company name and location
- Job position/title
- Skills required (as tags)
- Job posting date (relative time)
- Job description preview
- Favorite toggle (heart icon in header)

### ⚡ Floating Actions
- **Bottom Action Bar** with 4 buttons:
  - ❌ Reject - Pass on this job
  - ⏭️ Skip - Save for later review
  - ❤️ Favorite - Mark as favorite
  - ✅ Accept - Apply to this job

### ❤️ Favorites System
- Mark jobs as favorites from any card or action bar
- Dedicated favorites page to view all saved jobs
- Quick unfavorite from the favorites view
- Favorites persist across sessions

### 🔄 Session Rollback
- **Smart Undo System** - undo actions from current session only
- Floating rollback button (bottom-right) shows undo count
- Rollback any action: accept, reject, or skip
- Jobs return to the top of your swipe stack
- Session-only (doesn't affect persisted history from previous sessions)

### 📊 Application Status
- Track all accepted jobs in one place
- Update application stage with dropdown:
  - Applied
  - Phone Screen
  - Interview
  - Offer
  - Rejected
  - Accepted
  - Withdrawn
- View application dates and progress
- Color-coded stage indicators

### ⏭️ Skipped Jobs
- Review jobs you skipped
- Add them back to your swipe queue with one tap
- Track when jobs were skipped

### 🔌 API & Backend Ready
- Centralized API client (`lib/api.js`)
- Complete API specification in `docs/API_SPECIFICATION.md`
- Mock in-memory storage for development
- Easy migration to Vercel Postgres (see docs)
- RESTful API design with proper HTTP methods

## Tech Stack

- **Next.js 14** - App Router with Server Actions
- **React 18** - UI components with hooks
- **Tailwind CSS** - Styling with system fonts
- **Framer Motion** - Swipe animations
- **Heroicons** - Icon library
- **NextAuth.js** - Authentication (GitHub & Google OAuth)
- **SWR** - Data fetching with caching
- **PropTypes** - Runtime type checking

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd job-swiper
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Set up environment variables for authentication:
```bash
cp .env.example .env.local
# Edit .env.local with your OAuth credentials
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

The app is optimized for mobile viewports (375px - 428px width) but works on all screen sizes.

**Note**: Authentication features require OAuth credentials. See "Setup Authentication" section below for details.

## Project Structure

```
job-swiper/
├── app/
│   ├── api/
│   │   ├── applications/
│   │   │   ├── route.js                # Get all applications
│   │   │   └── [id]/stage/route.js     # Update application stage
│   │   ├── favorites/
│   │   │   └── route.js                # Get favorites
│   │   ├── jobs/
│   │   │   ├── route.js                # Get pending jobs
│   │   │   ├── skipped/route.js        # Get skipped jobs
│   │   │   └── [id]/
│   │   │       ├── accept/route.js     # Accept job
│   │   │       ├── reject/route.js     # Reject job
│   │   │       ├── skip/route.js       # Skip job
│   │   │       ├── favorite/route.js   # Toggle favorite
│   │   │       └── rollback/route.js   # Rollback decision
│   │   └── history/
│   │       └── route.js                # Get action history
│   ├── applications/
│   │   └── page.js                     # Application status page
│   ├── favorites/
│   │   └── page.js                     # Favorites page
│   ├── skipped/
│   │   └── page.js                     # Skipped jobs page
│   ├── globals.css                     # Global styles
│   ├── layout.js                       # Root layout with hamburger menu
│   └── page.js                         # Main swipe interface
├── components/
│   ├── FloatingActions.jsx             # Bottom action buttons
│   ├── HamburgerMenu.jsx               # Slide-out navigation menu
│   ├── FavoritesList.jsx               # Favorites list component
│   ├── JobCard.jsx                     # Full-screen job card
│   └── SwipeContainer.jsx              # Main swipe container with rollback
├── context/
│   └── JobContext.jsx                  # Global state with session actions
├── docs/
│   └── API_SPECIFICATION.md            # Complete API docs & DB schema
├── lib/
│   ├── api.js                          # Centralized API client
│   └── mockJobs.js                     # Mock job data (20 jobs)
└── public/                             # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

## Usage

1. **Browse Jobs**: The main screen shows full-screen job cards you can swipe through
2. **Make Decisions**:
   - Swipe right or tap ✅ to accept
   - Swipe left or tap ❌ to reject
   - Tap ⏭️ to skip for later review
   - Tap ❤️ to mark as favorite
3. **Navigate**: Tap the hamburger menu (top-left) to access different sections
4. **View Favorites**: See all jobs you've marked as favorites
5. **Track Applications**: Monitor your accepted jobs and update their status
6. **Review Skipped**: Browse jobs you skipped and add them back to your queue
7. **Undo Actions**: Use the floating rollback button (bottom-right) to undo recent actions

## Features in Detail

### Swipe Gestures
- Drag cards left/right to make decisions
- Visual feedback during swipe (text overlays)
- Smooth animations with physics-based motion
- Threshold-based decision making (100px)

### Mobile Optimization
- Touch-friendly interface
- Responsive design with mobile-first approach
- Bottom navigation for easy thumb access
- Safe area support for devices with notches

### Visual Design
- Modern card-based UI with shadows and rounded corners
- Gradient header for visual appeal
- Color-coded status indicators
- Proper typography hierarchy
- Loading and empty states

## API Endpoints

### Jobs
- `GET /api/jobs` - Fetch pending jobs
- `POST /api/jobs/:id/accept` - Accept a job (creates application)
- `POST /api/jobs/:id/reject` - Reject a job
- `POST /api/jobs/:id/skip` - Skip a job for later
- `POST /api/jobs/:id/favorite` - Toggle favorite status
- `POST /api/jobs/:id/rollback` - Rollback decision (move back to pending)
- `GET /api/jobs/skipped` - Get skipped jobs

### Applications
- `GET /api/applications` - Get all applications with stage info
- `PUT /api/applications/:id/stage` - Update application stage

### Favorites & History
- `GET /api/favorites` - Get favorited jobs
- `GET /api/history` - Get full action history

**See `docs/API_SPECIFICATION.md` for complete API documentation, request/response formats, and database schema.**

## Mock Data

The app includes 20 diverse mock jobs from various companies:
- Tech companies (Google, Microsoft, Meta, etc.)
- Various locations and roles
- Different skill sets (React, Python, AWS, etc.)
- Realistic job descriptions
- Different posting dates

## Migrating to Production

### Backend Migration (Vercel + Postgres)

The app currently uses in-memory mock storage. To deploy to production:

1. **Set up Vercel Postgres**:
   - Add Vercel Postgres to your project
   - Get the `DATABASE_URL` from environment variables

2. **Install Prisma**:
   ```bash
   npm install @prisma/client
   npm install -D prisma
   ```

3. **Set up database**:
   - Copy the Prisma schema from `docs/API_SPECIFICATION.md`
   - Run migrations: `npx prisma migrate dev`
   - Generate Prisma client: `npx prisma generate`

4. **Update API routes**:
   - Replace in-memory `jobsStorage` with Prisma queries
   - Follow examples in `docs/API_SPECIFICATION.md`

5. **Environment variables**:
   ```
   DATABASE_URL=          # Vercel Postgres connection
   NEXTAUTH_SECRET=       # For authentication (optional)
   NEXT_PUBLIC_API_URL=   # Empty for same domain
   ```

See `docs/API_SPECIFICATION.md` for detailed migration guide, complete Prisma schema, and SQL examples.

## Future Enhancements

Potential features for future releases:
- ✅ User authentication (NextAuth.js) - **Implemented**
- Real job API integration (Indeed, LinkedIn)
- Advanced filtering (location, salary, remote)
- ✅ Job search functionality - **Implemented**
- Email notifications for application updates
- Resume upload and management
- Company reviews and ratings
- Salary insights and comparison
- Infinite scroll pagination for list pages
- Enhanced state persistence with IndexedDB

## Recent Improvements

This codebase has been enhanced with 25+ comprehensive improvements:

### Bug Fixes
- Fixed missing offlineQueue dependency in useEffect
- Resolved stale closure issue in rollbackLastAction
- Added cleanup for retry timeout to prevent memory leaks
- Fixed inconsistent AnimatePresence keys for stable animations

### Optimizations
- Memoized offlineQueue to prevent unnecessary recreation
- Added debounce to search functionality
- Extracted constants to centralized location (lib/constants.js)
- Optimized currentIndex usage from context
- Added logo caching with job.logo field support

### Best Practices
- Created ErrorBoundary component for graceful error handling
- Added PropTypes validation to all components
- Implemented input sanitization utility
- Added rate limiting utilities (debounce/throttle)

### New Features
- **NextAuth.js Authentication**: GitHub and Google OAuth integration
- **Server Actions**: Next.js server actions for optimized database operations
- **Viewport Configuration**: Proper Next.js viewport metadata
- **System Fonts**: Native system font stack for better performance
- **Enhanced Offline Queue**: Deterministic handlers for reliable operation replay

### Setup Authentication

To enable authentication features:

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Configure OAuth providers:
   - **GitHub**: Create OAuth app at https://github.com/settings/developers
   - **Google**: Create OAuth credentials at https://console.cloud.google.com/apis/credentials

3. Set environment variables in `.env.local`:
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

4. Access the login page at `/login`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
