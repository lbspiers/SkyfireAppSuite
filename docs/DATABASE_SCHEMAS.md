# Database Schema Auto-Sync System

Complete self-maintaining schema documentation system for the Skyfire PostgreSQL database.

## What's Included

This system provides automated database schema documentation that:
- Auto-discovers ALL tables (no manual configuration)
- Tracks new, updated, and deleted tables
- Generates version-controlled SQL schema files
- Creates searchable documentation for Claude Code
- Syncs with one command: `npm run schema:sync`

## Quick Access

| Document | Purpose |
|----------|---------|
| [schemas/QUICKSTART.md](schemas/QUICKSTART.md) | Get started in 5 minutes |
| [SCHEMA_SYNC_SETUP.md](SCHEMA_SYNC_SETUP.md) | Complete deployment guide |
| [schemas/_SYSTEM_OVERVIEW.md](schemas/_SYSTEM_OVERVIEW.md) | System architecture and workflow |
| [schemas/_index.md](schemas/_index.md) | Auto-generated table index |
| [../scripts/README.md](../scripts/README.md) | Script usage details |

## Quick Start

### On Backend Server (First Time)

```bash
# 1. Copy script to server
scp scripts/dump-schemas.sh user@server:/opt/bitnami/projects/skyfire_backend_dev/scripts/

# 2. SSH and setup
ssh user@server
cd /opt/bitnami/projects/skyfire_backend_dev
chmod +x scripts/dump-schemas.sh

# 3. Add to package.json (from scripts/package.json.snippet):
#    "schema:sync": "./scripts/dump-schemas.sh"

# 4. Run initial sync
npm run schema:sync

# 5. Commit and push
git add docs/schemas/ scripts/
git commit -m "Add database schema auto-sync system"
git push
```

### On Local Machine

```bash
# Pull the schemas
git pull

# Now ask Claude Code:
"What columns does the survey_notes table have?"
"Show me the users table schema"
```

## Daily Usage

After making database changes:

```bash
# On backend server
npm run schema:sync
git add docs/schemas/
git commit -m "Update schemas: added new_table"
git push

# On local machine
git pull
```

Or tell Claude Code:
```
"SSH to backend and refresh the database schemas"
```

## System Architecture

```
Backend Server (PostgreSQL)
    ↓
[dump-schemas.sh] ← Queries information_schema
    ↓
[docs/schemas/*.sql] ← Generates schema files
    ↓
Git Commit & Push
    ↓
Local Workspace
    ↓
Claude Code ← Reads schemas
```

## What Gets Created

### Automatically Generated Files

```
docs/schemas/
├── _index.md              # Master index with all tables
├── _table_list.txt        # Simple list (one per line)
├── company.sql            # Schema for company table
├── users.sql              # Schema for users table
├── survey_notes.sql       # Schema for survey_notes table
└── ...                    # All other tables
```

### Documentation Files (You're Reading These)

```
docs/
├── DATABASE_SCHEMAS.md              # This file (main entry point)
├── SCHEMA_SYNC_SETUP.md             # Complete setup guide
└── schemas/
    ├── _SYSTEM_OVERVIEW.md          # System architecture
    ├── QUICKSTART.md                # 5-minute setup
    └── README.md                    # Directory overview

scripts/
├── dump-schemas.sh                  # Main script
├── README.md                        # Script documentation
└── package.json.snippet             # npm scripts to add
```

## Features

### Auto-Discovery
- Queries database to find all tables
- No manual list to maintain
- Automatically detects new tables
- Flags deleted tables as orphaned

### Change Tracking
- Status indicators: `✓` current, `+` new, `⚠` orphaned
- Git-friendly with clear diffs
- Timestamps on all generated files
- Column counts and metadata

### Claude Code Integration
- Complete schema reference
- Accurate structure information
- No need to guess column names
- Can generate correct SQL queries

## Commands

| Command | What It Does |
|---------|-------------|
| `npm run schema:sync` | Full sync - discover all tables, update everything |
| `./scripts/dump-schemas.sh table_name` | Refresh single table only |
| `npm run schema:list` | List all tables without dumping |
| `git diff docs/schemas/_table_list.txt` | See which tables changed |

