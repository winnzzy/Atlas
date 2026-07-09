# Project Structure

## Overview

Atlas is organized as a monorepo using pnpm workspaces with a clear separation between applications and shared packages.

## Directory Tree

```
atlas/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI/CD pipeline
├── .husky/
│   ├── pre-commit                    # Runs lint-staged on commit
│   └── commit-msg                    # Validates conventional commits
├── apps/
│   ├── web/                          # Next.js 15 Frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── globals.css       # Global styles & CSS variables
│   │   │   │   ├── layout.tsx        # Root layout (providers)
│   │   │   │   ├── page.tsx          # Landing page placeholder
│   │   │   │   ├── (auth)/
│   │   │   │   │   └── login/
│   │   │   │   │       └── page.tsx  # Login placeholder
│   │   │   │   └── (dashboard)/
│   │   │   │       └── dashboard/
│   │   │   │           └── page.tsx  # Dashboard placeholder
│   │   │   ├── components/
│   │   │   │   └── providers/
│   │   │   │       ├── theme-provider.tsx  # Dark mode support
│   │   │   │       └── query-provider.tsx  # TanStack Query provider
│   │   │   └── lib/
│   │   │       └── utils.ts          # Utility functions (cn helper)
│   │   ├── next.config.js            # Next.js configuration
│   │   ├── tailwind.config.ts        # Tailwind CSS configuration
│   │   ├── postcss.config.js         # PostCSS configuration
│   │   ├── tsconfig.json             # TypeScript configuration
│   │   └── package.json              # Dependencies and scripts
│   └── backend/                      # NestJS Backend
│       ├── src/
│       │   ├── main.ts               # Application entry point
│       │   ├── app.module.ts          # Root module
│       │   ├── prisma/
│       │   │   ├── prisma.module.ts   # Prisma module
│       │   │   └── prisma.service.ts  # Prisma service (lifecycle)
│       │   ├── health/
│       │   │   ├── health.module.ts   # Health check module
│       │   │   ├── health.controller.ts # Health endpoint
│       │   │   └── health.service.ts  # Health check logic
│       │   └── common/
│       │       ├── filters/
│       │       │   └── http-exception.filter.ts  # Global error filter
│       │       └── interceptors/
│       │           └── logging.interceptor.ts     # Request logging
│       ├── prisma/
│       │   └── schema.prisma         # Database schema
│       ├── nest-cli.json             # NestJS CLI configuration
│       ├── tsconfig.json             # TypeScript configuration
│       └── package.json              # Dependencies and scripts
├── packages/
│   ├── types/                        # @atlas/types
│   │   └── src/
│   │       ├── index.ts              # Package entry point
│   │       ├── api/
│   │       │   ├── api-response.type.ts  # Standard API response
│   │       │   └── pagination.type.ts    # Pagination types
│   │       ├── common/
│   │       │   ├── enums.ts          # Shared enumerations
│   │       │   └── identifiers.ts    # ID types (branded types)
│   │       └── domain/
│   │           ├── user.types.ts     # User domain types
│   │           └── account.types.ts  # Account domain types
│   ├── config/                       # @atlas/config
│   │   └── src/
│   │       ├── index.ts              # Package entry point
│   │       ├── app.config.ts         # Application configuration
│   │       ├── database.config.ts    # Database configuration
│   │       ├── redis.config.ts       # Redis configuration
│   │       ├── jwt.config.ts         # JWT configuration
│   │       └── cors.config.ts        # CORS configuration
│   ├── shared/                       # @atlas/shared
│   │   └── src/
│   │       ├── index.ts              # Package entry point
│   │       ├── utils/
│   │       │   ├── date.utils.ts     # Date utilities
│   │       │   ├── format.utils.ts   # Formatting utilities
│   │       │   └── validation.utils.ts # Validation helpers
│   │       └── errors/
│   │           └── app-error.ts      # Application error class
│   ├── api-client/                   # @atlas/api-client
│   │   └── src/
│   │       ├── index.ts              # Package entry point
│   │       ├── client/
│   │       │   ├── http-client.ts    # Type-safe HTTP client
│   │       │   └── api-error.ts      # API error class
│   │       └── types/
│   │           └── client.types.ts   # Client configuration types
│   └── ui/                           # @atlas/ui
│       └── src/
│           ├── index.ts              # Package entry point
│           └── components/
│               ├── button.tsx        # Button component
│               ├── card.tsx          # Card component
│               ├── input.tsx         # Input component
│               └── spinner.tsx       # Loading spinner
├── docker/
│   ├── Dockerfile.frontend           # Frontend Docker image
│   ├── Dockerfile.backend            # Backend Docker image
│   ├── docker-compose.yml            # Full stack orchestration
│   └── nginx/
│       └── nginx.conf                # Nginx reverse proxy config
├── docs/                             # Additional documentation
├── scripts/                          # Utility scripts
├── .editorconfig                     # Editor configuration
├── .env.example                      # Environment variable template
├── .gitignore                        # Git ignore rules
├── .lintstagedrc                     # lint-staged configuration
├── .prettierrc                       # Prettier configuration
├── .prettierignore                   # Prettier ignore rules
├── ARCHITECTURE.md                   # Architecture documentation
├── CONTRIBUTING.md                   # Contribution guidelines
├── DEVELOPMENT.md                    # Development workflow
├── PROJECT_STRUCTURE.md              # This file
├── README.md                         # Project overview
├── SETUP.md                          # Detailed setup guide
├── commitlint.config.mjs             # Commitlint configuration
├── eslint.config.mjs                 # ESLint configuration
├── package.json                      # Root package.json (monorepo)
├── pnpm-workspace.yaml               # pnpm workspace definition
├── tsconfig.base.json                # Shared TypeScript config
└── tsconfig.json                     # Root TypeScript config
```

## Package Dependencies

```
@atlas/web (apps/web)
├── @atlas/ui
├── @atlas/shared
├── @atlas/types
└── @atlas/api-client

@atlas/backend (apps/backend)
├── @atlas/config
├── @atlas/shared
└── @atlas/types
```

## Route Groups

### Auth Route Group `(auth)`

Pages that don't require authentication:
- `/login` — Sign in page

### Dashboard Route Group `(dashboard)`

Pages that require authentication (middleware will be added in Phase 2):
- `/dashboard` — Main dashboard

Route groups use parentheses to organize layouts without affecting the URL structure.