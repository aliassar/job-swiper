# Job Swiper API Documentation

## Overview
This document describes the API endpoints and database schema required for the Job Swiper backend.

## Authentication
(To be implemented - recommend using NextAuth.js or Clerk for Vercel)

All authenticated endpoints should include the user's ID from the authentication session.

## API Endpoints

### Jobs

#### GET /api/jobs
Fetch available jobs for the user to swipe on.

**Response:**
```json
{
  "jobs": [
    {
      "id": "string (UUID)",
      "company": "string",
      "position": "string",
      "location": "string",
      "description": "string",
      "skills": ["string"],
      "postedDate": "ISO 8601 date string",
      "salary": "string (optional)",
      "jobType": "full-time | part-time | contract",
      "remote": "boolean"
    }
  ]
}
```

#### POST /api/jobs/accept
Mark a job as accepted (user swiped right).

**Request Body:**
```json
{
  "jobId": "string",
  "userId": "string (from auth)"
}
```

**Response:**
```json
{
  "success": true,
  "userJob": {
    "id": "string",
    "jobId": "string",
    "userId": "string",
    "status": "applied",
    "acceptedAt": "ISO 8601 date string"
  }
}
```

#### POST /api/jobs/reject
Mark a job as rejected (user swiped left).

**Request Body:**
```json
{
  "jobId": "string",
  "userId": "string"
}
```

**Response:**
```json
{
  "success": true
}
```

#### POST /api/jobs/skip
Mark a job as skipped (user clicked skip button).

**Request Body:**
```json
{
  "jobId": "string",
  "userId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "skippedJob": {
    "id": "string",
    "jobId": "string",
    "userId": "string",
    "skippedAt": "ISO 8601 date string"
  }
}
```

#### POST /api/jobs/unskip
Restore a skipped job back to the queue.

**Request Body:**
```json
{
  "jobId": "string",
  "userId": "string"
}
```

**Response:**
```json
{
  "success": true
}
```

#### POST /api/jobs/rollback
Undo a previous action (accept/reject/skip).

**Request Body:**
```json
{
  "jobId": "string",
  "userId": "string",
  "previousAction": "accepted | rejected | skipped"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Action rolled back",
  "jobId": "string",
  "previousAction": "string"
}
```

#### POST /api/jobs/favorite
Toggle favorite status for a job.

**Request Body:**
```json
{
  "jobId": "string",
  "userId": "string",
  "favorite": "boolean"
}
```

**Response:**
```json
{
  "success": true,
  "isFavorite": "boolean"
}
```

### User Jobs (Status/Pipeline)

#### GET /api/user/jobs
Get all jobs the user has interacted with.

**Query Parameters:**
- `status`: Filter by status (applied, in_review, interview, offer, hired, rejected_by_company)
- `type`: Filter by interaction type (accepted, rejected, skipped, favorited)

**Response:**
```json
{
  "userJobs": [
    {
      "id": "string",
      "job": {
        "id": "string",
        "company": "string",
        "position": "string",
        "location": "string",
        "description": "string",
        "skills": ["string"],
        "postedDate": "ISO 8601 date string",
        "salary": "string (optional)",
        "jobType": "full-time | part-time | contract",
        "remote": "boolean"
      },
      "status": "applied | in_review | interview | offer | hired | rejected_by_company",
      "action": "accepted | rejected | skipped",
      "isFavorite": "boolean",
      "createdAt": "ISO 8601 date string",
      "updatedAt": "ISO 8601 date string",
      "statusHistory": [
        {
          "status": "string",
          "changedAt": "ISO 8601 date string"
        }
      ]
    }
  ]
}
```

#### PATCH /api/user/jobs/:id/status
Update the status of a user's job application.

**URL Parameters:**
- `id`: User job ID (UUID)

**Request Body:**
```json
{
  "status": "applied | in_review | interview | offer | hired | rejected_by_company"
}
```

**Response:**
```json
{
  "success": true,
  "userJob": {
    "id": "string",
    "status": "string",
    "updatedAt": "ISO 8601 date string"
  }
}
```

### Skipped Jobs

#### GET /api/user/skipped
Get all skipped jobs for the user.

**Response:**
```json
{
  "skippedJobs": [
    {
      "id": "string",
      "job": {
        "id": "string",
        "company": "string",
        "position": "string",
        "location": "string",
        "description": "string",
        "skills": ["string"],
        "postedDate": "ISO 8601 date string",
        "salary": "string (optional)",
        "jobType": "full-time | part-time | contract",
        "remote": "boolean"
      },
      "skippedAt": "ISO 8601 date string"
    }
  ]
}
```

## Database Schema

### Tables/Collections

