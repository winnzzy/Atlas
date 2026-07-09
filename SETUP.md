# Setup Guide

## Prerequisites

### Required Software

| Software     | Minimum Version | Check Command       |
| ------------ | --------------- | ------------------- |
| Node.js      | 20.x            | `node --version`    |
| pnpm         | 9.x             | `pnpm --version`    |
| Git          | 2.x             | `git --version`     |

### Optional Software (for Docker)

| Software         | Minimum Version | Check Command              |
| ---------------- | --------------- | -------------------------- |
| Docker           | 24.x            | `docker --version`         |
| Docker Compose   | 2.x             | `docker compose version`   |

## Installation

### 1. Install pnpm

```bash
npm install -g pnpm
```

### 2. Clone the Repository

```bash
git clone https://github.com/your-org/atlas.git
cd atlas
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database
POSTGRES_USER=atlas
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=atlas
POSTGRES_PORT=5432

# Redis
REDIS_PORT=6379

# Backend
BACKEND_PORT=3001
JWT_SECRET=your_jwt_secret_change_this
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
CORS_ORIGIN=http://localhost:3000

# Frontend
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 5. Start Development

```bash
pnpm dev
```

This starts both the frontend (port 3000) and backend (port 3001).

## Docker Setup

If you prefer to run the full stack with Docker:

### 1. Start Services

```bash
docker compose -f docker/docker-compose.yml up
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 3001
- Frontend on port 3000
- Nginx reverse proxy on port 80

### 2. View Logs

```bash
docker compose -f docker/docker-compose.yml logs -f
```

### 3. Stop Services

```bash
docker compose -f docker/docker-compose.yml down
```

### 4. Reset Everything

```bash
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up --build
```

## Verify Installation

### Check Backend Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "database": { "status": "up" },
  "redis": { "status": "up" }
}
```

### Check Frontend

Open http://localhost:3000 in your browser. You should see the Atlas landing page.

### Check Swagger Docs

Open http://localhost:3001/docs in your browser to view the API documentation.

## Troubleshooting

### pnpm not found

```bash
# Windows (PowerShell)
iwr https://get.pnpm.io/install.ps1 -useb | iex

# macOS/Linux
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Port conflicts

If ports 3000, 3001, 5432, or 6379 are in use, update `.env` with different ports.

### Database connection issues

Ensure PostgreSQL is running and the credentials in `.env` match your database configuration.

### Dependency issues

```bash
# Clean and reinstall
pnpm clean
pnpm install