# API Documentation

This document provides comprehensive documentation for all API endpoints used in Job Swiper. All endpoints are accessed through the centralized API client in `lib/api.js`.

## Base Configuration

```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
```

All API calls are proxied through Next.js API routes to the backend server configured via `NEXT_PUBLIC_API_URL`.

## Authentication

Most endpoints require authentication via NextAuth.js session. The session token is automatically included in requests.

## Error Handling

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Jobs API

### Get Pending Jobs

Retrieve all pending jobs that haven't been acted upon.

**Endpoint:** `GET /api/jobs`

**Query Parameters:**
- `search` (optional): Filter jobs by search query
- `countOnly` (optional): If true, returns only the count

**Request:**
```javascript
// Get all jobs
const response = await jobsApi.getJobs();

// Search jobs
const response = await jobsApi.getJobs('React Developer');

// Get count only
const response = await jobsApi.getJobCount();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job-123",
        "title": "Senior React Developer",
        "company": "Tech Corp",
        "location": "San Francisco, CA",
        "description": "We are looking for...",
        "skills": ["React", "TypeScript", "Node.js"],
        "salary": "$120k - $160k",
        "postedDate": "2024-01-15T10:30:00Z",
        "saved": false
      }
    ],
    "count": 25
  }
}
```

---

### Accept Job

Accept a job and create an application.

**Endpoint:** `POST /api/jobs/:id/accept`

**Request:**
```javascript
await jobsApi.acceptJob('job-123', {
  notes: 'Really interested in this position',
  customResume: 'url-to-custom-resume.pdf'
});
```

**Request Body:**
```json
{
  "notes": "Optional application notes",
  "customResume": "Optional custom resume URL",
  "customCoverLetter": "Optional custom cover letter URL"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applicationId": "app-456",
    "jobId": "job-123",
    "stage": "applied",
    "appliedAt": "2024-01-15T14:30:00Z"
  }
}
```

---

### Reject Job

Reject a job posting.

**Endpoint:** `POST /api/jobs/:id/reject`

**Request:**
```javascript
await jobsApi.rejectJob('job-123');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-123",
    "status": "rejected"
  }
}
```

---

### Skip Job

Skip a job for later review.

**Endpoint:** `POST /api/jobs/:id/skip`

**Request:**
```javascript
await jobsApi.skipJob('job-123');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-123",
    "status": "skipped",
    "skippedAt": "2024-01-15T14:30:00Z"
  }
}
```

---

### Toggle Save Job

Save or unsave a job.

**Endpoint:** `POST /api/jobs/:id/save`

**Request:**
```javascript
await jobsApi.toggleSaveJob('job-123', true);  // Save
await jobsApi.toggleSaveJob('job-123', false); // Unsave
```

**Request Body:**
```json
{
  "saved": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-123",
    "saved": true
  }
}
```

---

### Rollback Job Decision

Undo a decision and move job back to pending.

**Endpoint:** `POST /api/jobs/:id/rollback`

**Request:**
```javascript
await jobsApi.rollbackJob('job-123');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-123",
    "status": "pending",
    "previousStatus": "accepted"
  }
}
```

---

### Get Skipped Jobs

Retrieve all skipped jobs.

**Endpoint:** `GET /api/jobs/skipped`

**Query Parameters:**
- `search` (optional): Filter by search query

**Request:**
```javascript
const response = await jobsApi.getSkippedJobs();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job-789",
        "title": "Frontend Developer",
        "company": "StartupCo",
        "skippedAt": "2024-01-14T09:20:00Z"
      }
    ]
  }
}
```

---

### Get Filter Options

Get available filter options (blocked companies, etc.).

**Endpoint:** `GET /api/jobs/filters`

**Request:**
```javascript
const response = await jobsApi.getFilters();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "blockedCompanies": ["Company A", "Company B"],
    "categories": ["Engineering", "Design", "Product"]
  }
}
```

---

### Report Job

Report a job for review.

**Endpoint:** `POST /api/jobs/:id/report`

**Request:**
```javascript
await reportedApi.reportJob('job-123', 'fake', 'This looks like a scam');
```

