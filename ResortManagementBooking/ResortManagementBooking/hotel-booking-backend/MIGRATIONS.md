# Database Migration System

## Features
- ✅ Automatic version tracking
- ✅ Transactional up/down migrations
- ✅ Safety checks for destructive operations
- ✅ CLI interface
- ✅ Auto-run on application bootstrap
- ✅ Idempotent migrations

## Usage

### CLI Commands
```bash
# Show migration status
npm run migrate:status

# Apply all pending migrations
npm run migrate:dev up

# Apply migrations up to specific version
npm run migrate:dev up 2

# Rollback last migration
npm run migrate:dev down

# Rollback to specific version
npm run migrate:dev down 0
```

### Creating Migrations
1. Create new file in `src/database/migrations/XXX_name.ts`
2. Extend `Migration` abstract class
3. Implement `up()` and `down()` methods
4. Add to `src/database/migrations/index.ts`
5. Use `session` parameter for all operations!

### Best Practices
- Always implement both up/down
- Migrations must be idempotent
- Never modify existing migrations once pushed
- Use transactions for all operations
- Test migrations against staging first
- Avoid destructive operations on populated collections
