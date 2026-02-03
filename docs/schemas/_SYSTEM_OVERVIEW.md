# Database Schema Auto-Sync System - Overview

## What This System Does

Automatically discovers **ALL** tables in your PostgreSQL database and creates version-controlled schema documentation that Claude Code can reference.

## Key Features

- **Auto-Discovery**: Queries database to find all tables (no manual list)
- **Change Tracking**: Detects new, updated, and deleted tables
- **Self-Documenting**: Generates index with metadata and statistics
- **Git-Friendly**: Each table in separate file with clear diffs
- **Claude Code Ready**: Complete reference for AI-assisted development

## System Components

### Core Script
- [dump-schemas.sh](../../scripts/dump-schemas.sh) - Main bash script that runs on backend server

### Output Files (Auto-Generated)
- `_index.md` - Master index with all tables and stats
- `_table_list.txt` - Simple list (one table per line)
- `{table_name}.sql` - Schema definition for each table

### Documentation
- [QUICKSTART.md](./QUICKSTART.md) - Get started in 5 minutes
- [../../docs/SCHEMA_SYNC_SETUP.md](../SCHEMA_SYNC_SETUP.md) - Complete deployment guide
- [README.md](./README.md) - This directory overview
- [../../scripts/README.md](../../scripts/README.md) - Script usage details

### Configuration
- [../../scripts/package.json.snippet](../../scripts/package.json.snippet) - npm scripts to add to backend

## How It Works

```
┌─────────────────────────────────────┐
│ 1. Query Database                   │
│    SELECT * FROM information_schema │
│    Get all current table names      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 2. Compare with Existing Files      │
│    - New tables → Add               │
│    - Existing → Update              │
│    - Missing → Flag as orphaned     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 3. Dump Schemas                     │
│    pg_dump --schema-only            │
│    One .sql file per table          │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 4. Generate Documentation           │
│    - _index.md with stats           │
│    - _table_list.txt for diffing    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 5. Commit to Git                    │
│    Version-controlled reference     │
└─────────────────────────────────────┘
```

## Usage

### On Backend Server

```bash
# Full sync (discover all tables, add new, update existing)
npm run schema:sync

# Refresh single table
./scripts/dump-schemas.sh survey_notes

# List tables only
npm run schema:list
```

### With Claude Code

```
"What's the schema for the users table?"
"Show me all columns in survey_notes"
"What indexes exist on company?"
"List all foreign keys in project_system_details"
```

## Deployment

### Quick Start (5 minutes)
See [QUICKSTART.md](./QUICKSTART.md)

### Complete Setup Guide
See [SCHEMA_SYNC_SETUP.md](../SCHEMA_SYNC_SETUP.md)

### Basic Steps

1. **Copy script to backend server**
   ```bash
   scp scripts/dump-schemas.sh user@server:/path/to/backend/scripts/
   ```

2. **Add npm scripts to backend package.json**
   ```json
   "schema:sync": "./scripts/dump-schemas.sh"
   ```

3. **Run initial sync on server**
   ```bash
   npm run schema:sync
   ```

4. **Commit and push**
   ```bash
   git add docs/schemas/
   git commit -m "Add database schema auto-sync"
   git push
   ```

5. **Pull to local workspace**
   ```bash
   git pull
   ```

6. **Tell Claude Code**
   ```
   "What tables are in the database?"
   ```

## File Structure

```
SkyfireAppSuite/
├── docs/
│   ├── SCHEMA_SYNC_SETUP.md          # Complete deployment guide
│   └── schemas/
│       ├── _SYSTEM_OVERVIEW.md       # This file
│       ├── QUICKSTART.md             # 5-minute setup
│       ├── README.md                 # Directory overview
│       ├── _index.md                 # Auto-generated master index
│       ├── _table_list.txt           # Auto-generated table list
│       ├── company.sql               # Auto-generated schema
│       ├── users.sql                 # Auto-generated schema
│       └── ...                       # All other table schemas
└── scripts/
    ├── dump-schemas.sh               # Main script
    ├── README.md                     # Script documentation
    └── package.json.snippet          # npm scripts to add
```

## Status Indicators

In `_index.md`, tables show status:

| Symbol | Status | Meaning |
|--------|--------|---------|
| `✓` | Current | Schema exists and table is in database |
| `+` | New | Table just added in this sync run |
| `⚠` | Orphaned | Schema exists but table was deleted from DB |

## Configuration

Environment variables (with defaults):

