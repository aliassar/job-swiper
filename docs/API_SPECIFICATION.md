# Job Swiper API Specification

This document describes the complete API specification for the Job Swiper application. The current implementation uses in-memory mock storage, but this specification is designed for a production backend deployment on Vercel with Postgres database.

## Table of Contents
1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
3. [Database Schema](#database-schema)
4. [Session Management](#session-management)
5. [Migration Guide](#migration-guide)

---

## Authentication

**Note**: Authentication is not yet implemented in the mock API. In production, use JWT tokens with session management.

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## API Endpoints

### Jobs

#### GET /api/jobs
Get all pending jobs for the current user.

**Query Parameters:**
- `limit` (optional): Number of jobs to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "jobs": [
    {
      "id": 1,
      "company": "Google",
      "position": "Senior Software Engineer",
      "location": "Mountain View, CA",
      "skills": ["React", "Node.js", "Python", "Kubernetes"],
      "description": "Join our team to build next-generation cloud infrastructure...",
      "postedDate": "2024-01-15T10:30:00Z",
      "logo": "https://example.com/logos/google.png"
    }
  ],
  "total": 20,
  "hasMore": false
}
```

---

#### POST /api/jobs/:id/accept
Accept a job posting.

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": 1,
    "company": "Google",
    "position": "Senior Software Engineer"
  },
  "application": {
    "id": 101,
    "jobId": 1,
    "stage": "Applied",
    "appliedAt": "2024-01-20T14:30:00Z"
  }
}
```

---

#### POST /api/jobs/:id/reject
Reject a job posting.

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "jobId": 1,
  "status": "rejected",
  "decisionAt": "2024-01-20T14:30:00Z"
}
```

---

#### POST /api/jobs/:id/skip
Skip a job posting (can be reviewed later).

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "jobId": 1,
  "status": "skipped",
  "skippedAt": "2024-01-20T14:30:00Z"
}
```

---

#### POST /api/jobs/:id/favorite
Toggle favorite status for a job.

**Request:**
```json
{
  "favorite": true
}
```

**Response:**
```json
{
  "success": true,
  "jobId": 1,
  "favorite": true
}
```

---

#### POST /api/jobs/:id/rollback
Rollback a decision and move job back to pending status.

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": 1,
    "company": "Google",
    "position": "Senior Software Engineer",
    "status": "pending"
  }
}
```

---

#### GET /api/jobs/skipped
Get all skipped jobs for the current user.

**Response:**
```json
{
  "jobs": [
    {
      "id": 5,
      "company": "Apple",
      "position": "iOS Developer",
      "location": "Cupertino, CA",
      "skippedAt": "2024-01-20T14:30:00Z"
    }
  ],
  "total": 3
}
```

---

### Favorites

#### GET /api/favorites
Get all favorited jobs.

**Response:**
```json
{
  "favorites": [
    {
      "id": 2,
      "company": "Microsoft",
      "position": "Frontend Developer",
      "location": "Seattle, WA",
      "skills": ["React", "TypeScript", "Azure", "CSS"],
      "favoritedAt": "2024-01-20T14:30:00Z"
    }
  ],
  "total": 5
}
```

---

### Applications

#### GET /api/applications
Get all accepted jobs with their application stage.

**Response:**
```json
{
  "applications": [
    {
      "id": 101,
      "jobId": 1,
      "company": "Google",
      "position": "Senior Software Engineer",
      "location": "Mountain View, CA",
      "stage": "Phone Screen",
      "appliedAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-18T14:20:00Z"
    }
  ],
  "total": 3
}
```

**Application Stages:**
- `Applied` - Initial application submitted
- `Phone Screen` - Phone screening scheduled/completed
- `Interview` - In interview process
- `Offer` - Received job offer
- `Rejected` - Application rejected
- `Accepted` - Offer accepted
- `Withdrawn` - Application withdrawn

---

#### PUT /api/applications/:id/stage
Update the stage of an application.

**Request:**
```json
{
  "stage": "Interview"
}
```

**Response:**
```json
{
  "success": true,
  "application": {
    "id": 101,
    "jobId": 1,
    "stage": "Interview",
    "updatedAt": "2024-01-20T15:30:00Z"
  }
}
```

---

### History

#### GET /api/history
Get full action history (for logging and debugging purposes).

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "history": [
    {
      "id": 1001,
      "jobId": 1,
      "action": "accepted",
      "timestamp": "2024-01-20T14:30:00Z",
      "metadata": {
        "company": "Google",
        "position": "Senior Software Engineer"
      }
    },
    {
      "id": 1002,
      "jobId": 2,
      "action": "rejected",
      "timestamp": "2024-01-20T14:32:00Z"
    }
  ],
  "total": 15
}
```

