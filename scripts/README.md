# Database Schema Auto-Sync Scripts

This directory contains scripts for maintaining synchronized database schema documentation.

## Overview

The `dump-schemas.sh` script automatically:
- Discovers all tables in the PostgreSQL database
- Dumps schema definitions to SQL files
- Tracks new, updated, and orphaned tables
- Generates a complete index with metadata
- Maintains a simple table list for easy diffing

## Installation (Backend Server)

1. **Copy files to backend server:**
   ```bash
   # From your local machine
   scp scripts/dump-schemas.sh user@server:/opt/bitnami/projects/skyfire_backend_dev/scripts/
   ```

2. **Make script executable:**
   ```bash
   ssh user@server
   cd /opt/bitnami/projects/skyfire_backend_dev
   chmod +x scripts/dump-schemas.sh
   ```

3. **Add to package.json (on backend server):**
   ```json
   {
     "scripts": {
       "schema:sync": "./scripts/dump-schemas.sh",
       "schema:list": "./scripts/dump-schemas.sh --list"
     }
   }
   ```

## Usage

### Full Sync (Discover All Tables)
```bash
# Discovers all tables, adds new ones, updates existing ones
./scripts/dump-schemas.sh

# Or via npm
npm run schema:sync
```

### Refresh Single Table
```bash
./scripts/dump-schemas.sh survey_notes
```

### List Tables Only
```bash
./scripts/dump-schemas.sh --list

# Or via npm
npm run schema:list
```

## Configuration

The script uses environment variables for database connection:

```bash
# Default values
PGDATABASE=skyfire
PGHOST=localhost
PGPORT=5432
PGUSER=postgres

# Override example
PGDATABASE=skyfire_prod ./scripts/dump-schemas.sh
```

## Output Structure

```
docs/schemas/
├── _index.md              # Master index with all tables and metadata
├── _table_list.txt        # Simple list of table names (one per line)
├── company.sql            # Schema for 'company' table
├── users.sql              # Schema for 'users' table
├── survey_notes.sql       # Schema for 'survey_notes' table
└── ...                    # All other tables
```

## Workflow

### When Making Database Changes

1. **Make schema changes** (migrations, new tables, etc.)
2. **SSH to backend server:**
   ```bash
   ssh user@your-backend-server
   ```
3. **Sync schemas:**
   ```bash
   cd /opt/bitnami/projects/skyfire_backend_dev
   npm run schema:sync
   ```
4. **Review changes:**
   ```bash
   git diff docs/schemas/
   ```
5. **Commit and push:**
   ```bash
   git add docs/schemas/
   git commit -m "Update database schemas"
   git push
   ```
6. **Pull to local workspace** - Now Claude Code has the updated schemas

### From Claude Code

You can also tell Claude Code to refresh schemas:
```
"SSH to the backend server and refresh the database schemas"
```

Claude Code can execute the script remotely if SSH access is configured.

## Features

### Auto-Discovery
- Queries `information_schema.tables` to find all current tables
- No manual list to maintain
- Automatically detects new tables

### Change Tracking
- **New tables**: Marked with `+` in index
- **Updated tables**: Refreshed schemas
- **Orphaned tables**: Marked with `⚠` when table is deleted from DB

### Git-Friendly
- `_table_list.txt` makes it easy to see what changed in diffs
- Each table in separate file for clear version control
- Timestamps in generated files

### Idempotent
- Safe to run multiple times
- Always refreshes to current state
- No side effects

## Example Output

```bash
========================================
Database Schema Auto-Sync
========================================

Database: skyfire
Host: localhost:5432
User: postgres

Discovering tables in database...
Found 47 tables

Analysis:
  New tables: 3
  Existing tables to update: 44
  Orphaned schemas: 0

Adding new tables:
Dumping schema for: survey_notes
✓ survey_notes.sql
...

========================================
Schema sync complete!
========================================

Summary:
  ✓ Added 3 new tables
  ✓ Updated 44 existing tables
  ✓ Generated index at docs/schemas/_index.md
  ✓ Updated table list at docs/schemas/_table_list.txt
```

## Troubleshooting

### Permission Issues
```bash
# Ensure script is executable
chmod +x scripts/dump-schemas.sh

# Check PostgreSQL permissions
psql -U postgres -d skyfire -c "\dt"
```

### Connection Issues
```bash
# Test connection
psql -h localhost -U postgres -d skyfire -c "SELECT version();"

# Override connection settings
PGHOST=your-host PGUSER=your-user ./scripts/dump-schemas.sh
```

### Empty Output
- Ensure the database has tables in the `public` schema
- Check that `pg_dump` is installed and accessible
- Verify database credentials

## Notes

- The script only dumps schema definitions (`--schema-only`), not data
- Only tables in the `public` schema are included
- Generated files include timestamps and metadata
- Orphaned schemas are flagged but not automatically deleted
