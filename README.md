# Job Swiper 💼

A mobile-first job swiping application built with Next.js, where users can swipe through job listings similar to Tinder. Find your dream job by swiping right to accept or left to reject!

## Features

### 🎯 Core Functionality
- **Swipe Interface**: Smooth, intuitive swiping with Framer Motion animations
  - Swipe right (or tap ✅) to accept jobs
  - Swipe left (or tap ❌) to reject jobs
  - Visual feedback with green/red indicators
  - Card stack effect showing upcoming jobs

### 💼 Job Cards
Each job card displays:
- Company logo (dynamically generated)
- Company name and location
- Job position/title
- Skills required (as tags)
- Job posting date (relative time)
- Job description preview
- Favorite toggle (heart icon)

### ❤️ Favorites System
- Mark jobs as favorites from any card
- Dedicated favorites tab to view all saved jobs
- Quick unfavorite from the favorites view

### 📋 History & Rollback
- Complete history of all accepted and rejected jobs
- Visual status indicators (accepted/rejected)
- **Rollback feature** - undo any decision and bring the job back to the swipe queue
- History sorted by most recent action

### 🔄 Server Integration
- RESTful API routes for all operations
- Mock data with 20 diverse job listings
- Jobs sorted by posting date (newest first)

## Tech Stack

- **Next.js 14** - App Router
- **React 18** - UI components
- **Tailwind CSS** - Styling
- **Framer Motion** - Swipe animations
- **Heroicons** - Icon library

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

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

The app is optimized for mobile viewports (375px - 428px width) but works on all screen sizes.

## Project Structure

```
job-swiper/
├── app/
│   ├── api/
│   │   ├── jobs/
│   │   │   ├── route.js         # Main jobs endpoint
│   │   │   ├── accept/route.js  # Accept job endpoint
│   │   │   ├── reject/route.js  # Reject job endpoint
│   │   │   ├── favorite/route.js # Toggle favorite endpoint
│   │   │   └── rollback/route.js # Rollback decision endpoint
│   │   └── history/
│   │       └── route.js         # History endpoint
│   ├── favorites/
│   │   └── page.js              # Favorites view
│   ├── history/
│   │   └── page.js              # History view
│   ├── globals.css              # Global styles
│   ├── layout.js                # Root layout with navigation
│   └── page.js                  # Main swipe interface
├── components/
│   ├── BottomNav.jsx            # Bottom navigation bar
│   ├── FavoritesList.jsx        # Favorites list component
│   ├── HistoryItem.jsx          # History item component
│   ├── JobCard.jsx              # Individual job card
│   └── SwipeContainer.jsx       # Main swipe container
├── context/
│   └── JobContext.jsx           # Global state management
├── lib/
│   └── mockJobs.js              # Mock job data
└── public/                      # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

## Usage

1. **Browse Jobs**: The main screen shows job cards you can swipe through
2. **Accept/Reject**: Swipe right or tap ✅ to accept, swipe left or tap ❌ to reject
3. **Favorite Jobs**: Tap the heart icon to save jobs for later
4. **View Favorites**: Navigate to the Favorites tab to see all your saved jobs
5. **Check History**: View your decision history in the History tab
6. **Undo Mistakes**: Use the rollback button in History to undo any decision

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

- `GET /api/jobs` - Fetch all jobs
- `POST /api/jobs/accept` - Mark job as accepted
- `POST /api/jobs/reject` - Mark job as rejected
- `POST /api/jobs/favorite` - Toggle favorite status
- `POST /api/jobs/rollback` - Rollback a decision
- `GET /api/history` - Get decision history

## Mock Data

The app includes 20 diverse mock jobs from various companies:
- Tech companies (Google, Microsoft, Meta, etc.)
- Various locations and roles
- Different skill sets (React, Python, AWS, etc.)
- Realistic job descriptions
- Different posting dates

## Future Enhancements

Potential features for future releases:
- User authentication
- Real job API integration
- Advanced filtering
- Job search functionality
- Application tracking
- Push notifications
- Social sharing

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
