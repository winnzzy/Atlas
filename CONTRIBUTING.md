# Contributing to Atlas

Thank you for your interest in contributing to Atlas.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Copy environment file: `cp .env.example .env`
4. Start development: `pnpm dev`

## Branch Strategy

- `main` — Production-ready code
- `develop` — Integration branch
- `feature/*` — Feature branches
- `fix/*` — Bug fix branches
- `chore/*` — Maintenance tasks

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/).

Format: `<type>(<scope>): <description>`

Types:
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `style` — Formatting (no code change)
- `refactor` — Code refactoring
- `test` — Adding tests
- `chore` — Maintenance
- `perf` — Performance improvement
- `ci` — CI/CD changes

Scopes:
- `web` — Frontend application
- `backend` — Backend application
- `ui` — UI package
- `shared` — Shared package
- `types` — Types package
- `config` — Config package
- `api-client` — API client package
- `docker` — Docker configuration
- `ci` — CI/CD configuration
- `docs` — Documentation

Examples:
```
feat(backend): add user authentication module
fix(web): resolve dark mode toggle issue
docs(readme): update setup instructions
refactor(shared): extract validation utilities
```

## Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes
3. Ensure all checks pass:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm build
   ```
4. Write a clear PR description
5. Request review from maintainers

## Code Standards

### TypeScript

- Strict mode enabled
- No `any` types
- Explicit return types on public methods
- Use `readonly` for immutable properties

### React

- Use functional components
- Use `'use client'` only when necessary
- Prefer Server Components
- Use proper TypeScript types for props

### NestJS

- Follow module structure patterns
- Use DTOs for request/response
- Use dependency injection
- Keep controllers thin, services fat

### Styling

- Use Tailwind CSS utility classes
- Use CSS variables for theming
- Follow shadcn/ui patterns for components
- Mobile-first responsive design

## Testing

- Write unit tests for utilities and services
- Write integration tests for API endpoints
- Write E2E tests for critical user flows

## Questions?

Open an issue for questions or discussions.