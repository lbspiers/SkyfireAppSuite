# Database Schema Auto-Sync Setup Guide

Complete guide to deploying and using the automated database schema reference system.

## Overview

This system automatically discovers all tables in your PostgreSQL database, dumps their schemas to SQL files, and maintains comprehensive documentation that Claude Code can reference.

**Key Benefits:**
- Auto-discovers ALL tables (no manual list to maintain)
- Tracks new, updated, and deleted tables
- Git-friendly with clear change tracking
- Self-documenting with metadata and timestamps
- Complete reference for Claude Code

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Backend Server (PostgreSQL Database)           │
│  ~/opt/bitnami/projects/skyfire_backend_dev/   │
│                                                  │
│  1. Run: npm run schema:sync                    │
│  2. Script queries DB for all tables            │
│  3. Dumps schemas to docs/schemas/*.sql         │
│  4. Generates _index.md and _table_list.txt     │
│  5. Commit & push to git                        │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  Local Workspace / Claude Code                  │
│                                                  │
│  1. Pull latest changes from git                │
│  2. Claude Code reads docs/schemas/*.sql        │
│  3. Full database reference available           │
└─────────────────────────────────────────────────┘
```

## Part 1: Deploy to Backend Server

### Step 1: Copy Script to Server

From your local machine, copy the script to the backend server:

```bash
# Option A: Using scp
scp scripts/dump-schemas.sh user@your-server:/opt/bitnami/projects/skyfire_backend_dev/scripts/

# Option B: Using rsync (preserves permissions)
rsync -av scripts/dump-schemas.sh user@your-server:/opt/bitnami/projects/skyfire_backend_dev/scripts/

# Option C: Copy entire scripts directory
scp -r scripts/ user@your-server:/opt/bitnami/projects/skyfire_backend_dev/
```

### Step 2: SSH to Backend Server

```bash
ssh user@your-backend-server
cd /opt/bitnami/projects/skyfire_backend_dev
```

### Step 3: Make Script Executable

```bash
chmod +x scripts/dump-schemas.sh
```

### Step 4: Test Database Connection

```bash
# Test PostgreSQL connection
psql -U postgres -d skyfire -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Should return the number of tables in your database
```

### Step 5: Add npm Scripts (Backend package.json)

Edit the backend's `package.json` and add these scripts:

```json
{
  "scripts": {
    "schema:sync": "./scripts/dump-schemas.sh",
    "schema:list": "./scripts/dump-schemas.sh --list",
    "schema:refresh": "./scripts/dump-schemas.sh"
  }
}
```

### Step 6: Run Initial Sync

```bash
# This will discover all tables and create schema files
npm run schema:sync
```

Expected output:
```
========================================
Database Schema Auto-Sync
========================================

Database: skyfire
Host: localhost:5432
User: postgres

Discovering tables in database...
Found 47 tables

Analysis:
  New tables: 47
  Existing tables to update: 0
  Orphaned schemas: 0

Adding new tables:
Dumping schema for: company
✓ company.sql
Dumping schema for: users
✓ users.sql
...

========================================
Schema sync complete!
========================================
```

### Step 7: Verify Output

```bash
# Check generated files
ls -la docs/schemas/

# Should see:
# _index.md
# _table_list.txt
# company.sql
# users.sql
# ... (all your tables)
```

### Step 8: Commit and Push

```bash
git add docs/schemas/ scripts/
git commit -m "Add database schema auto-sync system with initial schemas"
git push
```

## Part 2: Use from Local Workspace

### Step 1: Pull Changes

```bash
cd /path/to/SkyfireAppSuite
git pull
```

### Step 2: Verify Schemas Available

```bash
ls docs/schemas/
cat docs/schemas/_index.md
```

### Step 3: Tell Claude Code

Now you can tell Claude Code things like:
- "What columns does the survey_notes table have?"
- "Show me the schema for the users table"
- "What indexes exist on the company table?"

Claude Code will read from `docs/schemas/{table}.sql` to answer.

## Workflow: Keeping Schemas Updated

### When You Make Database Changes

**On Backend Server:**

```bash
# 1. SSH to server
ssh user@your-backend-server

# 2. Navigate to project
cd /opt/bitnami/projects/skyfire_backend_dev

# 3. Run migrations or make DB changes
# ... your database changes ...

# 4. Sync schemas
npm run schema:sync

# 5. Review what changed
git diff docs/schemas/

# 6. Commit changes
git add docs/schemas/
git commit -m "Update schemas: added survey_notes table"
git push
```

**On Local Machine:**

```bash
# Pull the updates
git pull

# Now Claude Code has the latest schemas
```

### From Claude Code (Remote Execution)

You can also tell Claude Code to do this remotely:

```
"SSH to the backend server and refresh the database schemas"
```

Claude Code can execute the script remotely if SSH access is configured.

## Configuration Options

### Environment Variables

The script supports these environment variables:

```bash
# Database connection (defaults shown)
PGDATABASE=skyfire          # Database name
PGHOST=localhost            # Database host
PGPORT=5432                 # Database port
PGUSER=postgres             # Database user

# Usage example
PGDATABASE=skyfire_prod npm run schema:sync
```

### PostgreSQL Password

If password authentication is required:

```bash
# Option A: .pgpass file (recommended)
echo "localhost:5432:skyfire:postgres:your_password" >> ~/.pgpass
chmod 600 ~/.pgpass

# Option B: Environment variable
export PGPASSWORD=your_password
npm run schema:sync

# Option C: Prompt (script will ask)
# Just run without setting PGPASSWORD
```

## Usage Examples

### Full Sync (All Tables)

```bash
# Discover all tables, add new, update existing
./scripts/dump-schemas.sh

# Or via npm
npm run schema:sync
```

### Single Table Refresh

```bash
# Refresh just one table's schema
./scripts/dump-schemas.sh survey_notes
```

### List Tables Only

```bash
# See what tables exist without dumping
./scripts/dump-schemas.sh --list

# Or via npm
npm run schema:list
```

### Check What Changed

```bash
# See which schemas were modified
git diff docs/schemas/_table_list.txt

# See schema changes for a specific table
git diff docs/schemas/users.sql
```

## Understanding the Output

### Status Indicators

In `docs/schemas/_index.md`:

| Status | Meaning |
|--------|---------|
| `✓` | Current - schema exists and table is in DB |
| `+` | New - table was just added in this sync |
| `⚠` | Orphaned - schema exists but table was deleted from DB |

### File Structure

```
docs/schemas/
├── _index.md              # Master index with all tables and stats
├── _table_list.txt        # Simple list (one table per line)
├── company.sql            # Full schema for 'company' table
├── users.sql              # Full schema for 'users' table
└── ...                    # All other tables
```

### Schema File Format

Each `.sql` file contains:
- Header with metadata (table name, database, timestamp)
- Complete table definition
- All columns with types and constraints
- Indexes
- Sequences
- Foreign keys

Example:
```sql
-- Table: survey_notes
-- Database: skyfire
-- Dumped: 2025-02-02 14:30:00

CREATE TABLE survey_notes (
    note_id integer NOT NULL,
    project_id integer,
    note_text text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ...
);
```

## Troubleshooting

### "Permission denied" Error

```bash
# Make sure script is executable
chmod +x scripts/dump-schemas.sh
```

### "Command not found: psql"

```bash
# Ensure PostgreSQL client tools are installed
which psql
# If not found, install: sudo apt-get install postgresql-client
```

### "Connection refused"

```bash
# Check database is running
sudo systemctl status postgresql

# Test connection manually
psql -h localhost -U postgres -d skyfire -c "SELECT 1;"
```

### "No tables found"

```bash
# Verify tables exist in public schema
psql -U postgres -d skyfire -c "\dt public.*"

# Check if tables are in a different schema
psql -U postgres -d skyfire -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE';"
```

### Script Hangs or Times Out

```bash
# Check for slow queries
# Ensure database isn't under heavy load
# Try with single table first
./scripts/dump-schemas.sh company
```

### Orphaned Schemas Not Deleted

This is intentional. Orphaned schemas (where the table was deleted) are:
- Flagged in `_index.md` with `⚠`
- NOT automatically deleted
- Kept for reference in case table was accidentally dropped

To manually remove:
```bash
rm docs/schemas/old_table_name.sql
npm run schema:sync  # Will update index
```

## Automation (Optional)

### Cron Job for Nightly Sync

Add to server crontab to auto-sync daily:

```bash
# Edit crontab
crontab -e

# Add this line (runs at 2 AM daily)
0 2 * * * cd /opt/bitnami/projects/skyfire_backend_dev && npm run schema:sync && git add docs/schemas/ && git commit -m "Auto-update schemas $(date +\%Y-\%m-\%d)" && git push
```

### Git Hook (Post-Merge)

Auto-sync after pulling changes:

```bash
# Create .git/hooks/post-merge
cat > .git/hooks/post-merge << 'EOF'
#!/bin/bash
# Auto-sync schemas after merge
if [ -f scripts/dump-schemas.sh ]; then
    echo "Auto-syncing database schemas..."
    npm run schema:sync
fi
EOF

chmod +x .git/hooks/post-merge
```

## Integration with Claude Code

### Query Examples

Once schemas are synced, you can ask Claude Code:

```
"What's the structure of the survey_notes table?"
"Show me all indexes on the users table"
"What foreign keys reference the company table?"
"List all timestamp columns in project_system_details"
"What's the primary key of solar_projects?"
```

Claude Code will read from `docs/schemas/{table}.sql` to answer accurately.

### Development Workflow

```
1. You: "Add a new column to store email verification status"
2. Claude Code: *reads users.sql schema*
3. Claude Code: "I see the users table has email. I'll create a migration..."
4. *Changes are made to database*
5. You: "SSH and refresh schemas"
6. Claude Code: *runs npm run schema:sync remotely*
7. Schema files are updated and committed
```

## Best Practices

1. **Sync after every migration** - Keep schemas current
2. **Review diffs before committing** - Catch unexpected changes
3. **Commit with descriptive messages** - "Add survey_notes table" not "Update schemas"
4. **Pull before asking Claude Code** - Ensure Claude has latest schemas
5. **Use single-table refresh** - For quick updates to one table

## Security Notes

- Schema files contain **structure only**, no data
- No passwords or secrets are dumped
- Files are safe to commit to version control
- `--no-owner` flag prevents exposing database users
- Consider `.gitignore` for production-specific schemas if needed

## Maintenance

### Cleaning Up Orphaned Schemas

```bash
# List orphaned schemas
grep "⚠" docs/schemas/_index.md

# Remove specific orphaned schema
rm docs/schemas/old_table_name.sql

# Regenerate index
npm run schema:sync
```

### Force Full Refresh

```bash
# Delete all schemas and regenerate
rm -rf docs/schemas/*.sql
npm run schema:sync
```

### Backup Schemas

```bash
# Schemas are in git, but for extra safety
tar -czf schemas-backup-$(date +%Y%m%d).tar.gz docs/schemas/
```

## Summary

You now have a self-maintaining database schema reference system:

1. **Auto-discovers** all tables (no manual list)
2. **Tracks changes** (new, updated, deleted tables)
3. **Git-friendly** (clear diffs, version controlled)
4. **Claude Code ready** (complete reference documentation)
5. **Easy to maintain** (one command: `npm run schema:sync`)

After running once on the backend server, you'll have complete schema documentation. Just refresh whenever you make database changes, commit, and pull to local workspace.

---

**Questions?** Check [scripts/README.md](../scripts/README.md) for additional details or ask Claude Code for help with specific issues.
