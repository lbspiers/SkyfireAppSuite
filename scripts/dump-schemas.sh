#!/bin/bash

# Database Schema Auto-Sync Script
# Automatically discovers all tables, updates schemas, and maintains reference docs
#
# Usage:
#   ./scripts/dump-schemas.sh              # Full sync - discover all tables
#   ./scripts/dump-schemas.sh table_name   # Refresh specific table
#   ./scripts/dump-schemas.sh --list       # List all tables only

set -e

# Configuration
PGDATABASE=${PGDATABASE:-skyfire}
PGHOST=${PGHOST:-localhost}
PGPORT=${PGPORT:-5432}
PGUSER=${PGUSER:-postgres}

SCHEMA_DIR="docs/schemas"
INDEX_FILE="${SCHEMA_DIR}/_index.md"
TABLE_LIST_FILE="${SCHEMA_DIR}/_table_list.txt"
TEMP_CURRENT_TABLES="/tmp/current_tables_$$.txt"
TEMP_OLD_TABLES="/tmp/old_tables_$$.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure schema directory exists
mkdir -p "${SCHEMA_DIR}"

# Function to get all current tables from database
get_all_tables() {
    psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -t -A -c "
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    " | grep -v '^$'
}

# Function to get column count for a table
get_column_count() {
    local table_name=$1
    psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -t -A -c "
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '${table_name}';
    "
}

# Function to dump schema for a single table
dump_table_schema() {
    local table_name=$1
    local output_file="${SCHEMA_DIR}/${table_name}.sql"

    echo -e "${BLUE}Dumping schema for: ${table_name}${NC}"

    pg_dump -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" \
        --schema-only \
        --no-owner \
        --no-privileges \
        --no-tablespaces \
        -t "public.${table_name}" \
        > "${output_file}"

    # Add header comment with metadata
    local temp_file="${output_file}.tmp"
    {
        echo "-- Table: ${table_name}"
        echo "-- Database: ${PGDATABASE}"
        echo "-- Dumped: $(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
        cat "${output_file}"
    } > "${temp_file}"
    mv "${temp_file}" "${output_file}"

    echo -e "${GREEN}✓ ${table_name}.sql${NC}"
}

# Function to generate the index file
generate_index() {
    local new_count=$1
    local updated_count=$2
    local orphaned_count=$3
    local total_tables=$4

    echo -e "${BLUE}Generating index file...${NC}"

    cat > "${INDEX_FILE}" << 'EOF_HEADER'
# Database Schema Reference

**Auto-generated documentation** - Do not edit manually

This directory contains SQL schema definitions for all tables in the database.
The schemas are automatically synchronized from the PostgreSQL database.

## Usage

- Each `.sql` file contains the complete schema definition for one table
- Use these files as reference when working with the database
- Schemas are kept in sync with the actual database structure

EOF_HEADER

    # Add metadata
    cat >> "${INDEX_FILE}" << EOF
**Last Updated:** $(date '+%Y-%m-%d %H:%M:%S')
**Database:** ${PGDATABASE}
**Host:** ${PGHOST}
**Total Tables:** ${total_tables}

## Sync Summary

- New tables added: ${new_count}
- Existing tables updated: ${updated_count}
- Orphaned schemas (table deleted from DB): ${orphaned_count}

## Table List

| Status | Table | Columns | Schema File |
|--------|-------|---------|-------------|
EOF

    # Read current tables and generate table list
    while IFS= read -r table_name; do
        local column_count=$(get_column_count "${table_name}")
        local status="✓"

        # Check if this is a new table (not in old list)
        if [ -f "${TEMP_OLD_TABLES}" ] && ! grep -q "^${table_name}$" "${TEMP_OLD_TABLES}"; then
            status="+"
        fi

        echo "| ${status} | ${table_name} | ${column_count} | [${table_name}.sql](./${table_name}.sql) |" >> "${INDEX_FILE}"
    done < "${TEMP_CURRENT_TABLES}"

    # Check for orphaned schemas
    if [ -f "${TEMP_OLD_TABLES}" ]; then
        echo "" >> "${INDEX_FILE}"
        echo "## Orphaned Schemas" >> "${INDEX_FILE}"
        echo "" >> "${INDEX_FILE}"
        echo "These schema files exist but their tables are no longer in the database:" >> "${INDEX_FILE}"
        echo "" >> "${INDEX_FILE}"

        local has_orphans=false
        while IFS= read -r old_table; do
            if ! grep -q "^${old_table}$" "${TEMP_CURRENT_TABLES}"; then
                echo "| ⚠ | ${old_table} | - | [${old_table}.sql](./${old_table}.sql) |" >> "${INDEX_FILE}"
                has_orphans=true
            fi
        done < "${TEMP_OLD_TABLES}"

        if [ "$has_orphans" = false ]; then
            echo "*No orphaned schemas found*" >> "${INDEX_FILE}"
        fi
    fi

    # Add footer
    cat >> "${INDEX_FILE}" << 'EOF_FOOTER'

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

EOF_FOOTER

    echo -e "${GREEN}✓ Index file generated${NC}"
}

# Main execution logic

# Handle --list flag
if [ "$1" = "--list" ]; then
    echo -e "${BLUE}Querying database for tables...${NC}"
    get_all_tables
    exit 0
fi