**Action Types:**
- `accepted` - Job was accepted
- `rejected` - Job was rejected
- `skipped` - Job was skipped
- `favorited` - Job was favorited
- `unfavorited` - Job was unfavorited
- `rollback` - Decision was rolled back

---

## Database Schema

### Recommended Tech Stack
- **Database**: Vercel Postgres (or any PostgreSQL)
- **ORM**: Prisma
- **Deployment**: Vercel

### Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model (for future authentication)
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  jobStatuses  UserJobStatus[]
  applications Application[]
  actionHistory ActionHistory[]

  @@map("users")
}

// Job postings
model Job {
  id          Int      @id @default(autoincrement())
  company     String
  position    String
  location    String
  skills      String[] // Array of skill names
  description String   @db.Text
  postedDate  DateTime
  logo        String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  userStatuses UserJobStatus[]
  applications Application[]

  @@map("jobs")
  @@index([postedDate])
}

// User's job status (pending, accepted, rejected, skipped, favorited)
model UserJobStatus {
  id        String   @id @default(uuid())
  userId    String
  jobId     Int
  status    JobStatus @default(PENDING)
  favorite  Boolean   @default(false)
  
  acceptedAt DateTime?
  rejectedAt DateTime?
  skippedAt  DateTime?
  decisionAt DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  job  Job  @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@unique([userId, jobId])
  @@map("user_job_status")
  @@index([userId, status])
}

enum JobStatus {
  PENDING
  ACCEPTED
  REJECTED
  SKIPPED
}

// Application tracking for accepted jobs
model Application {
  id        String   @id @default(uuid())
  userId    String
  jobId     Int
  stage     ApplicationStage @default(APPLIED)
  
  appliedAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  job  Job  @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@unique([userId, jobId])
  @@map("applications")
  @@index([userId])
}

enum ApplicationStage {
  APPLIED
  PHONE_SCREEN
  INTERVIEW
  OFFER
  REJECTED
  ACCEPTED
  WITHDRAWN
}

// Action history for logging
model ActionHistory {
  id        String   @id @default(uuid())
  userId    String
  jobId     Int
  action    ActionType
  metadata  Json?    // Additional data about the action
  
  createdAt DateTime @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("action_history")
  @@index([userId, createdAt])
  @@index([jobId])
}

enum ActionType {
  ACCEPTED
  REJECTED
  SKIPPED
  FAVORITED
  UNFAVORITED
  ROLLBACK
  STAGE_UPDATED
}
```

### SQL Schema (Alternative)

If not using Prisma, here's the equivalent SQL:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  company VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  skills TEXT[] NOT NULL,
  description TEXT NOT NULL,
  posted_date TIMESTAMP NOT NULL,
  logo VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_posted_date ON jobs(posted_date);

-- User job status table
CREATE TYPE job_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'SKIPPED');

CREATE TABLE user_job_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status job_status DEFAULT 'PENDING',
  favorite BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  skipped_at TIMESTAMP,
  decision_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, job_id)
);

CREATE INDEX idx_user_job_status_user_status ON user_job_status(user_id, status);

-- Applications table
CREATE TYPE application_stage AS ENUM (
  'APPLIED', 'PHONE_SCREEN', 'INTERVIEW', 
  'OFFER', 'REJECTED', 'ACCEPTED', 'WITHDRAWN'
);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stage application_stage DEFAULT 'APPLIED',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, job_id)
);

CREATE INDEX idx_applications_user ON applications(user_id);

-- Action history table
CREATE TYPE action_type AS ENUM (
  'ACCEPTED', 'REJECTED', 'SKIPPED', 
  'FAVORITED', 'UNFAVORITED', 'ROLLBACK', 'STAGE_UPDATED'
);

CREATE TABLE action_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL,
  action action_type NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_action_history_user_created ON action_history(user_id, created_at);
CREATE INDEX idx_action_history_job ON action_history(job_id);
```