```bash
PGDATABASE=skyfire          # Database name
PGHOST=localhost            # Database host
PGPORT=5432                 # Database port
PGUSER=postgres             # Database user
```

Override example:
```bash
PGDATABASE=skyfire_prod npm run schema:sync
```

## Workflow Example

```
┌─────────────────────────────────────────┐
│ Developer makes database changes        │
│ - Add migration for survey_notes table  │
│ - Run migration on backend server       │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ SSH to backend server                   │
│ $ npm run schema:sync                   │
│                                          │
│ Output:                                  │
│   Found 48 tables (+1 new)              │
│   Adding new tables:                    │
│   ✓ survey_notes.sql                    │
│   Updated 47 existing tables            │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Review and commit                       │
│ $ git diff docs/schemas/                │
│ $ git add docs/schemas/                 │
│ $ git commit -m "Add survey_notes"      │
│ $ git push                              │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ On local machine                        │
│ $ git pull                              │
│                                          │
│ Ask Claude Code:                        │
│ "What columns does survey_notes have?"  │
│                                          │
│ Claude reads: docs/schemas/             │
│               survey_notes.sql          │
└─────────────────────────────────────────┘
```

## Benefits

### For Developers
- Always up-to-date schema reference
- No need to connect to database to check structure
- Clear change history via git diffs
- Easy to review what changed

### For Claude Code
- Complete database schema knowledge
- Can answer structure questions accurately
- No need to guess column names or types
- Can generate correct SQL queries

### For Team
- Single source of truth for database structure
- Version-controlled alongside code
- Easy to see schema evolution over time
- Searchable and diffable

## Maintenance

### Daily Usage
Run `npm run schema:sync` after any database changes.

### Cleaning Orphaned Schemas
```bash
# Orphaned schemas are flagged but not deleted
# To remove manually:
rm docs/schemas/old_table_name.sql
npm run schema:sync  # Updates index
```

### Force Full Refresh
```bash
rm docs/schemas/*.sql
npm run schema:sync
```

## Automation (Optional)

### Cron Job (Nightly Sync)
```bash
0 2 * * * cd /opt/bitnami/projects/skyfire_backend_dev && npm run schema:sync && git add docs/schemas/ && git commit -m "Auto-update schemas" && git push
```

### Git Hook (Post-Merge)
```bash
# .git/hooks/post-merge
#!/bin/bash
if [ -f scripts/dump-schemas.sh ]; then
    npm run schema:sync
fi
```

## Troubleshooting

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| Permission denied | `chmod +x scripts/dump-schemas.sh` |
| psql not found | Install PostgreSQL client tools |
| Connection refused | Check database is running, verify credentials |
| No tables found | Verify tables are in `public` schema |
| Script hangs | Check database load, try single table first |

See [SCHEMA_SYNC_SETUP.md](../SCHEMA_SYNC_SETUP.md) for detailed troubleshooting.

## Technical Details

### Database Query
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Schema Dump Command
```bash
pg_dump -h localhost -U postgres -d skyfire \
  --schema-only \
  --no-owner \
  --no-privileges \
  --no-tablespaces \
  -t "public.{table_name}"
```

### Output Format
Each schema file includes:
- Header comment with metadata (table name, database, timestamp)
- Complete CREATE TABLE statement
- All columns with types and constraints
- Indexes and sequences
- Foreign key relationships

## Security

- Only schema structure is dumped (no data)
- No passwords or secrets included
- `--no-owner` prevents exposing database users
- Safe to commit to version control
- Read-only operation (doesn't modify database)

## Performance

- Parallel processing for multiple tables
- Incremental updates (only changed tables)
- Efficient SQL queries using information_schema
- Minimal database load
- Typical run time: 5-30 seconds for 50 tables

## Next Steps

1. **Deploy to Backend**: Follow [QUICKSTART.md](./QUICKSTART.md)
2. **First Sync**: Run `npm run schema:sync`
3. **Commit**: Add schemas to git
4. **Pull Locally**: Get schemas in local workspace
5. **Use**: Ask Claude Code about database structure

## Support

- **Quick Setup**: [QUICKSTART.md](./QUICKSTART.md)
- **Full Guide**: [SCHEMA_SYNC_SETUP.md](../SCHEMA_SYNC_SETUP.md)
- **Script Details**: [../../scripts/README.md](../../scripts/README.md)
- **Ask Claude Code**: For specific questions or issues

---

**Status**: System is ready to deploy. After initial sync, you'll have a complete, self-maintaining database schema reference.