#### jobs
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company | VARCHAR(255) | Company name |
| position | VARCHAR(255) | Job title |
| location | VARCHAR(255) | Job location |
| description | TEXT | Job description |
| skills | JSON/ARRAY | Required skills |
| posted_date | TIMESTAMP | When job was posted |
| salary | VARCHAR(100) | Salary range (optional) |
| job_type | ENUM | full-time, part-time, contract |
| remote | BOOLEAN | Remote work available |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Record update time |

#### users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | User email (unique) |
| name | VARCHAR(255) | User name |
| created_at | TIMESTAMP | Account creation time |

#### user_jobs
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| job_id | UUID | Foreign key to jobs |
| action | ENUM | accepted, rejected, skipped |
| status | ENUM | applied, in_review, interview, offer, hired, rejected_by_company |
| is_favorite | BOOLEAN | Whether job is favorited |
| created_at | TIMESTAMP | When action was taken |
| updated_at | TIMESTAMP | Last status update |

#### user_job_status_history
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_job_id | UUID | Foreign key to user_jobs |
| status | ENUM | The status at this point |
| changed_at | TIMESTAMP | When status changed |

## Vercel Stack Recommendations (Hobby Tier)

### Database Options:
1. **Vercel Postgres** (Recommended) - Free tier: 256MB storage
   - Native integration with Vercel
   - PostgreSQL with automatic scaling
   - Built-in connection pooling

2. **PlanetScale** - MySQL-compatible, generous free tier
   - 5GB storage
   - 1 billion row reads/month
   - Branching for development

3. **Supabase** - PostgreSQL with real-time features
   - 500MB database
   - Real-time subscriptions
   - Built-in auth and storage

### ORM:
- **Prisma** (Recommended) - Works great with Vercel
  - Type-safe database access
  - Automatic migrations
  - Great developer experience
  - Works with all database options above

### Authentication:
- **NextAuth.js** - Free, open-source authentication for Next.js
  - OAuth providers (Google, GitHub, etc.)
  - Email/password authentication
  - JWT sessions

- **Clerk** - Modern authentication with free tier
  - 5,000 monthly active users free
  - Pre-built UI components
  - Social login support

### Environment Variables:
```env
# Database
DATABASE_URL=your_database_connection_string

# Authentication (NextAuth.js)
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=https://your-app.vercel.app

# Or Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
```

## Implementation Roadmap

### Phase 1: Database Setup
1. Choose and set up database (Vercel Postgres recommended)
2. Install and configure Prisma
3. Create Prisma schema based on tables above
4. Run initial migration

### Phase 2: Authentication
1. Install NextAuth.js or Clerk
2. Configure authentication providers
3. Add authentication middleware to API routes
4. Update API routes to use authenticated user ID

### Phase 3: API Implementation
1. Replace mock implementations in API routes with real database calls
2. Add error handling and validation
3. Implement pagination where needed
4. Add rate limiting for production

### Phase 4: Testing & Deployment
1. Test all API endpoints
2. Set up environment variables in Vercel
3. Deploy to Vercel
4. Monitor and optimize performance

## Example Prisma Schema

```prisma
// This is your Prisma schema file

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  userJobs  UserJob[]

  @@map("users")
}

model Job {
  id          String   @id @default(uuid())
  company     String
  position    String
  location    String
  description String   @db.Text
  skills      String[]
  postedDate  DateTime @map("posted_date")
  salary      String?
  jobType     JobType  @map("job_type")
  remote      Boolean  @default(false)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  userJobs    UserJob[]

  @@map("jobs")
}

model UserJob {
  id            String                  @id @default(uuid())
  userId        String                  @map("user_id")
  jobId         String                  @map("job_id")
  action        UserAction
  status        JobStatus               @default(applied)
  isFavorite    Boolean                 @default(false) @map("is_favorite")
  createdAt     DateTime                @default(now()) @map("created_at")
  updatedAt     DateTime                @updatedAt @map("updated_at")
  user          User                    @relation(fields: [userId], references: [id])
  job           Job                     @relation(fields: [jobId], references: [id])
  statusHistory UserJobStatusHistory[]

  @@map("user_jobs")
}

model UserJobStatusHistory {
  id         String   @id @default(uuid())
  userJobId  String   @map("user_job_id")
  status     JobStatus
  changedAt  DateTime @default(now()) @map("changed_at")
  userJob    UserJob  @relation(fields: [userJobId], references: [id])

  @@map("user_job_status_history")
}

enum JobType {
  full_time
  part_time
  contract
}

enum UserAction {
  accepted
  rejected
  skipped
}

enum JobStatus {
  applied
  in_review
  interview
  offer
  hired
  rejected_by_company
}
```

## API Client Usage (Frontend)

The frontend uses `/lib/api.js` as a centralized API client. This makes it easy to:
- Handle authentication tokens
- Add request/response interceptors
- Switch between mock and real backend
- Handle errors consistently

See `/lib/api.js` for the implementation.