---

## Session Management

### Rollback Behavior

The rollback feature has two distinct layers:

#### Client-Side Session Stack (Current Implementation)
- Maintained in-memory on the client using React state
- Only tracks actions taken during the current app session
- Cleared when the app is closed or refreshed
- Allows users to quickly undo recent mistakes
- Does not require server-side session storage

#### Server-Side Action Processing
- Server does not maintain session state
- Server processes rollback requests by:
  1. Finding the job in user_job_status table
  2. Setting status back to 'PENDING'
  3. Removing from applications table if applicable
  4. Logging the rollback action in action_history
- Returns the job object so client can re-insert it into the swipe queue

**Implementation Notes:**
- The client maintains `sessionActions` array: `[{ jobId, action, timestamp }, ...]`
- When user clicks undo, pop from `sessionActions` and call `POST /api/jobs/:id/rollback`
- Server returns job with status='pending', client adds it back to the top of swipe stack
- Persisted actions from previous sessions are NOT eligible for rollback via this button

---

## Migration Guide

### Step 1: Set Up Vercel Postgres

1. Install Vercel Postgres in your Vercel dashboard
2. Get the connection string from environment variables
3. Add to `.env.local`:
```
DATABASE_URL="postgres://..."
NEXT_PUBLIC_API_URL=""
```

### Step 2: Set Up Prisma

1. Install Prisma:
```bash
npm install @prisma/client
npm install -D prisma
```

2. Initialize Prisma:
```bash
npx prisma init
```

3. Copy the schema from this document to `prisma/schema.prisma`

4. Run migration:
```bash
npx prisma migrate dev --name init
```

5. Generate Prisma Client:
```bash
npx prisma generate
```

### Step 3: Replace Mock API Routes

1. Update API routes in `/app/api/*` to use Prisma Client instead of in-memory storage
2. Add authentication middleware
3. Add user context to all requests

Example for `GET /api/jobs`:
```javascript
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get jobs that user hasn't decided on yet
  const jobs = await prisma.job.findMany({
    where: {
      NOT: {
        userStatuses: {
          some: {
            userId: user.id,
            status: { in: ['ACCEPTED', 'REJECTED', 'SKIPPED'] }
          }
        }
      }
    },
    orderBy: { postedDate: 'desc' },
    take: 50
  });

  return NextResponse.json({ jobs, total: jobs.length });
}
```

### Step 4: Environment Variables

Production environment variables needed:
```
DATABASE_URL=           # Vercel Postgres connection string
NEXTAUTH_SECRET=        # For authentication (if using NextAuth)
NEXTAUTH_URL=           # Your production URL
NEXT_PUBLIC_API_URL=    # Empty string (same domain)
```

### Step 5: Deploy

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

---

## Error Handling

All API endpoints should return consistent error responses:

```json
{
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Recommended rate limits for production:
- `/api/jobs/*` actions: 100 requests per minute per user
- `/api/applications/*`: 50 requests per minute per user
- `/api/history`: 10 requests per minute per user

Implement using Vercel Edge Config or Redis.

---

## Testing

Example test cases for API endpoints:

```javascript
describe('POST /api/jobs/:id/accept', () => {
  it('should accept a job and create an application', async () => {
    const response = await fetch('/api/jobs/1/accept', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer TOKEN' }
    });
    
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.application).toBeDefined();
    expect(data.application.stage).toBe('Applied');
  });
});
```

---

## Notes

- Current mock implementation uses module-level variables which are reset on server restart
- In production, use Vercel Postgres or another persistent database
- Add proper authentication before deploying to production
- Consider adding pagination for large datasets
- Add request validation using Zod or similar library
- Implement proper error logging (e.g., Sentry)