# Handle single table refresh
if [ -n "$1" ] && [ "$1" != "--list" ]; then
    TABLE_NAME=$1
    echo -e "${BLUE}Refreshing schema for table: ${TABLE_NAME}${NC}"

    # Verify table exists
    if ! get_all_tables | grep -q "^${TABLE_NAME}$"; then
        echo -e "${RED}Error: Table '${TABLE_NAME}' not found in database${NC}"
        exit 1
    fi

    dump_table_schema "${TABLE_NAME}"
    echo -e "${GREEN}Schema refresh complete for ${TABLE_NAME}${NC}"
    exit 0
fi

# Full sync mode
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Database Schema Auto-Sync${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Database: ${GREEN}${PGDATABASE}${NC}"
echo -e "Host: ${GREEN}${PGHOST}:${PGPORT}${NC}"
echo -e "User: ${GREEN}${PGUSER}${NC}"
echo ""

# Get current tables from database
echo -e "${BLUE}Discovering tables in database...${NC}"
get_all_tables > "${TEMP_CURRENT_TABLES}"
CURRENT_TABLE_COUNT=$(wc -l < "${TEMP_CURRENT_TABLES}")
echo -e "${GREEN}Found ${CURRENT_TABLE_COUNT} tables${NC}"
echo ""

# Load old table list if it exists
if [ -f "${TABLE_LIST_FILE}" ]; then
    cp "${TABLE_LIST_FILE}" "${TEMP_OLD_TABLES}"
else
    touch "${TEMP_OLD_TABLES}"
fi

# Compare and categorize tables
NEW_TABLES=()
UPDATED_TABLES=()
ORPHANED_TABLES=()

# Find new and existing tables
while IFS= read -r table_name; do
    if grep -q "^${table_name}$" "${TEMP_OLD_TABLES}"; then
        UPDATED_TABLES+=("${table_name}")
    else
        NEW_TABLES+=("${table_name}")
    fi
done < "${TEMP_CURRENT_TABLES}"

# Find orphaned tables (in old list but not in current DB)
if [ -f "${TEMP_OLD_TABLES}" ]; then
    while IFS= read -r old_table; do
        if ! grep -q "^${old_table}$" "${TEMP_CURRENT_TABLES}"; then
            ORPHANED_TABLES+=("${old_table}")
        fi
    done < "${TEMP_OLD_TABLES}"
fi

# Report findings
echo -e "${BLUE}Analysis:${NC}"
echo -e "  New tables: ${GREEN}${#NEW_TABLES[@]}${NC}"
echo -e "  Existing tables to update: ${YELLOW}${#UPDATED_TABLES[@]}${NC}"
echo -e "  Orphaned schemas: ${RED}${#ORPHANED_TABLES[@]}${NC}"
echo ""

# Dump new tables
if [ ${#NEW_TABLES[@]} -gt 0 ]; then
    echo -e "${GREEN}Adding new tables:${NC}"
    for table_name in "${NEW_TABLES[@]}"; do
        dump_table_schema "${table_name}"
    done
    echo ""
fi

# Update existing tables
if [ ${#UPDATED_TABLES[@]} -gt 0 ]; then
    echo -e "${YELLOW}Updating existing tables:${NC}"
    for table_name in "${UPDATED_TABLES[@]}"; do
        dump_table_schema "${table_name}"
    done
    echo ""
fi

# Report orphaned tables
if [ ${#ORPHANED_TABLES[@]} -gt 0 ]; then
    echo -e "${RED}Orphaned schemas (table deleted from DB):${NC}"
    for table_name in "${ORPHANED_TABLES[@]}"; do
        echo -e "  ${RED}⚠ ${table_name}.sql${NC}"
    done
    echo -e "${YELLOW}Note: These schema files still exist but the tables are gone from the database${NC}"
    echo ""
fi

# Update table list file
cp "${TEMP_CURRENT_TABLES}" "${TABLE_LIST_FILE}"
echo -e "${GREEN}✓ Updated table list${NC}"

# Generate index
generate_index "${#NEW_TABLES[@]}" "${#UPDATED_TABLES[@]}" "${#ORPHANED_TABLES[@]}" "${CURRENT_TABLE_COUNT}"

# Cleanup
rm -f "${TEMP_CURRENT_TABLES}" "${TEMP_OLD_TABLES}"

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Schema sync complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Summary:"
echo -e "  ${GREEN}✓${NC} Added ${#NEW_TABLES[@]} new tables"
echo -e "  ${GREEN}✓${NC} Updated ${#UPDATED_TABLES[@]} existing tables"
if [ ${#ORPHANED_TABLES[@]} -gt 0 ]; then
    echo -e "  ${YELLOW}⚠${NC} Found ${#ORPHANED_TABLES[@]} orphaned schemas"
fi
echo -e "  ${GREEN}✓${NC} Generated index at ${INDEX_FILE}"
echo -e "  ${GREEN}✓${NC} Updated table list at ${TABLE_LIST_FILE}"
echo ""
echo -e "Next steps:"
echo -e "  1. Review changes: ${BLUE}git diff ${SCHEMA_DIR}${NC}"
echo -e "  2. Commit changes: ${BLUE}git add ${SCHEMA_DIR} && git commit -m 'Update database schemas'${NC}"
echo -e "  3. Push to remote: ${BLUE}git push${NC}"
echo ""
