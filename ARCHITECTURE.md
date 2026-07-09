# Atlas Architecture

## Overview

Atlas follows **Clean Architecture** principles with **Domain-Driven Design (DDD)** patterns, organized as a **modular monorepo**.

## Architectural Principles

### Clean Architecture

```
┌─────────────────────────────────────────────────┐
│              External Layer                      │
│  (HTTP, Database, Cache, External APIs)          │
├─────────────────────────────────────────────────┤
│              Interface Adapters                  │
│  (Controllers, Gateways, Presenters)             │
├─────────────────────────────────────────────────┤
│              Application Layer                   │
│  (Use Cases, Commands, Queries, DTOs)            │
├─────────────────────────────────────────────────┤
│              Domain Layer                        │
│  (Entities, Value Objects, Domain Services)      │
│  (Repositories interfaces, Domain Events)        │
└─────────────────────────────────────────────────┘
```

### Dependency Rule

Dependencies point inward. The domain layer has no dependencies on outer layers. Outer layers depend on inner layers through interfaces.

## Monorepo Structure

### Apps (`apps/`)

Applications are deployable units that compose shared packages.

- **`apps/web`** — Next.js 15 frontend (App Router, React 19, Tailwind CSS)
- **`apps/backend`** — NestJS API server (Prisma, PostgreSQL, Redis)

### Packages (`packages/`)

Shared packages consumed by applications.

| Package          | Purpose                                    |
| ---------------- | ------------------------------------------ |
| `@atlas/types`   | Shared TypeScript type definitions         |
| `@atlas/config`  | Shared configuration (env, database, JWT)  |
| `@atlas/shared`  | Shared utilities and error classes         |
| `@atlas/api-client` | Type-safe HTTP client for API calls     |
| `@atlas/ui`      | Shared React UI components (shadcn/ui)     |

## Backend Architecture

### Module Structure

```
apps/backend/src/
├── app.module.ts              # Root module
├── main.ts                    # Application bootstrap
├── prisma/                    # Prisma service & module
├── health/                    # Health check endpoint
└── common/                    # Shared infrastructure
    ├── filters/               # Exception filters
    └── interceptors/          # Logging interceptors
```

### Infrastructure Configuration

| Component     | Technology | Configuration           |
| ------------- | ---------- | ----------------------- |
| Database      | PostgreSQL | Prisma ORM              |
| Cache         | Redis      | Connection pooling      |
| Authentication| JWT        | Access + Refresh tokens |
| API Docs      | Swagger    | Auto-generated          |
| Validation    | class-validator + class-transformer | Global pipe  |
| Error Handling| Custom filter | Global exception filter |

## Frontend Architecture

### App Router Structure

```
apps/web/src/
├── app/
│   ├── layout.tsx              # Root layout (providers)
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles + CSS variables
│   ├── (auth)/
│   │   └── login/page.tsx      # Login (route group)
│   └── (dashboard)/
│       └── dashboard/page.tsx  # Dashboard (route group)
├── components/
│   └── providers/              # Context providers
│       ├── theme-provider.tsx  # Dark mode support
│       └── query-provider.tsx  # TanStack Query
└── lib/
    └── utils.ts                # Utility functions
```

### Provider Stack

```
<html>
  <ThemeProvider>        ← Dark/Light mode
    <QueryProvider>      ← TanStack Query
      {children}         ← Application routes
    </QueryProvider>
  </ThemeProvider>
</html>
```

## Design Decisions

### 1. pnpm Workspaces

Chosen for fast, disk-efficient dependency management with strict dependency isolation between packages.

### 2. NestJS over Express

NestJS provides opinionated structure with dependency injection, decorators, and modular architecture that aligns with Clean Architecture.

### 3. Prisma ORM

Type-safe database client with auto-generated types, migrations, and excellent developer experience.

### 4. Next.js App Router

Server Components, streaming, layouts, and route groups provide the modern React architecture.

### 5. TanStack Query

Server state management with automatic caching, refetching, and optimistic updates.

### 6. shadcn/ui

Copy-paste component library built on Radix UI primitives with full Tailwind CSS customization. Not a dependency — components live in your codebase.

### 7. CSS Variables for Theming

CSS custom properties enable runtime theme switching without JavaScript overhead.

## Security Considerations

- **JWT Authentication** with short-lived access tokens and longer refresh tokens
- **CORS** configured per environment
- **Helmet** security headers via Nginx
- **Input validation** at API boundary using class-validator
- **Rate limiting** (to be implemented in Phase 2)
- **Environment-based configuration** — no secrets in code

## Scalability Path

```
Phase 1: Foundation (Current)
├── Monorepo setup
├── Infrastructure configuration
└── Placeholder pages

Phase 2: Core Banking
├── Authentication (JWT)
├── User management
├── Account management
└── Basic transactions

Phase 3: Crypto Integration
├── Wallet management
├── Crypto buy/sell
└── Price tracking

Phase 4: Advanced Features
├── Card management
├── Bill payments
├── Notifications
└── Admin dashboard

Phase 5: Scale
├── Microservice extraction
├── Event-driven architecture
├── Horizontal scaling
└── Multi-region support