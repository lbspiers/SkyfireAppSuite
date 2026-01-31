#!/usr/bin/env python3
"""
Optimized Equipment Catalog Duplicate Detection

Uses hash-based matching for O(n) performance instead of O(n²)
"""

import csv
import re
import sys
from collections import defaultdict
from typing import Dict, List, Optional
from pathlib import Path


# Known manufacturer variations mapping
MANUFACTURER_MAPPINGS = {
    "AP SYSTEM": "APSYSTEMS",
    "APSYSTEM": "APSYSTEMS",
    "APS": "APSYSTEMS",
    "ENPHASE": "ENPHASE",
    "ENPHASE ENERGY": "ENPHASE",
    "HANWHA Q CELLS": "HANWHA Q CELLS",
    "Q CELLS": "HANWHA Q CELLS",
    "Q.CELLS": "HANWHA Q CELLS",
    "QCELLS": "HANWHA Q CELLS",
    "HANWHA": "HANWHA Q CELLS",
    "SOLAREDGE": "SOLAREDGE",
    "SOLAR EDGE": "SOLAREDGE",
    "TESLA": "TESLA",
    "TESLA ENERGY": "TESLA",
    "CHILICON POWER": "CHILICON POWER",
    "CHILICON": "CHILICON POWER",
    "APTOS SOLAR": "APTOS SOLAR",
    "APTOS": "APTOS SOLAR",
    "HOYMILES": "HOYMILES",
    "FRANKLIN": "FRANKLIN",
    "FRANKLIN ENERGY": "FRANKLIN",
    "GENERAC": "GENERAC",
    "GENERAC POWER SYSTEMS": "GENERAC",
    "CANADIAN SOLAR": "CANADIAN SOLAR",
    "CANADIANSOLAR": "CANADIAN SOLAR",
    "JA SOLAR": "JA SOLAR",
    "JASOLAR": "JA SOLAR",
    "TRINA SOLAR": "TRINA SOLAR",
    "TRINA": "TRINA SOLAR",
    "PANASONIC": "PANASONIC",
    "LG": "LG",
    "LG ELECTRONICS": "LG",
    "REC SOLAR": "REC SOLAR",
    "REC": "REC SOLAR",
    "SILFAB SOLAR": "SILFAB SOLAR",
    "SILFAB": "SILFAB SOLAR",
    "MISSION SOLAR": "MISSION SOLAR",
    "MISSION": "MISSION SOLAR",
    "US SOLAR": "US SOLAR",
    "U.S. SOLAR": "US SOLAR",
}


def normalize_manufacturer(manufacturer: str) -> str:
    """Normalize manufacturer name to standard format."""
    if not manufacturer:
        return ""

    cleaned = manufacturer.strip().upper()
    cleaned = " ".join(cleaned.split())
    cleaned = cleaned.replace(".", "").replace(",", "")

    if cleaned in MANUFACTURER_MAPPINGS:
        return MANUFACTURER_MAPPINGS[cleaned]

    return cleaned


def normalize_model(model: str) -> str:
    """Normalize model name for exact matching."""
    if not model:
        return ""

    cleaned = model.strip().upper()
    cleaned = " ".join(cleaned.split())
    # Remove common punctuation variations
    cleaned = cleaned.replace("-", "").replace("_", "").replace("/", "")

    return cleaned


def create_duplicate_key(manufacturer: str, model: str, equipment_type: str) -> str:
    """
    Create a key for exact duplicate detection.

    For Solar Panels, model variations with different wattages are NOT duplicates.
    We normalize away minor differences but preserve meaningful distinctions.
    """
    norm_mfr = normalize_manufacturer(manufacturer)
    norm_model = normalize_model(model)

    return f"{equipment_type}|{norm_mfr}|{norm_model}"


def find_exact_duplicates(records: List[Dict]) -> List[Dict]:
    """
    Find exact duplicates using hash-based O(n) approach.

    Returns:
        List of duplicate findings
    """
    duplicates = []

    # Build hash map: key -> list of records with that key
    key_map = defaultdict(list)

    print(f"\nBuilding duplicate detection index...")

    for record in records:
        manufacturer = record['manufacturer']
        model = record['model']
        equipment_type = record['equipment_type']

        key = create_duplicate_key(manufacturer, model, equipment_type)
        key_map[key].append(record)

    print(f"Index built. Analyzing {len(key_map)} unique equipment combinations...")

    # Find groups with multiple records (duplicates)
    duplicate_count = 0

    for key, record_list in key_map.items():
        if len(record_list) > 1:
            # Sort by ID to make first one canonical
            record_list.sort(key=lambda r: int(r['id']))
            canonical = record_list[0]

            for duplicate_record in record_list[1:]:
                duplicates.append({
                    'canonical_id': canonical['id'],
                    'canonical_uuid': canonical['uuid'],
                    'canonical_manufacturer': canonical['manufacturer'],
                    'canonical_model': canonical['model'],
                    'duplicate_id': duplicate_record['id'],
                    'duplicate_uuid': duplicate_record['uuid'],
                    'duplicate_manufacturer': duplicate_record['manufacturer'],
                    'duplicate_model': duplicate_record['model'],
                    'equipment_type': canonical['equipment_type'],
                    'confidence': 100.0,
                    'reason': 'Exact duplicate (identical normalized manufacturer + model)',
                })
                duplicate_count += 1

    print(f"Found {len([k for k, v in key_map.items() if len(v) > 1])} unique equipment with duplicates")
    print(f"Total duplicate records: {duplicate_count}")

    return duplicates


