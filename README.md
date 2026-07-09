# Atlas

**US-focused digital banking platform with integrated cryptocurrency support.**

## Overview

Atlas is an investor-ready MVP built with a production-grade architecture. It follows Clean Architecture principles with Domain-Driven Design (DDD) patterns, organized as a modular monorepo.

## Tech Stack

| Layer      | Technology                                         |
| ---------- | -------------------------------------------------- |
| Frontend   | Next.js 15, React 19, TypeScript, Tailwind CSS     |
| UI         | shadcn/ui, Framer Motion                           |
| State      | TanStack Query, React Hook Form, Zod               |
| Backend    | NestJS, TypeScript, Prisma                         |
| Database   | PostgreSQL, Redis                                  |
| DevOps     | Docker, Docker Compose, GitHub Actions             |
| Code Style | ESLint, Prettier, Husky, lint-staged               |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose (optional, for full stack)

### Development

```bash
# Clone the repository
git clone https://github.com/your-org/atlas.git
cd atlas

# Copy environment file
cp .env.example .env

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

### Docker

```bash
# Start all services
docker compose -f docker/docker-compose.yml up

# Start in background
docker compose -f docker/docker-compose.yml up -d

# View logs
docker compose -f docker/docker-compose.yml logs -f

# Stop all services
docker compose -f docker/docker-compose.yml down
```

## Project Structure

```
atlas/
├── apps/
│   ├── web/          # Next.js frontend
│   └── backend/      # NestJS backend
├── packages/
│   ├── ui/           # Shared UI components
│   ├── shared/       # Shared utilities
│   ├── api-client/   # HTTP client library
│   ├── config/       # Shared configuration
│   └── types/        # Shared TypeScript types
├── docker/           # Docker configuration
├── docs/             # Documentation
├── scripts/          # Utility scripts
└── .github/          # GitHub Actions
```

## Commands

```bash
# Development
pnpm dev              # Start all dev servers
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm typecheck        # Type-check all packages
pnpm clean            # Clean all build artifacts
pnpm format           # Format code with Prettier

# Database
pnpm --filter @atlas/backend exec prisma generate   # Generate Prisma client
pnpm --filter @atlas/backend exec prisma migrate dev # Run migrations
pnpm --filter @atlas/backend exec prisma studio      # Open Prisma Studio

# Docker
docker compose -f docker/docker-compose.yml up       # Start full stack
docker compose -f docker/docker-compose.yml down     # Stop full stack
```

## Documentation

- [Architecture](./ARCHITECTURE.md) - System architecture and design decisions
- [Project Structure](./PROJECT_STRUCTURE.md) - Detailed project structure
- [Development](./DEVELOPMENT.md) - Development workflow and guidelines
- [Setup](./SETUP.md) - Detailed setup instructions
- [Contributing](./CONTRIBUTING.md) - Contribution guidelines

## License

Proprietary - All rights reserved.