**Request Body:**
```json
{
  "reason": "fake",  // Required: 'fake' | 'not_interested' | 'dont_recommend_company'
  "details": "Optional detailed explanation"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-123",
    "reported": true,
    "reason": "fake"
  }
}
```

---

### Unreport Job

Remove report from a job.

**Endpoint:** `POST /api/jobs/:id/unreport`

**Request:**
```javascript
await reportedApi.unreportJob('job-123');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-123",
    "reported": false
  }
}
```

---

## Applications API

### Get All Applications

Retrieve all job applications with their current stage.

**Endpoint:** `GET /api/applications`

**Query Parameters:**
- `search` (optional): Filter by search query

**Request:**
```javascript
const response = await applicationsApi.getApplications();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "app-456",
        "jobId": "job-123",
        "jobTitle": "Senior React Developer",
        "company": "Tech Corp",
        "stage": "interview",
        "appliedAt": "2024-01-15T14:30:00Z",
        "lastUpdated": "2024-01-18T10:00:00Z",
        "notes": "Had great conversation with hiring manager",
        "autoStatusEnabled": true
      }
    ]
  }
}
```

---

### Get Single Application

Get detailed information about a specific application.

**Endpoint:** `GET /api/applications/:id`

**Request:**
```javascript
const response = await applicationsApi.getApplication('app-456');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "app-456",
    "jobId": "job-123",
    "job": {
      "title": "Senior React Developer",
      "company": "Tech Corp",
      "location": "San Francisco, CA"
    },
    "stage": "interview",
    "appliedAt": "2024-01-15T14:30:00Z",
    "notes": "Had great conversation",
    "customResumeUrl": "https://...",
    "customCoverLetterUrl": "https://...",
    "cvVerified": true,
    "messageVerified": true,
    "autoStatusEnabled": true,
    "timeline": [
      {
        "stage": "applied",
        "timestamp": "2024-01-15T14:30:00Z"
      },
      {
        "stage": "phone_screen",
        "timestamp": "2024-01-17T09:00:00Z"
      }
    ]
  }
}
```

---

### Update Application Stage

Update the stage of an application.

**Endpoint:** `PUT /api/applications/:id/stage`

**Request:**
```javascript
await applicationsApi.updateStage('app-456', 'interview');
```

**Request Body:**
```json
{
  "stage": "interview"  // applied | phone_screen | interview | offer | rejected | accepted | withdrawn
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "app-456",
    "stage": "interview",
    "updatedAt": "2024-01-18T10:00:00Z"
  }
}
```

---

### Update Application Notes

Update notes for an application.

**Endpoint:** `PUT /api/applications/:id/notes`

**Request:**
```javascript
await applicationsApi.updateNotes('app-456', 'Great interview, team seemed nice');
```

**Request Body:**
```json
{
  "notes": "Updated notes text"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "app-456",
    "notes": "Great interview, team seemed nice",
    "updatedAt": "2024-01-18T10:00:00Z"
  }
}
```

---

### Update Application Documents

Update custom resume and cover letter URLs.

**Endpoint:** `PUT /api/applications/:id/documents`

**Request:**
```javascript
await applicationsApi.updateDocuments(
  'app-456',
  'https://example.com/resume.pdf',
  'https://example.com/cover.pdf'
);
```

**Request Body:**
```json
{
  "resumeUrl": "https://example.com/resume.pdf",
  "coverLetterUrl": "https://example.com/cover.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "app-456",
    "customResumeUrl": "https://example.com/resume.pdf",
    "customCoverLetterUrl": "https://example.com/cover.pdf"
  }
}
```

---

### Get Application Documents

Get document URLs for an application.

**Endpoint:** `GET /api/applications/:id/documents`

**Request:**
```javascript
const response = await applicationsApi.getDocuments('app-456');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resumeUrl": "https://example.com/resume.pdf",
    "coverLetterUrl": "https://example.com/cover.pdf",
    "hasCustomResume": true,
    "hasCustomCoverLetter": false
  }
}
```