def main():
    """Main execution function."""
    # Set up paths
    script_dir = Path(__file__).parent.parent
    input_file = script_dir / "src" / "constants" / "equipments.csv"
    output_file = script_dir / "duplicates_review.csv"
    update_file = script_dir / "manufacturer_updates.csv"

    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)

    print(f"Processing equipment catalog: {input_file}")
    print("=" * 80)

    # Read input file
    records = []
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)

    print(f"Loaded {len(records)} records")

    # Find exact duplicates
    duplicates = find_exact_duplicates(records)

    print(f"\n{'=' * 80}")
    print(f"Found {len(duplicates)} EXACT duplicates")
    print(f"{'=' * 80}")

    # Sort by equipment type, then canonical ID
    duplicates.sort(key=lambda x: (x['equipment_type'], int(x['canonical_id'])))

    # Write duplicates review file
    print(f"\nWriting duplicates to: {output_file}")
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'action', 'confidence', 'reason',
            'duplicate_id', 'duplicate_uuid', 'duplicate_manufacturer', 'duplicate_model',
            'canonical_id', 'canonical_uuid', 'canonical_manufacturer', 'canonical_model',
            'equipment_type'
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for dup in duplicates:
            writer.writerow({
                'action': 'DELETE',
                'confidence': f"{dup['confidence']:.1f}",
                'reason': dup['reason'],
                'duplicate_id': dup['duplicate_id'],
                'duplicate_uuid': dup['duplicate_uuid'],
                'duplicate_manufacturer': dup['duplicate_manufacturer'],
                'duplicate_model': dup['duplicate_model'],
                'canonical_id': dup['canonical_id'],
                'canonical_uuid': dup['canonical_uuid'],
                'canonical_manufacturer': dup['canonical_manufacturer'],
                'canonical_model': dup['canonical_model'],
                'equipment_type': dup['equipment_type'],
            })

    # Generate manufacturer updates
    print(f"Writing manufacturer updates to: {update_file}")
    manufacturer_updates = []
    manufacturer_changes = defaultdict(int)

    for record in records:
        current_manufacturer = record['manufacturer']
        normalized_manufacturer = normalize_manufacturer(current_manufacturer)

        if current_manufacturer.strip().upper() != normalized_manufacturer:
            manufacturer_changes[f"{current_manufacturer} → {normalized_manufacturer}"] += 1
            manufacturer_updates.append({
                'id': record['id'],
                'uuid': record['uuid'],
                'equipment_type': record['equipment_type'],
                'current_manufacturer': current_manufacturer,
                'new_manufacturer': normalized_manufacturer,
                'model': record['model'],
            })

    with open(update_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['id', 'uuid', 'equipment_type', 'current_manufacturer', 'new_manufacturer', 'model']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(manufacturer_updates)

    # Print summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)

    print(f"\nDuplicate Analysis:")
    print(f"  Total records: {len(records)}")
    print(f"  Exact duplicates found: {len(duplicates)} ({len(duplicates)/len(records)*100:.1f}%)")
    print(f"  After deduplication: {len(records) - len(duplicates)} unique equipment items")

    # Break down by equipment type
    by_type = defaultdict(int)
    for dup in duplicates:
        by_type[dup['equipment_type']] += 1

    if by_type:
        print(f"\n  Duplicates by equipment type:")
        for eq_type, count in sorted(by_type.items(), key=lambda x: x[1], reverse=True)[:15]:
            print(f"    - {eq_type}: {count}")

    print(f"\nManufacturer Normalizations:")
    print(f"  Records needing update: {len(manufacturer_updates)}")
    print(f"  Unique variations: {len(manufacturer_changes)}")

    if manufacturer_changes:
        print(f"\n  All manufacturer variations:")
        for change, count in sorted(manufacturer_changes.items(), key=lambda x: x[1], reverse=True):
            print(f"    - {change}: {count} records")

    print(f"\nOutput files:")
    print(f"  - {output_file} (EXACT duplicates only - safe to delete)")
    print(f"  - {update_file} (manufacturer normalizations - safe to apply)")

    if duplicates:
        print("\n✅ These are EXACT duplicates (same normalized manufacturer + model)")
        print("   Safe to delete after brief review.")
    else:
        print("\n✅ No exact duplicates found!")
        print("   All equipment variations represent distinct products.")


if __name__ == "__main__":
    main()
