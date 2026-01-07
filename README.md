# URTEXT API

REST API backend for the URTEXT blogging platform.

# URTEXT Blog Platform

A full-stack blogging platform built for readers and writers who appreciate clean, distraction-free content. The name _Urtext_ comes from music publishing: "original, unedited version of a score." The app is designed for any classical music enthusiasts who wish to be able to write music posts seamlessly (Music notation support to come!).

**Production:** Deployed on Railway

## Tech Stack

- **Runtime:** Node.js + Express
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** Passport.js (Local, GitHub, Google) + JWT
- **Email:** Resend

## Setup

### Prerequisites

- Node.js (v18+)
- PostgreSQL database

### Installation

```bash
git clone https://github.com/lizzyjoo/blog-api
cd blog-api
npm install
```

### Environment Variables

Create a `.env` file:

```
DATABASE_URL=postgresql://user:password@localhost:5432/blog
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
RESEND_API_KEY=your-resend-key
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Database Setup

```bash
npx prisma migrate dev
npx prisma db seed  # Optional: seed sample data
```

### Run

```bash
npm run dev     # Development with nodemon
npm start       # Production
```

Server runs at `http://localhost:3000`

## API Endpoints

### Authentication

| Method | Endpoint                | Description               |
| ------ | ----------------------- | ------------------------- |
| POST   | `/auth/register`        | Register new user         |
| POST   | `/auth/login`           | Login with email/username |
| GET    | `/auth/github`          | GitHub OAuth              |
| GET    | `/auth/google`          | Google OAuth              |
| POST   | `/auth/forgot-password` | Request password reset    |
| POST   | `/auth/reset-password`  | Reset password with token |

### Posts

| Method | Endpoint             | Description                 |
| ------ | -------------------- | --------------------------- |
| GET    | `/posts`             | Get all published posts     |
| GET    | `/posts/:id`         | Get single post             |
| POST   | `/posts`             | Create post (auth)          |
| PUT    | `/posts/:id`         | Update post (auth)          |
| DELETE | `/posts/:id`         | Delete post (auth)          |
| GET    | `/posts/subscribed`  | Posts from followed authors |
| GET    | `/posts/search?q=`   | Search posts                |
| POST   | `/posts/:id/like`    | Like post                   |
| DELETE | `/posts/:id/like`    | Unlike post                 |
| POST   | `/posts/:id/save`    | Save post                   |
| DELETE | `/posts/:id/save`    | Unsave post                 |
| POST   | `/posts/:id/view`    | Record view                 |
| PUT    | `/posts/:id/trash`   | Soft delete                 |
| PUT    | `/posts/:id/restore` | Restore from trash          |

### Users

| Method | Endpoint                  | Description        |
| ------ | ------------------------- | ------------------ |
| GET    | `/users/me`               | Get current user   |
| GET    | `/users/:username`        | Get user profile   |
| GET    | `/users/:username/posts`  | Get user's posts   |
| POST   | `/users/:username/follow` | Follow user        |
| DELETE | `/users/:username/follow` | Unfollow user      |
| GET    | `/users/:username/follow` | Check if following |

### Comments

| Method | Endpoint              | Description           |
| ------ | --------------------- | --------------------- |
| GET    | `/posts/:id/comments` | Get comments          |
| POST   | `/posts/:id/comments` | Add comment (auth)    |
| DELETE | `/comments/:id`       | Delete comment (auth) |

### Settings

| Method | Endpoint             | Description     |
| ------ | -------------------- | --------------- |
| PUT    | `/settings/password` | Change password |
| DELETE | `/settings/account`  | Delete account  |

## Database Schema

```
User
├── id, username, email, password
├── first_name, last_name
├── googleId, githubId (OAuth)
├── isAdmin, registeredDate
├── posts[], comments[]
├── subscribers[], following[]
└── savedPosts[], postViews[]

Post
├── id, title, content
├── published, trashedAt
├── authorId, author
├── comments[], savedBy[], views[]
└── createdAt, updatedAt

Comment
├── id, content
├── postId, authorId
└── createdAt

PasswordReset
├── id, userId, token, expiresAt
```

## Related Repos

- [blog-project](https://github.com/lizzyjoo/blog-project) — Development orchestrator
- [blog-reader](https://github.com/lizzyjoo/blog-reader) — Public frontend
- [blog-admin](https://github.com/lizzyjoo/blog-admin) — Admin dashboard