---

### Confirm CV

Confirm that the CV is correct for this application.

**Endpoint:** `POST /api/applications/:id/cv/confirm`

**Request:**
```javascript
await applicationsApi.confirmCv('app-456');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "app-456",
    "cvVerified": true,
    "verifiedAt": "2024-01-18T10:00:00Z"
  }
}
```

---

### Reupload CV

Upload a new CV for this application.

**Endpoint:** `POST /api/applications/:id/cv/reupload`

**Request:**
```javascript
const file = document.getElementById('file-input').files[0];
await applicationsApi.reuploadCv('app-456', file);
```

**Request Body:** `FormData` with file

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "app-456",
    "customResumeUrl": "https://example.com/new-resume.pdf",
    "cvVerified": false
  }
}
```

---

### Confirm Message

Confirm the application message is correct.

**Endpoint:** `POST /api/applications/:id/message/confirm`

**Request:**
```javascript
await applicationsApi.confirmMessage('app-456');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "app-456",
    "messageVerified": true,
    "verifiedAt": "2024-01-18T10:00:00Z"
  }
}
```

---

### Update Message

Update the application message.

**Endpoint:** `PUT /api/applications/:id/message`

**Request:**
```javascript
await applicationsApi.updateMessage('app-456', 'Updated application message text');
```

**Request Body:**
```json
{
  "message": "Updated application message text"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "app-456",
    "message": "Updated application message text",
    "messageVerified": false
  }
}
```

---

### Download Resume

Get URL to download the resume PDF.

**Endpoint:** `GET /api/applications/:id/download/resume`

**Request:**
```javascript
const url = applicationsApi.downloadResume('app-456');
// Returns URL string, not a promise
window.location.href = url;
```

---

### Download Cover Letter

Get URL to download the cover letter PDF.

**Endpoint:** `GET /api/applications/:id/download/cover-letter`

**Request:**
```javascript
const url = applicationsApi.downloadCoverLetter('app-456');
window.location.href = url;
```

---

### Toggle Auto Status

Enable/disable automatic status updates for an application.

**Endpoint:** `POST /api/applications/:id/toggle-auto-status`

**Request:**
```javascript
await applicationsApi.toggleAutoStatus('app-456');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "app-456",
    "autoStatusEnabled": true
  }
}
```

---

## Saved Jobs API

### Get Saved Jobs

Retrieve all saved jobs.

**Endpoint:** `GET /api/saved`

**Query Parameters:**
- `search` (optional): Filter by search query

**Request:**
```javascript
const response = await savedJobsApi.getSavedJobs();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job-123",
        "title": "Senior React Developer",
        "company": "Tech Corp",
        "savedAt": "2024-01-15T14:30:00Z"
      }
    ]
  }
}
```

---

### Export to CSV

Get URL to export saved jobs as CSV.

**Endpoint:** `GET /api/saved/export?format=csv`

**Request:**
```javascript
const url = savedJobsApi.exportToCsv();
// Returns URL string
window.location.href = url;
```

---

### Export to PDF

Get URL to export saved jobs as PDF.

**Endpoint:** `GET /api/saved/export?format=pdf`

**Request:**
```javascript
const url = savedJobsApi.exportToPdf();
// Returns URL string
```

---

## Notifications API

### Get Notifications

Retrieve notifications with pagination.

**Endpoint:** `GET /api/notifications`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Request:**
```javascript
const response = await notificationsApi.getNotifications(1, 20);
```

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notif-123",
      "type": "application_update",
      "title": "Application Update",
      "message": "Tech Corp moved your application to Interview stage",
      "read": false,
      "createdAt": "2024-01-18T10:00:00Z",
      "data": {
        "applicationId": "app-456",
        "newStage": "interview"
      }
    }
  ],
  "unreadCount": 5
}
```

---

### Mark Notification as Read

Mark a single notification as read.

**Endpoint:** `POST /api/notifications/:id/read`

**Request:**
```javascript
await notificationsApi.markAsRead('notif-123');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "notif-123",
    "read": true
  }
}
```

---

