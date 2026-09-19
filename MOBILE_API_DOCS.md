# SQRock Mobile API Documentation

**Base URL:** `https://your-domain.com/api/mobile`
**Version:** v1
**Authentication:** Bearer Token (Better Auth)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [Error Handling](#error-handling)
5. [API Endpoints](#api-endpoints)
   - [Auth](#auth)
   - [Users & Profile](#users--profile)
   - [Connections (Social Graph)](#connections-social-graph)
   - [Internships](#internships)
   - [My Internships](#my-internships)
   - [Learning Pages](#learning-pages)
   - [Exams](#exams)
   - [Projects](#projects)
   - [Documents](#documents)
   - [Payments](#payments)
   - [Posts & Social Feed](#posts--social-feed)
   - [Comments](#comments)
   - [Notifications](#notifications)
   - [Search](#search)
   - [Dashboard](#dashboard)
   - [File Upload](#file-upload)

---

## Overview

The SQRock Mobile API provides a complete backend for a career-focused social platform with internships, learning, exams, projects, and professional networking. All endpoints return JSON responses with a consistent structure.

### Key Features
- **Internship Marketplace** - Browse, register, track progress
- **Learning Management** - Structured learning pages per internship
- **Assessment System** - Pre/End exams with automatic grading
- **Project Submissions** - GitHub/URL/file submissions with admin review
- **Document Generation** - Offer letters, certificates, LORs as PDF
- **Professional Network** - LinkedIn-style connections + Instagram-style follows
- **Social Feed** - Posts, comments, likes, shares, saves
- **Real-time Notifications** - In-app notification system

---

## Authentication

All protected endpoints require a valid session cookie or Bearer token.

### Session Management
- Login creates an HTTP-only cookie session
- Access tokens expire in 15 minutes
- Refresh tokens expire in 30 days
- Use `/auth/refresh` to get new access token

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## Common Patterns

### Pagination
Most list endpoints support pagination:
```
GET /endpoint?page=1&limit=20
```

Response includes:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Filtering & Sorting
```
GET /internships?search=react&mode=remote&location=mumbai&pricing=free&sort=latest&page=1&limit=20
```

### Standard Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "meta": {}
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable message"
}
```

---

## Error Handling

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Authenticated but not authorized |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INTERNAL_ERROR` | 500 | Server error |

---

## API Endpoints

---

### Auth

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "phone": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "user@example.com",
      "name": "John Doe",
      "emailVerified": false,
      "createdAt": "2026-09-19T10:00:00Z"
    },
    "token": "access_token_here"
  },
  "message": "Registration successful"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "rememberMe": true
}
```

**Response:** Same as register.

#### Logout
```http
POST /auth/logout
```

#### Get Current User
```http
GET /auth/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "session": { ... }
  }
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "accountId": "account_abc123",
  "useAccountCookie": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token"
  },
  "message": "Token refreshed"
}
```

---

### Users & Profile

#### Get My Profile
```http
GET /users/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_abc123",
    "name": "John Doe",
    "email": "user@example.com",
    "image": "https://...",
    "coverImage": "https://...",
    "headline": "Full Stack Developer | MERN",
    "bio": "Passionate developer...",
    "location": "Mumbai, India",
    "website": "https://johndoe.dev",
    "dob": "1995-06-15",
    "phone": "+919876543210",
    "followersCount": 150,
    "followingCount": 200,
    "connectionsCount": 80,
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

#### Update My Profile
```http
PUT /users/profile
Content-Type: application/json

{
  "name": "John Doe",
  "headline": "Senior Full Stack Developer",
  "bio": "Updated bio...",
  "location": "Bangalore, India",
  "website": "https://newsite.dev",
  "dob": "1995-06-15",
  "phone": "+919876543210"
}
```

#### Get Public Profile
```http
GET /users/:id
```

**Response:** Includes `stats` object and `isOwnProfile` boolean.

#### Search Users
```http
GET /users/search?q=john&page=1&limit=20
```

**Response:** Users with `isFollowing` and `isConnected` flags.

#### Get Followers/Following/Connections
```http
GET /users/:id/followers?page=1&limit=20
GET /users/:id/following?page=1&limit=20
GET /users/:id/connections?page=1&limit=20
```

#### Follow/Unfollow User
```http
POST /users/:id/follow
```

**Response:**
```json
{
  "success": true,
  "data": { "following": true },
  "message": "Followed"
}
```

#### Get User's Posts
```http
GET /users/:id/posts?page=1&limit=20
```

---

### Connections (Social Graph)

#### Send Connection Request
```http
POST /connections/request
Content-Type: application/json

{
  "addresseeId": "user_xyz789",
  "message": "Hi, I'd like to connect!"
}
```

**Response:**
```json
{
  "success": true,
  "data": { "status": "pending" },
  "message": "Connection request sent"
}
```

#### Manage Connection
```http
POST /connections/:id/accept   # Accept request
POST /connections/:id/reject   # Reject request
POST /connections/:id/cancel   # Cancel sent request
POST /connections/:id/remove   # Remove connection
```

#### Get Pending Requests
```http
GET /connections/pending?type=received&page=1&limit=20
GET /connections/pending?type=sent&page=1&limit=20
```

---

### Internships

#### List Internships (with Filters)
```http
GET /internships?search=react&mode=remote&location=mumbai&pricing=free&sort=latest&page=1&limit=20
```

**Query Parameters:**
| Param | Type | Values | Default |
|-------|------|--------|---------|
| search | string | - | - |
| mode | enum | `remote`, `onsite`, `hybrid`, `all` | `all` |
| location | string | - | - |
| pricing | enum | `free`, `paid`, `all` | `all` |
| sort | enum | `latest`, `name`, `popular` | `latest` |
| page | int | > 0 | 1 |
| limit | int | 1-100 | 20 |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Full Stack Web Development",
      "description": "Learn MERN stack...",
      "image": "https://...",
      "skills": ["React", "Node.js", "MongoDB"],
      "qualifications": ["B.Tech CS", "Basic JS knowledge"],
      "duration": "3 months",
      "mode": "remote",
      "location": "Remote",
      "pricing": "free",
      "price": null,
      "currency": "INR",
      "paymentType": "one_time",
      "discountPrice": null,
      "pricingNote": null,
      "registrationOpen": true,
      "createdAt": "2026-09-01T10:00:00Z",
      "hasRegistered": false
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
}
```

#### Get Internship Detail
```http
GET /internships/:id
```

**Response:** Includes `learningPages`, `exams`, `projects`, `hasRegistered`, `registrationStatus`, `registrationId`.

#### Register for Internship
```http
POST /internships/:id/register
Content-Type: application/json

{
  "university": "Mumbai University",
  "collegeName": "XYZ College of Engineering",
  "branch": "Computer Science",
  "degree": "B.Tech",
  "academicYear": "2024-2025",
  "semester": 6,
  "passingYear": 2025,
  "address": "123 Street, Mumbai",
  "aboutUser": "I'm passionate about..."
}
```

#### Get Learning Pages
```http
GET /internships/:id/learning
```

**Response:** Array of learning pages with `isCompleted` flag.

#### Get Learning Page Detail
```http
GET /learning/:id
```

#### Get Exams for Internship
```http
GET /internships/:id/exams
```

#### Get Projects for Internship
```http
GET /internships/:id/projects
```

---

### My Internships

#### List My Registrations
```http
GET /my-internships?status=active&page=1&limit=20
```

**Status filter:** `pending`, `active`, `completed`, `cancelled`, `rejected`

#### Get Registration Progress
```http
GET /my-internships/:id/progress
```

#### Cancel Registration
```http
POST /my-internships/:id/cancel
```

---

### Exams

#### Get Exam Detail (with Questions)
```http
GET /exams/:id
```

**Response:** Exam with questions (correctOption hidden), `attemptNumber`, `maxAttempts`, `existingSubmission`.

#### Submit Exam
```http
POST /exams/:id/submit
Content-Type: application/json

{
  "answers": [
    { "questionId": "uuid", "selectedOption": 2 },
    { "questionId": "uuid", "selectedOption": 0 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submission": { ... },
    "answers": [{ ...isCorrect, marksObtained }],
    "passed": true,
    "score": 85,
    "totalScore": 100,
    "percentage": 85
  }
}
```

#### Get Exam Result
```http
GET /exams/:id/result
```

**Response:** All attempts with questions, user answers, correct answers, explanations.

#### Get Remaining Attempts
```http
GET /exams/:id/attempts
```

#### List My Exam Attempts
```http
GET /my-exams?page=1&limit=20
```

---

### Projects

#### Get Project Detail
```http
GET /projects/:id
```

**Response:** Project with `isUnlocked` (based on end exam), `userSubmission`.

#### Submit Project
```http
POST /projects/:id/submit
Content-Type: application/json

{
  "submissionUrl": "https://github.com/user/project",
  "githubUrl": "https://github.com/user/project",
  "liveUrl": "https://project-demo.vercel.app",
  "submissionFiles": [
    { "name": "report.pdf", "url": "https://...", "type": "pdf", "size": 1024000 }
  ],
  "submissionNotes": "Project completed with all requirements"
}
```

**Requirements:** Must be registered for internship AND have passed end exam.

#### List My Project Submissions
```http
GET /my-project-submissions
```

---

### Documents

#### List My Offer Letters
```http
GET /my-documents/offer-letters
```

#### List My Certificates
```http
GET /my-documents/certificates
```

#### List My LORs
```http
GET /my-documents/lors
```

#### Get Document Details
```http
GET /documents/offer-letter/:id
GET /documents/certificate/:id
GET /documents/lor/:id
```

#### Download PDF
```http
GET /documents/offer-letter/:id/pdf
GET /documents/certificate/:id/pdf
```
Returns PDF binary with `Content-Type: application/pdf`

#### Verify Certificate (Public)
```http
GET /documents/certificate/verify/:code
```
No auth required. Returns certificate details for verification.

---

### Payments

#### List Payment History
```http
GET /payments?page=1&limit=20
```

#### Get Payment Detail
```http
GET /payments/:id
```

#### Initiate Payment for Paid Internship
```http
POST /payments/internship/:id/initiate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_razorpay_xyz",
    "amount": 500000,  // in paise
    "currency": "INR",
    "keyId": "rzp_test_..."
  }
}
```
Use with Razorpay SDK on mobile.

---

### Posts & Social Feed

#### Get Feed
```http
GET /posts?type=feed&page=1&limit=20
GET /posts?type=explore&page=1&limit=20
GET /posts?type=my&page=1&limit=20
```

**Types:**
- `feed` - Posts from connections + following + own
- `explore` - Public posts (trending)
- `my` - Current user's posts

**Response:** Posts with `isLiked`, `isSaved`, user info.

#### Create Post
```http
POST /posts/create
Content-Type: application/json

{
  "caption": "Just completed my internship! 🎉",
  "media": [
    {
      "type": "image",
      "url": "https://...",
      "thumbnail": "https://...",
      "width": 1080,
      "height": 1080
    }
  ],
  "mediaType": "image",
  "visibility": "public",
  "location": "Mumbai, India",
  "tags": ["internship", "learning", "webdev"]
}
```

#### Post Actions
```http
POST /posts/:id/like       # Like
POST /posts/:id/unlike     # Unlike
POST /posts/:id/save       # Save
POST /posts/:id/unsave     # Unsave
POST /posts/:id/share      # Share (increments count)
POST /posts/:id/delete     # Delete own post
```

#### Get Comments
```http
GET /posts/:id/comments?page=1&limit=50
```

**Response:** Comments with `replies` (max 3), `isLiked`.

#### Add Comment
```http
POST /posts/:id/comments/create
Content-Type: application/json

{
  "content": "Great work!",
  "parentId": "comment_uuid"  // Optional for replies
}
```

---

### Comments

#### Like/Unlike Comment
```http
POST /comments/:id/like
POST /comments/:id/unlike
```

#### Update Comment
```http
PUT /comments/:id/update
Content-Type: application/json

{
  "content": "Updated comment text"
}
```

#### Delete Comment
```http
DELETE /comments/:id/delete
```

---

### Notifications

#### List Notifications
```http
GET /notifications?page=1&limit=20&unread=true
```

**Response:** Includes `unreadCount` in meta.

#### Mark as Read
```http
POST /notifications/:id/read
```

#### Delete Notification
```http
POST /notifications/:id/delete
```

#### Mark All Read
```http
POST /notifications/read-all
```

#### Get Settings
```http
GET /notifications/settings
```

---

### Search

#### Global Search
```http
GET /search?q=react&type=all&page=1&limit=20
```

**Types:** `all`, `users`, `internships`, `posts`, `skills`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "internships": [...],
    "posts": [...],
    "skills": [{ "skill": "React", "count": 15 }]
  }
}
```

---

### Dashboard

#### Get Dashboard Stats
```http
GET /dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activeInternships": 2,
    "completedInternships": 3,
    "totalCertificates": 3,
    "totalOfferLetters": 2,
    "totalLORs": 1,
    "passedExams": 5,
    "submittedProjects": 2,
    "connectionsCount": 80,
    "followersCount": 150,
    "followingCount": 200,
    "postsCount": 12,
    "unreadNotifications": 5
  }
}
```

#### Get Upcoming Deadlines
```http
GET /dashboard/upcoming
```

**Response:** `{ upcomingExams: [...], upcomingProjects: [...] }`

#### Get Recent Activity
```http
GET /dashboard/activity?limit=10
```

---

### File Upload

#### Get Presigned Upload URL (Recommended)
```http
POST /upload/presigned
Content-Type: multipart/form-data

file: <File>
type: "image" | "video" | "document"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://r2-bucket.s3.amazonaws.com/...",
    "key": "mobile/user123/image/uuid-filename.jpg",
    "publicUrl": "https://cdn.domain.com/mobile/user123/image/uuid-filename.jpg"
  }
}
```
Upload directly to R2/S3 using `uploadUrl`, then use `publicUrl` in posts/profile.

#### Direct Upload (Alternative)
```http
POST /upload/direct
Content-Type: multipart/form-data

file: <File>
type: "image" | "video" | "document"
```

**Response:**
```json
{
  "success": true,
  "data": { "url": "https://cdn.domain.com/...", "key": "..." }
}
```

**File Limits:**
| Type | Max Size | Allowed MIME Types |
|------|----------|-------------------|
| image | 10MB | jpeg, png, webp, gif |
| video | 100MB | mp4, webm, quicktime |
| document | 10MB | pdf, doc, docx |

---

## Integration Guide for App Developers

### 1. Authentication Flow

```typescript
// 1. Register/Login
const authResponse = await api.post('/auth/login', { email, password });
const { accessToken, refreshToken } = authResponse.data;

// 2. Store tokens securely (Keychain/Keystore)
// 3. Include in requests
api.defaults.headers.Authorization = `Bearer ${accessToken}`;

// 4. Handle 401 - Auto refresh
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshResponse = await api.post('/auth/refresh', {
        accountId: storedAccountId
      });
      const newTokens = refreshResponse.data;
      // Update stored tokens
      // Retry original request
    }
    return Promise.reject(error);
  }
);
```

### 2. File Upload Flow

```typescript
// For posts/profile images
async function uploadImage(file: File): Promise<string> {
  // 1. Get presigned URL
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'image');
  
  const { data } = await api.post('/upload/presigned', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  // 2. Upload to R2/S3
  await fetch(data.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  });
  
  // 3. Return public URL
  return data.publicUrl;
}
```

### 3. Pagination Helper

```typescript
async function fetchAllPages(fetchFn, params = {}) {
  let page = 1;
  const allData = [];
  
  while (true) {
    const response = await fetchFn({ ...params, page, limit: 20 });
    allData.push(...response.data.data);
    
    if (page >= response.data.meta.totalPages) break;
    page++;
  }
  
  return allData;
}
```

### 4. Real-time Updates (Polling)

```typescript
// Poll for notifications every 30 seconds
setInterval(async () => {
  const { data } = await api.get('/notifications?unread=true&limit=5');
  if (data.data.length > 0) {
    // Show notification badge
    // Optionally fetch full list
  }
}, 30000);
```

### 5. Offline Support

- Cache GET responses with timestamps
- Queue mutations (POST/PUT/DELETE) when offline
- Sync on reconnect with conflict resolution
- Use `If-None-Match` / `ETag` headers for conditional requests

---

## Rate Limits (Recommended)

| Endpoint Category | Limit |
|-------------------|-------|
| Auth | 10 req/min |
| Search | 30 req/min |
| Feed/Posts | 60 req/min |
| File Upload | 10 req/min |
| Other | 100 req/min |

Implement exponential backoff on 429 responses.

---

## Webhook Events (For Admin Integration)

Not directly accessible from mobile, but useful to know:

- `internship.registered`
- `exam.published`
- `exam.submitted`
- `certificate.issued`
- `offer_letter.issued`
- `connection.requested`
- `post.liked`

---

## Testing

### Test Credentials (Development)
```
Email: test@sqrock.in
Password: test123456
```

### Postman Collection
Import the OpenAPI spec (available at `/api/openapi.json`) into Postman for complete testing.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2026-09-19 | Initial release with 67 endpoints |

---

## Support

For API issues or feature requests:
- Check error codes in response
- Review server logs for `INTERNAL_ERROR`
- Contact backend team with request ID from error response

---

*Generated on 2026-09-19 - SQRock Mobile API v1.0*