## Configuration

Environment variables (defaults shown):

```bash
PGDATABASE=skyfire          # Database name
PGHOST=localhost            # Database host
PGPORT=5432                 # Database port
PGUSER=postgres             # Database user

# Override example:
PGDATABASE=skyfire_prod npm run schema:sync
```

## Example Workflow

```bash
# 1. Make database changes (add migration, new table, etc.)
# ...

# 2. SSH to backend
ssh user@backend-server
cd /opt/bitnami/projects/skyfire_backend_dev

# 3. Sync schemas
npm run schema:sync
# Output: Found 48 tables (+1 new)
#         ✓ survey_notes.sql (new)
#         ✓ Updated 47 existing tables

# 4. Review changes
git diff docs/schemas/

# 5. Commit
git add docs/schemas/
git commit -m "Add survey_notes table schema"
git push

# 6. On local machine
git pull

# 7. Ask Claude Code
"What's the structure of the survey_notes table?"
# Claude reads docs/schemas/survey_notes.sql
```

## Benefits

### For Development
- Always current schema reference
- No database connection needed for structure lookup
- Clear change history via git
- Easy code reviews of schema changes

### For Claude Code
- Complete database knowledge
- Accurate column names and types
- Can generate correct queries
- Understands table relationships

### For Team
- Single source of truth
- Version controlled with code
- Searchable and diffable
- Self-documenting

## Status Indicators

In [schemas/_index.md](schemas/_index.md):

- `✓` = Current (table exists in database)
- `+` = New (just added in this sync)
- `⚠` = Orphaned (schema exists but table was deleted)

## Troubleshooting

| Issue | Quick Fix |
|-------|-----------|
| Permission denied | `chmod +x scripts/dump-schemas.sh` |
| psql not found | Install PostgreSQL client: `apt-get install postgresql-client` |
| Connection refused | Check database is running, verify credentials |
| No tables found | Verify tables are in `public` schema |

See [SCHEMA_SYNC_SETUP.md](SCHEMA_SYNC_SETUP.md#troubleshooting) for detailed solutions.

## Getting Help

1. **Quick Setup**: See [schemas/QUICKSTART.md](schemas/QUICKSTART.md)
2. **Detailed Guide**: See [SCHEMA_SYNC_SETUP.md](SCHEMA_SYNC_SETUP.md)
3. **System Overview**: See [schemas/_SYSTEM_OVERVIEW.md](schemas/_SYSTEM_OVERVIEW.md)
4. **Ask Claude Code**: For specific questions or issues

## Automation (Optional)

### Nightly Cron Job
```bash
0 2 * * * cd /path/to/backend && npm run schema:sync && git add docs/schemas/ && git commit -m "Auto-update schemas" && git push
```

### Git Hook (Post-Merge)
```bash
# .git/hooks/post-merge
#!/bin/bash
npm run schema:sync
```

## Security

- Only schema structure dumped (no data)
- No passwords or secrets included
- Safe to commit to version control
- Read-only database operation

## Performance

- Typical run: 5-30 seconds for 50 tables
- Parallel processing where possible
- Minimal database load
- Incremental updates

## Next Steps

1. **Read**: [schemas/QUICKSTART.md](schemas/QUICKSTART.md) (5 minutes)
2. **Deploy**: Copy script to backend server
3. **Sync**: Run `npm run schema:sync`
4. **Commit**: Push schemas to git
5. **Use**: Ask Claude Code about database structure

## Support

For detailed instructions, see:
- **Setup**: [SCHEMA_SYNC_SETUP.md](SCHEMA_SYNC_SETUP.md)
- **System Details**: [schemas/_SYSTEM_OVERVIEW.md](schemas/_SYSTEM_OVERVIEW.md)
- **Script Usage**: [../scripts/README.md](../scripts/README.md)

---

**Status**: Ready to deploy. Run initial sync on backend server to generate complete schema documentation.