### Mark All as Read

Mark all notifications as read.

**Endpoint:** `POST /api/notifications/read-all`

**Request:**
```javascript
await notificationsApi.markAllAsRead();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updatedCount": 5
  }
}
```

---

### Delete Notification

Delete a single notification.

**Endpoint:** `DELETE /api/notifications/:id`

**Request:**
```javascript
await notificationsApi.deleteNotification('notif-123');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "notif-123",
    "deleted": true
  }
}
```

---

### Clear All Notifications

Delete all notifications.

**Endpoint:** `DELETE /api/notifications`

**Request:**
```javascript
await notificationsApi.clearAll();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deletedCount": 10
  }
}
```

---

### Get Unread Count

Get count of unread notifications.

**Endpoint:** `GET /api/notifications/unread-count`

**Request:**
```javascript
const response = await notificationsApi.getUnreadCount();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

### Server-Sent Events Stream

Real-time notification updates via SSE.

**Endpoint:** `GET /api/notifications/stream`

**Client-Side Usage:**
```javascript
const eventSource = new EventSource(`${API_URL}/api/notifications/stream`);

eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log('New notification:', notification);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  eventSource.close();
};
```

---

## Email Connections API

### List Email Connections

Get all connected email accounts.

**Endpoint:** `GET /api/email-connections`

**Request:**
```javascript
const response = await emailApi.getConnections();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connections": [
      {
        "id": "conn-123",
        "provider": "gmail",
        "email": "user@gmail.com",
        "connected": true,
        "connectedAt": "2024-01-15T10:00:00Z",
        "lastSync": "2024-01-18T09:00:00Z"
      }
    ]
  }
}
```

---

### Connect Gmail

Start Gmail OAuth flow.

**Endpoint:** `POST /api/email-connections/gmail`

**Request:**
```javascript
const response = await emailApi.connectGmail();
// Response contains OAuth URL to redirect to
window.location.href = response.data.authUrl;
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

---

### Connect Outlook

Start Outlook OAuth flow.

**Endpoint:** `POST /api/email-connections/outlook`

**Request:**
```javascript
const response = await emailApi.connectOutlook();
window.location.href = response.data.authUrl;
```

---

### Connect Yahoo

Start Yahoo OAuth flow.

**Endpoint:** `POST /api/email-connections/yahoo`

**Request:**
```javascript
const response = await emailApi.connectYahoo();
window.location.href = response.data.authUrl;
```

---

### Connect IMAP

Connect via generic IMAP.

**Endpoint:** `POST /api/email-connections/imap`

**Request:**
```javascript
await emailApi.connectImap(
  'user@example.com',
  'imap.example.com',
  993,
  'username',
  'password'
);
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "host": "imap.example.com",
  "port": 993,
  "username": "username",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "conn-456",
    "provider": "imap",
    "email": "user@example.com",
    "connected": true
  }
}
```

---

### Disconnect Email

Remove an email connection.

**Endpoint:** `DELETE /api/email-connections/:id`

**Request:**
```javascript
await emailApi.disconnect('conn-123');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "conn-123",
    "disconnected": true
  }
}
```

---

### Test Connection

Test if an email connection is working.

**Endpoint:** `POST /api/email-connections/:id/test`

**Request:**
```javascript
const response = await emailApi.testConnection('conn-123');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "conn-123",
    "status": "active",
    "lastTest": "2024-01-18T10:00:00Z"
  }
}
```

---

### Sync Connection

Sync credentials to the stage updater service.

**Endpoint:** `POST /api/email-connections/:id/sync`

**Request:**
```javascript
await emailApi.syncConnection('conn-123');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "conn-123",
    "synced": true,
    "syncedAt": "2024-01-18T10:00:00Z"
  }
}
```

---

## User Settings API

### Get User Settings

Retrieve user settings and preferences.

**Endpoint:** `GET /api/settings`

**Request:**
```javascript
const response = await userApi.getSettings();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": "dark",
    "emailNotifications": true,
    "autoApply": false,
    "autoStatusUpdates": true,
    "defaultResumeUrl": "https://...",
    "defaultCoverLetterUrl": "https://...",
    "preferences": {
      "showTutorial": false,
      "compactView": false
    }
  }
}
```

