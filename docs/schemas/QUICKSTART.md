# Schema Sync Quick Start

**Goal:** Get database schemas synced in 5 minutes.

## For Backend Server Setup

```bash
# 1. Copy script to backend server
scp scripts/dump-schemas.sh user@server:/opt/bitnami/projects/skyfire_backend_dev/scripts/

# 2. SSH to server
ssh user@server
cd /opt/bitnami/projects/skyfire_backend_dev

# 3. Make executable
chmod +x scripts/dump-schemas.sh

# 4. Add to package.json (copy from scripts/package.json.snippet)
# Add these lines to your "scripts" section:
#   "schema:sync": "./scripts/dump-schemas.sh",
#   "schema:list": "./scripts/dump-schemas.sh --list"

# 5. Run initial sync
npm run schema:sync

# 6. Commit and push
git add docs/schemas/ scripts/
git commit -m "Add database schema auto-sync system"
git push
```

## For Local Workspace

```bash
# 1. Pull latest
git pull

# 2. Check schemas
ls docs/schemas/
cat docs/schemas/_index.md

# 3. Ask Claude Code
"What columns does the survey_notes table have?"
```

## Daily Usage

**After making database changes:**

```bash
# On server
ssh user@server
cd /opt/bitnami/projects/skyfire_backend_dev
npm run schema:sync
git add docs/schemas/
git commit -m "Update schemas: added new_table"
git push

# On local
git pull
```

**Or tell Claude Code:**
```
"SSH to backend and refresh the database schemas"
```

## Commands

| Command | What It Does |
|---------|-------------|
| `npm run schema:sync` | Discover all tables, sync everything |
| `./scripts/dump-schemas.sh table_name` | Refresh single table |
| `npm run schema:list` | List all tables (no dump) |

## Files Created

- `docs/schemas/_index.md` - Master index with all tables
- `docs/schemas/_table_list.txt` - Simple text list
- `docs/schemas/{table}.sql` - Schema for each table

## Environment Variables (Optional)

```bash
PGDATABASE=skyfire          # Default database
PGHOST=localhost            # Default host
PGPORT=5432                 # Default port
PGUSER=postgres             # Default user

# Override example:
PGDATABASE=skyfire_prod npm run schema:sync
```

## Troubleshooting

```bash
# Make executable
chmod +x scripts/dump-schemas.sh

# Test database connection
psql -U postgres -d skyfire -c "SELECT 1;"

# Check PostgreSQL installed
which psql pg_dump

# List tables manually
psql -U postgres -d skyfire -c "\dt"
```

## Complete Guide

See [../SCHEMA_SYNC_SETUP.md](../SCHEMA_SYNC_SETUP.md) for detailed instructions, automation options, and troubleshooting.
