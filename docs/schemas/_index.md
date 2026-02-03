# Database Schema Reference

**Auto-generated documentation** - Do not edit manually

This directory contains SQL schema definitions for all tables in the database.
The schemas are automatically synchronized from the PostgreSQL database.

## Usage

- Each `.sql` file contains the complete schema definition for one table
- Use these files as reference when working with the database
- Schemas are kept in sync with the actual database structure

**Last Updated:** Not yet synced (run dump-schemas.sh on backend server)
**Database:** skyfire
**Host:** localhost
**Total Tables:** 0

## Sync Summary

- New tables added: 0
- Existing tables updated: 0
- Orphaned schemas (table deleted from DB): 0

## Table List

| Status | Table | Columns | Schema File |
|--------|-------|---------|-------------|
| - | No tables synced yet | - | Run `./scripts/dump-schemas.sh` on backend |

## Orphaned Schemas

These schema files exist but their tables are no longer in the database:

*No orphaned schemas found*

## Maintenance

To refresh schemas:

```bash
# Sync all tables
./scripts/dump-schemas.sh

# Refresh specific table
./scripts/dump-schemas.sh table_name

# List tables only
./scripts/dump-schemas.sh --list
```

## Notes

- Column counts include all columns (including inherited)
- Status indicators:
  - `✓` = Current (schema exists and table exists in DB)
  - `+` = New (table was just added to the database)
  - `⚠` = Orphaned (schema exists but table was deleted from DB)