---

### Update User Settings

Update user settings.

**Endpoint:** `PUT /api/settings`

**Request:**
```javascript
await userApi.updateSettings({
  theme: 'dark',
  emailNotifications: true,
  autoApply: false
});
```

**Request Body:**
```json
{
  "theme": "dark",
  "emailNotifications": true,
  "autoApply": false,
  "autoStatusUpdates": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": "dark",
    "emailNotifications": true,
    "updatedAt": "2024-01-18T10:00:00Z"
  }
}
```

---

### Export User Data

Export all user data (GDPR compliance).

**Endpoint:** `POST /api/users/me/export`

**Request:**
```javascript
const response = await userApi.exportData();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exportUrl": "https://example.com/exports/user-data-123.json",
    "expiresAt": "2024-01-19T10:00:00Z"
  }
}
```

---

### Delete Account

Permanently delete user account.

**Endpoint:** `DELETE /api/users/me`

**Request:**
```javascript
await userApi.deleteAccount();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "deletedAt": "2024-01-18T10:00:00Z"
  }
}
```

---

## Other APIs

### Get Action History

Retrieve history of all user actions.

**Endpoint:** `GET /api/history`

**Request:**
```javascript
const response = await historyApi.getHistory();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "hist-123",
        "action": "accept",
        "jobId": "job-123",
        "timestamp": "2024-01-18T10:00:00Z",
        "metadata": {
          "notes": "Great opportunity"
        }
      }
    ]
  }
}
```

---

### Get Reported Jobs

Retrieve all reported jobs.

**Endpoint:** `GET /api/reported`

**Query Parameters:**
- `search` (optional): Filter by search query

**Request:**
```javascript
const response = await reportedApi.getReportedJobs();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job-789",
        "title": "Suspicious Job",
        "company": "Fake Corp",
        "reportedAt": "2024-01-17T15:00:00Z",
        "reason": "fake",
        "details": "This looks like a scam"
      }
    ]
  }
}
```

---

## Rate Limiting

API endpoints may be rate-limited to prevent abuse:

- **Standard endpoints**: 100 requests per minute
- **Export endpoints**: 10 requests per hour
- **Email operations**: 20 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642512000
```

---

## Caching

The frontend uses SWR for data fetching and caching:

- **Jobs**: Revalidate on focus, 30s stale time
- **Applications**: Revalidate on mutation, 60s stale time
- **Notifications**: Real-time via SSE, 10s polling fallback
- **Settings**: Revalidate on window focus, 5min stale time

---

## Best Practices

1. **Always handle errors** - All API calls can fail
2. **Use TypeScript types** - Define interfaces for API responses
3. **Implement retry logic** - Use exponential backoff for failed requests
4. **Cache aggressively** - Use SWR or React Query for caching
5. **Optimize bundle size** - Import only needed API modules
6. **Monitor performance** - Track API call latency and error rates
7. **Handle offline** - Queue operations when backend is unavailable

---

## Example Usage

### Complete Application Flow

```javascript
import { jobsApi, applicationsApi } from '@/lib/api';

// 1. Get jobs
const { data: jobs } = await jobsApi.getJobs();

// 2. Accept a job
const { data: application } = await jobsApi.acceptJob(jobs[0].id, {
  notes: 'Perfect fit for my skills'
});

// 3. Update application stage
await applicationsApi.updateStage(application.applicationId, 'interview');

// 4. Confirm CV
await applicationsApi.confirmCv(application.applicationId);

// 5. Confirm message
await applicationsApi.confirmMessage(application.applicationId);
```

### Error Handling

```javascript
try {
  await jobsApi.acceptJob(jobId);
} catch (error) {
  if (error.message.includes('already accepted')) {
    toast.error('You already applied to this job');
  } else if (error.message.includes('not found')) {
    toast.error('Job no longer available');
  } else {
    toast.error('Failed to apply. Please try again.');
  }
}
```
