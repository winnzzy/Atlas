# Development Guide

## Getting Started

See [SETUP.md](./SETUP.md) for initial setup instructions.

## Development Workflow

### Starting Development

```bash
# Start all development servers
pnpm dev

# Start only frontend
pnpm --filter @atlas/web dev

# Start only backend
pnpm --filter @atlas/backend start:dev
```

### Available Ports

| Service  | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:3001 |
| Swagger  | http://localhost:3001/docs |
| Health   | http://localhost:3001/health |

## Code Quality

### Linting

```bash
# Lint all packages
pnpm lint

# Lint specific package
pnpm --filter @atlas/web lint
pnpm --filter @atlas/backend lint

# Fix lint issues
pnpm --filter @atlas/web lint -- --fix
```

### Type Checking

```bash
# Type-check all packages
pnpm typecheck

# Type-check specific package
pnpm --filter @atlas/web typecheck
pnpm --filter @atlas/backend typecheck
```

### Formatting

```bash
# Format all files
pnpm format

# Check formatting without changes
pnpm format -- --check
```

## Git Workflow

### Commit Convention

We use Conventional Commits enforced by commitlint and Husky.

```bash
# Correct commit messages
git commit -m "feat(backend): add user authentication"
git commit -m "fix(web): resolve dark mode toggle"
git commit -m "docs: update README with setup instructions"

# Incorrect (will be rejected)
git commit -m "add stuff"
git commit -m "fix bug"
```

### Pre-commit Hooks

On every commit, the following runs automatically via Husky + lint-staged:

1. ESLint on staged `.ts` and `.tsx` files
2. Prettier formatting on all staged files

If any check fails, the commit is rejected.

### Branch Naming

```
feature/ATLAS-123-add-login-page
fix/ATLAS-456-fix-dark-mode
chore/update-dependencies
docs/add-api-documentation
```

## Package Development

### Adding a New Package

1. Create directory: `packages/my-package/`
2. Create `package.json`:
   ```json
   {
     "name": "@atlas/my-package",
     "version": "0.0.0",
     "private": true,
     "main": "./src/index.ts",
     "types": "./src/index.ts",
     "scripts": {
       "build": "tsc --build",
       "typecheck": "tsc --noEmit",
       "lint": "eslint src/",
       "clean": "rm -rf dist node_modules"
     }
   }
   ```
3. Create `tsconfig.json` extending `../../tsconfig.base.json`
4. Add to consuming app's `package.json` dependencies:
   ```json
   "@atlas/my-package": "workspace:*"
   ```
5. Run `pnpm install`

### Importing Between Packages

```typescript
// Import from shared packages
import { ApiResponse } from '@atlas/types';
import { AppError } from '@atlas/shared';
import { httpClient } from '@atlas/api-client';
```

## Database

### Prisma Commands

```bash
# Navigate to backend
cd apps/backend

# Generate Prisma client
pnpm exec prisma generate

# Create migration
pnpm exec prisma migrate dev --name add_users_table

# Apply migrations
pnpm exec prisma migrate deploy

# Open Prisma Studio
pnpm exec prisma studio

# Reset database
pnpm exec prisma migrate reset
```

## Debugging

### Backend (NestJS)

Use the VSCode debugger with this configuration:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "program": "${workspaceFolder}/apps/backend/src/main.ts",
  "outFiles": ["${workspaceFolder}/apps/backend/dist/**/*.js"],
  "runtimeArgs": ["-r", "ts-node/register"],
  "env": {
    "NODE_ENV": "development"
  }
}
```

### Frontend (Next.js)

Use the VSCode debugger with this configuration:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Frontend",
  "runtimeExecutable": "${workspaceFolder}/apps/web/node_modules/.bin/next",
  "args": ["dev"],
  "cwd": "${workspaceFolder}/apps/web",
  "console": "integratedTerminal"
}
```

## Troubleshooting

### Common Issues

**TypeScript errors after pulling changes:**
```bash
pnpm install
pnpm typecheck
```

**Prisma client out of date:**
```bash
pnpm --filter @atlas/backend exec prisma generate
```

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

**Stale node_modules:**
```bash
pnpm clean
pnpm install