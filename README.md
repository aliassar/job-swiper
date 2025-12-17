# Job Swiper 💼

A Tinder-style job swiping app built with Next.js, Tailwind CSS, and JavaScript. Swipe right to apply, left to reject!

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)

## 🎨 UI Screenshots

### Main Swipe Interface
![Main Interface](https://github.com/user-attachments/assets/4a2e5b31-2a3f-4fcb-bfdb-2088b9492a96)

### Hamburger Menu
![Menu](https://github.com/user-attachments/assets/bb2be0e9-2cbb-44e8-8580-a1f49271d4e9)

### Application Status Tracking
![Applications](https://github.com/user-attachments/assets/915f33e5-3e66-4d67-b7a0-5f3879a43f82)

## Features

### 🎯 Core Swiping Features
- **Full-Screen Swipe Interface**: Immersive, card-based swiping experience
- **Gesture Controls**: Touch-based drag gestures with visual feedback
- **Card Animations**: Smooth Framer Motion animations with card stack effect
- **Jobs Remaining Counter**: Unobtrusive pill indicator showing pending jobs

### 💼 Job Management
- **Save Jobs**: Mark jobs for later review with heart icon
- **Skip Jobs**: Set aside jobs to review later
- **Report Jobs**: Flag inappropriate or fake job postings
- **Rollback**: Undo your last action with smart rollback system

### 📊 Application Tracking
- **Stage Management**: Track application progress through stages (Applied, Phone Screen, Interview, Offer, etc.)
- **CV Verification**: Confirm or reupload your CV for each application
- **Message Verification**: Review and edit application messages before sending
- **Document Management**: Attach custom resumes and cover letters per application
- **Auto Status Updates**: Optional automatic status updates via email monitoring

### 🔔 Notifications
- **Real-Time Notifications**: Server-Sent Events (SSE) for instant updates
- **Unread Count**: Badge showing number of unread notifications
- **Mark as Read**: Individual or bulk mark as read functionality
- **Notification Management**: Delete individual or clear all notifications

### ⚙️ User Settings
- **Theme Preferences**: Customize app appearance
- **Email Notifications**: Toggle email notification preferences
- **Automation Settings**: Configure auto-apply and status update preferences
- **Profile Management**: Update personal information and preferences

### 📧 Email Integration
- **Gmail OAuth**: Secure OAuth2 authentication for Gmail
- **Outlook OAuth**: Microsoft account integration
- **Yahoo OAuth**: Yahoo Mail integration
- **IMAP Support**: Generic IMAP server connection for other providers
- **Email Monitoring**: Automatic application status tracking from email responses

### 📤 Export Features
- **CSV Export**: Export saved jobs to CSV format
- **PDF Export**: Generate PDF reports of saved jobs
- **Data Export**: GDPR-compliant user data export

### 💾 Offline Support
- **IndexedDB Persistence**: Local storage of application state
- **Offline Queue**: Queue actions when offline, sync when connection restored
- **Background Sync**: Automatic synchronization of pending operations

## Tech Stack

- **Next.js 14** - App Router with Server Components
- **React 18** - UI library with hooks
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animation library for swipe gestures
- **SWR** - Data fetching and caching
- **NextAuth.js** - Authentication with OAuth support

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (for the backend)

### Environment Setup

1. Clone both repositories:
```bash
git clone https://github.com/aliassar/job-swiper.git
git clone https://github.com/aliassar/job-swiper-server.git
```

2. Set up the backend server first:
```bash
cd job-swiper-server
cp .env.example .env
# Edit .env with your database credentials and JWT secret
npm install
npm run db:migrate
npm run dev
```

3. Set up the frontend:
```bash
cd job-swiper
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL to your backend URL
# Example: NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev
```

### Connecting Frontend to Backend

The frontend communicates with the backend via the `NEXT_PUBLIC_API_URL` environment variable.

| Environment | Frontend URL | Backend URL | NEXT_PUBLIC_API_URL |
|-------------|--------------|-------------|---------------------|
| Development | http://localhost:3000 | http://localhost:3001 | http://localhost:3001 |
| Production | https://job-swiper.vercel.app | https://job-swiper-server.vercel.app | https://job-swiper-server.vercel.app |

### Related Repositories

- **Frontend (this repo):** [aliassar/job-swiper](https://github.com/aliassar/job-swiper) - Next.js frontend application
- **Backend:** [aliassar/job-swiper-server](https://github.com/aliassar/job-swiper-server) - Hono.js API server

### Architecture Overview

```
┌─────────────────────┐     HTTP/REST      ┌─────────────────────┐
│                     │ ◄───────────────── │                     │
│   job-swiper        │                    │  job-swiper-server  │
│   (Next.js)         │ ──────────────────►│  (Hono.js)          │
│                     │    JSON + JWT      │                     │
└─────────────────────┘                    └─────────────────────┘
        │                                           │
        │                                           │
        ▼                                           ▼
   localStorage                              PostgreSQL
   (JWT tokens)                              (Drizzle ORM)
```

### API Authentication

All API requests (except auth endpoints) require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Project Structure

```
job-swiper/
├── app/
│   ├── api/                    # API route handlers (proxies to backend)
│   │   ├── applications/       # Application management endpoints
│   │   ├── email-connections/  # Email integration endpoints
│   │   ├── history/            # Action history endpoint
│   │   ├── jobs/               # Job swiping endpoints
│   │   ├── notifications/      # Notification endpoints
│   │   ├── reported/           # Reported jobs endpoint
│   │   ├── saved/              # Saved jobs & export endpoints
│   │   ├── settings/           # User settings endpoint
│   │   └── user/               # User management endpoints
│   ├── application/[id]/       # Single application detail page
│   ├── applications/           # Application tracking page
│   ├── connect-email/          # Email connection page
│   ├── history/                # Action history page
│   ├── job/[id]/               # Single job detail page
│   ├── login/                  # Authentication pages
│   ├── notifications/          # Notifications page
│   ├── reported/               # Reported jobs page
│   ├── saved/                  # Saved jobs page
│   ├── settings/               # App settings page
│   ├── skipped/                # Skipped jobs page
│   ├── user-settings/          # User profile settings page
│   ├── layout.js               # Root layout with navigation
│   └── page.js                 # Main swipe interface
├── components/
│   ├── ApplicationTimeline.jsx # Application progress timeline
│   ├── BottomNav.jsx           # Bottom navigation bar
│   ├── ErrorBoundary.jsx       # Error handling wrapper
│   ├── FloatingActions.jsx     # Swipe action buttons
│   ├── HamburgerMenu.jsx       # Side navigation menu
│   ├── HistoryItem.jsx         # History list item component
│   ├── JobCard.jsx             # Job card component
│   ├── NotificationBell.jsx    # Notification indicator
│   ├── OAuthCallbackHandler.jsx # OAuth callback handler
│   ├── ReportModal.jsx         # Job report dialog
│   ├── SavedJobsList.jsx       # Saved jobs list
│   ├── SearchInput.jsx         # Search component
│   ├── SessionProvider.jsx     # Auth session wrapper
│   ├── SwipeContainer.jsx      # Main swipe container
│   └── ToastContainer.jsx      # Toast notifications
├── context/
│   └── JobContext.jsx          # Global job state management
├── lib/
│   ├── api.js                  # Centralized API client
│   ├── constants.js            # App constants
│   ├── hooks/                  # Custom React hooks
│   │   ├── useNotifications.js # Notifications hook
│   │   ├── useSettings.js      # Settings hook
│   │   ├── useSWR.js           # SWR wrapper hook
│   │   └── useToast.js         # Toast notifications hook
│   ├── indexedDB.js            # Offline storage
│   ├── offlineQueue.js         # Offline operation queue
│   └── utils.js                # Utility functions
├── public/                     # Static assets
└── tests/                      # Playwright E2E tests
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Playwright E2E tests

## API Integration

All API calls are centralized in `lib/api.js` and proxy through Next.js API routes to the backend server.

### Jobs API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/jobs | Get pending jobs |
| GET | /api/jobs?search={query} | Search pending jobs |
| GET | /api/jobs?countOnly=true | Get remaining job count |
| POST | /api/jobs/:id/accept | Accept a job (creates application) |
| POST | /api/jobs/:id/reject | Reject a job |
| POST | /api/jobs/:id/skip | Skip a job for later |
| POST | /api/jobs/:id/save | Toggle save status |
| POST | /api/jobs/:id/rollback | Undo decision (move back to pending) |
| GET | /api/jobs/skipped | Get skipped jobs |
| GET | /api/jobs/skipped?search={query} | Search skipped jobs |
| GET | /api/jobs/filters | Get filter options (blocked companies) |
| POST | /api/jobs/:id/report | Report a job (requires reason) |
| POST | /api/jobs/:id/unreport | Remove report from job |

### Applications API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/applications | Get all applications |
| GET | /api/applications?search={query} | Search applications |
| GET | /api/applications/:id | Get application details |
| PUT | /api/applications/:id/stage | Update application stage |
| PUT | /api/applications/:id/notes | Update application notes |
| PUT | /api/applications/:id/documents | Update document URLs |
| GET | /api/applications/:id/documents | Get application documents |
| POST | /api/applications/:id/cv/confirm | Confirm CV is correct |
| POST | /api/applications/:id/cv/reupload | Reupload CV (FormData with file) |
| POST | /api/applications/:id/message/confirm | Confirm application message |
| PUT | /api/applications/:id/message | Update application message |
| GET | /api/applications/:id/download/resume | Download resume PDF |
| GET | /api/applications/:id/download/cover-letter | Download cover letter PDF |
| POST | /api/applications/:id/toggle-auto-status | Toggle auto status updates |

### Saved Jobs API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/saved | Get saved jobs |
| GET | /api/saved?search={query} | Search saved jobs |
| GET | /api/saved/export?format=csv | Export saved jobs to CSV |
| GET | /api/saved/export?format=pdf | Export saved jobs to PDF |

### Notifications API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | Get notifications with pagination |
| GET | /api/notifications?page={n}&limit={n} | Get paginated notifications |
| POST | /api/notifications/:id/read | Mark notification as read |
| POST | /api/notifications/read-all | Mark all notifications as read |
| DELETE | /api/notifications/:id | Delete single notification |
| DELETE | /api/notifications | Clear all notifications |
| GET | /api/notifications/unread-count | Get unread notification count |
| GET | /api/notifications/stream | SSE endpoint for real-time updates |

### Email Connections API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/email-connections | List all email connections |
| POST | /api/email-connections/gmail | Connect Gmail (starts OAuth flow) |
| POST | /api/email-connections/outlook | Connect Outlook (starts OAuth flow) |
| POST | /api/email-connections/yahoo | Connect Yahoo (starts OAuth flow) |
| POST | /api/email-connections/imap | Connect via IMAP (requires credentials) |
| DELETE | /api/email-connections/:id | Remove email connection |
| POST | /api/email-connections/:id/test | Test email connection |
| POST | /api/email-connections/:id/sync | Sync credentials to stage updater |

### User Settings API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/settings | Get user settings |
| PUT | /api/settings | Update user settings |
| POST | /api/users/me/export | Export user data (GDPR compliance) |
| DELETE | /api/users/me | Delete user account |

### Other APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/history | Get action history |
| GET | /api/reported | Get reported jobs |
| GET | /api/reported?search={query} | Search reported jobs |

For detailed API documentation including request/response examples, see [docs/API.md](docs/API.md).

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# NextAuth.js Configuration
NEXTAUTH_SECRET=           # Generate with: openssl rand -base64 32
NEXTAUTH_URL=              # Your app URL (http://localhost:3000 for dev)

# OAuth Providers
GITHUB_CLIENT_ID=          # GitHub OAuth app client ID
GITHUB_CLIENT_SECRET=      # GitHub OAuth app client secret
GOOGLE_CLIENT_ID=          # Google OAuth client ID
GOOGLE_CLIENT_SECRET=      # Google OAuth client secret

# Backend API
NEXT_PUBLIC_API_URL=       # Backend server URL (e.g., http://localhost:5000 or https://api.jobswiper.app)
```

### Setting up OAuth Providers

**GitHub OAuth:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL to `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env.local`

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Add `http://localhost:3000` to Authorized JavaScript origins
4. Add `http://localhost:3000/api/auth/callback/google` to Authorized redirect URIs
5. Copy Client ID and Client Secret to `.env.local`

## Backend Integration

This frontend application is designed to work with the [job-swipper-server](https://github.com/aliassar/job-swipper-server) backend.

### Architecture Overview

- **Frontend (this repo)**: Next.js application handling UI and user interactions
- **Backend**: Express.js server managing database, job scraping, and email integration
- **Communication**: RESTful API with JSON payloads
- **Authentication**: NextAuth.js for frontend auth, JWT tokens for API requests

### Setting up the Backend

1. Clone the backend repository:
```bash
git clone https://github.com/aliassar/job-swipper-server.git
cd job-swipper-server
```

2. Follow the backend README for setup instructions

3. Start the backend server (default port: 5000)

4. Configure frontend to connect:
```bash
# In job-swiper/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### API Proxy Pattern

The frontend uses Next.js API routes as a proxy layer to the backend:

```
Frontend Component → Next.js API Route → Backend Server → Database
```

This architecture provides:
- **Type Safety**: Centralized API client with consistent error handling
- **Security**: Sensitive operations don't expose backend directly
- **Flexibility**: Easy to switch backends or add caching layer
- **Offline Support**: Queue operations when backend is unavailable

## Architecture

This application uses a sophisticated state machine architecture for managing swipe gestures and offline-first data synchronization. 

### Key Design Patterns

- **State Machine**: Deterministic swipe state management (see [ARCHITECTURE.md](ARCHITECTURE.md))
- **Offline Queue**: Queue actions when offline, sync when connection restored
- **Optimistic UI**: Immediate UI updates with background API synchronization
- **Error Boundaries**: Graceful error handling with recovery options

For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Usage

1. **Browse Jobs**: The main screen shows full-screen job cards you can swipe through
2. **Make Decisions**:
   - Swipe right or tap ✅ to accept
   - Swipe left or tap ❌ to reject
   - Tap ⏭️ to skip for later review
   - Tap ❤️ to mark as saved
3. **Navigate**: Tap the hamburger menu (top-left) to access different sections
4. **View Saved**: See all jobs you've marked as saved
5. **Track Applications**: Monitor your accepted jobs and update their status
6. **Review Skipped**: Browse jobs you skipped and add them back to your queue
7. **Undo Actions**: Use the floating rollback button (bottom-right) to undo recent actions
8. **Connect Email**: Link your email account for automatic status updates
9. **Get Notifications**: Receive real-time updates on application progress

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details
