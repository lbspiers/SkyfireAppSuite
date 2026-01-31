#!/usr/bin/env python3
"""
Equipment Catalog Normalization and Deduplication Script

This script:
1. Normalizes manufacturer names with known variations
2. Finds duplicate equipment using fuzzy matching
3. Outputs suggested changes for review
"""

import csv
import sys
from collections import defaultdict
from typing import Dict, List, Tuple
from pathlib import Path

try:
    from rapidfuzz import fuzz
except ImportError:
    print("Error: rapidfuzz not installed. Install with: pip install rapidfuzz")
    sys.exit(1)


# Known manufacturer variations mapping
MANUFACTURER_MAPPINGS = {
    # APSystems variations
    "AP SYSTEM": "APSYSTEMS",
    "APSYSTEM": "APSYSTEMS",
    "APS": "APSYSTEMS",

    # Enphase variations
    "ENPHASE": "ENPHASE",
    "ENPHASE ENERGY": "ENPHASE",

    # Hanwha Q Cells variations
    "HANWHA Q CELLS": "HANWHA Q CELLS",
    "Q CELLS": "HANWHA Q CELLS",
    "Q.CELLS": "HANWHA Q CELLS",
    "QCELLS": "HANWHA Q CELLS",
    "HANWHA": "HANWHA Q CELLS",

    # SolarEdge variations
    "SOLAREDGE": "SOLAREDGE",
    "SOLAR EDGE": "SOLAREDGE",

    # Tesla variations
    "TESLA": "TESLA",
    "TESLA ENERGY": "TESLA",

    # Chilicon Power
    "CHILICON POWER": "CHILICON POWER",
    "CHILICON": "CHILICON POWER",

    # Aptos Solar
    "APTOS SOLAR": "APTOS SOLAR",
    "APTOS": "APTOS SOLAR",

    # Hoymiles
    "HOYMILES": "HOYMILES",

    # Franklin Energy
    "FRANKLIN": "FRANKLIN",
    "FRANKLIN ENERGY": "FRANKLIN",

    # Generac
    "GENERAC": "GENERAC",
    "GENERAC POWER SYSTEMS": "GENERAC",

    # Canadian Solar
    "CANADIAN SOLAR": "CANADIAN SOLAR",
    "CANADIANSOLAR": "CANADIAN SOLAR",

    # JA Solar
    "JA SOLAR": "JA SOLAR",
    "JASOLAR": "JA SOLAR",

    # Trina Solar
    "TRINA SOLAR": "TRINA SOLAR",
    "TRINA": "TRINA SOLAR",

    # Panasonic
    "PANASONIC": "PANASONIC",

    # LG
    "LG": "LG",
    "LG ELECTRONICS": "LG",

    # REC Solar
    "REC SOLAR": "REC SOLAR",
    "REC": "REC SOLAR",

    # Silfab Solar
    "SILFAB SOLAR": "SILFAB SOLAR",
    "SILFAB": "SILFAB SOLAR",

    # Mission Solar
    "MISSION SOLAR": "MISSION SOLAR",
    "MISSION": "MISSION SOLAR",
}


def normalize_manufacturer(manufacturer: str) -> str:
    """
    Normalize manufacturer name to standard format.

    Args:
        manufacturer: Raw manufacturer name from database

    Returns:
        Normalized manufacturer name
    """
    if not manufacturer:
        return ""

    # Clean up the string
    cleaned = manufacturer.strip().upper()

    # Remove extra whitespace
    cleaned = " ".join(cleaned.split())

    # Remove common punctuation variations
    cleaned = cleaned.replace(".", "").replace(",", "")

    # Apply known mappings
    if cleaned in MANUFACTURER_MAPPINGS:
        return MANUFACTURER_MAPPINGS[cleaned]

    # Return cleaned version if no mapping found
    return cleaned


def normalize_model(model: str) -> str:
    """
    Normalize model name for comparison.

    Args:
        model: Raw model name

    Returns:
        Normalized model name
    """
    if not model:
        return ""

    # Clean up the string
    cleaned = model.strip().upper()

    # Remove extra whitespace
    cleaned = " ".join(cleaned.split())

    return cleaned


def create_comparison_key(manufacturer: str, model: str) -> str:
    """
    Create a comparison key for fuzzy matching.

    Args:
        manufacturer: Normalized manufacturer name
        model: Normalized model name

    Returns:
        Comparison key string
    """
    return f"{manufacturer}|{model}"


def find_duplicates(records: List[Dict], threshold: int = 90) -> Dict[int, Tuple[int, float]]:
    """
    Find duplicate records using fuzzy matching.

    Args:
        records: List of equipment records
        threshold: Similarity threshold (0-100)

    Returns:
        Dict mapping duplicate record ID to (canonical ID, confidence)
    """
    duplicates = {}

    # Group records by equipment type
    by_type = defaultdict(list)
    for record in records:
        equipment_type = record.get('equipment_type', '')
        by_type[equipment_type].append(record)

    # Find duplicates within each equipment type
    for equipment_type, type_records in by_type.items():
        # Sort by ID to ensure first occurrence is canonical
        type_records.sort(key=lambda r: int(r['id']))

        for i, record in enumerate(type_records):
            if int(record['id']) in duplicates:
                continue  # Already marked as duplicate

            record_key = create_comparison_key(
                normalize_manufacturer(record['manufacturer']),
                normalize_model(record['model'])
            )

            # Compare with all subsequent records
            for other_record in type_records[i+1:]:
                if int(other_record['id']) in duplicates:
                    continue  # Already marked as duplicate

                other_key = create_comparison_key(
                    normalize_manufacturer(other_record['manufacturer']),
                    normalize_model(other_record['model'])
                )

                # Use token sort ratio for better matching
                similarity = fuzz.token_sort_ratio(record_key, other_key)

                if similarity >= threshold:
                    # Mark as duplicate of the first (canonical) record
                    duplicates[int(other_record['id'])] = (int(record['id']), similarity)

    return duplicates


def process_catalog(input_file: str) -> Tuple[List[Dict], Dict[str, int]]:
    """
    Process equipment catalog and generate suggested changes.

    Args:
        input_file: Path to input CSV file

    Returns:
        Tuple of (suggested changes, manufacturer mapping counts)
    """
    # Read input file
    records = []
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)

    print(f"Loaded {len(records)} records from {input_file}")

    # Track manufacturer normalizations
    manufacturer_changes = defaultdict(int)

    # Find duplicates
    print("Finding duplicates with fuzzy matching (threshold: 90%)...")
    duplicates = find_duplicates(records, threshold=90)
    print(f"Found {len(duplicates)} duplicate records")

    # Generate suggested changes
    suggested_changes = []

    for record in records:
        record_id = int(record['id'])
        current_manufacturer = record['manufacturer']
        normalized_manufacturer = normalize_manufacturer(current_manufacturer)

        # Track manufacturer normalization
        if current_manufacturer.strip().upper() != normalized_manufacturer:
            manufacturer_changes[f"{current_manufacturer} → {normalized_manufacturer}"] += 1

        # Check if this is a duplicate
        if record_id in duplicates:
            canonical_id, confidence = duplicates[record_id]
            suggested_changes.append({
                'action': 'DELETE',
                'confidence': f"{confidence:.1f}",
                'id': record_id,
                'uuid': record['uuid'],
                'equipment_type': record['equipment_type'],
                'current_manufacturer': current_manufacturer,
                'current_model': record['model'],
                'new_manufacturer': '',
                'new_model': '',
                'duplicate_of_id': canonical_id,
                'reason': f'Duplicate of ID {canonical_id} ({confidence:.1f}% match)'
            })
        # Check if manufacturer needs normalization
        elif current_manufacturer.strip().upper() != normalized_manufacturer:
            suggested_changes.append({
                'action': 'UPDATE',
                'confidence': '100.0',
                'id': record_id,
                'uuid': record['uuid'],
                'equipment_type': record['equipment_type'],
                'current_manufacturer': current_manufacturer,
                'current_model': record['model'],
                'new_manufacturer': normalized_manufacturer,
                'new_model': record['model'],
                'duplicate_of_id': '',
                'reason': 'Manufacturer name normalization'
            })
        else:
            # No changes needed
            suggested_changes.append({
                'action': 'KEEP',
                'confidence': '100.0',
                'id': record_id,
                'uuid': record['uuid'],
                'equipment_type': record['equipment_type'],
                'current_manufacturer': current_manufacturer,
                'current_model': record['model'],
                'new_manufacturer': '',
                'new_model': '',
                'duplicate_of_id': '',
                'reason': 'No changes needed'
            })

    return suggested_changes, manufacturer_changes


def main():
    """Main execution function."""
    # Set up paths
    script_dir = Path(__file__).parent.parent
    input_file = script_dir / "src" / "constants" / "equipments.csv"
    output_file = script_dir / "suggested_changes.csv"
    mapping_file = script_dir / "manufacturer_mapping.csv"

    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)

    print(f"Processing equipment catalog: {input_file}")
    print("=" * 80)

    # Process catalog
    suggested_changes, manufacturer_changes = process_catalog(str(input_file))

    # Sort suggested changes
    # Priority: DELETE first, then UPDATE, then KEEP
    # Within each action, sort by confidence (ascending - lowest first for review)
    action_priority = {'DELETE': 0, 'UPDATE': 1, 'KEEP': 2}
    suggested_changes.sort(
        key=lambda x: (action_priority[x['action']], float(x['confidence']))
    )

    # Write suggested changes
    print(f"\nWriting suggested changes to: {output_file}")
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'action', 'confidence', 'id', 'uuid', 'equipment_type',
            'current_manufacturer', 'current_model',
            'new_manufacturer', 'new_model', 'duplicate_of_id', 'reason'
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(suggested_changes)

    # Write manufacturer mapping
    print(f"Writing manufacturer mapping to: {mapping_file}")
    manufacturer_mappings_list = []
    for change, count in sorted(manufacturer_changes.items(), key=lambda x: x[1], reverse=True):
        original, normalized = change.split(' → ')
        manufacturer_mappings_list.append({
            'original_value': original,
            'normalized_value': normalized,
            'record_count': count
        })

    with open(mapping_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['original_value', 'normalized_value', 'record_count']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(manufacturer_mappings_list)

    # Print summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)

    action_counts = defaultdict(int)
    for change in suggested_changes:
        action_counts[change['action']] += 1

    print(f"Total records processed: {len(suggested_changes)}")
    print(f"  - DELETE (duplicates): {action_counts['DELETE']}")
    print(f"  - UPDATE (normalization): {action_counts['UPDATE']}")
    print(f"  - KEEP (no changes): {action_counts['KEEP']}")
    print(f"\nManufacturer normalizations: {len(manufacturer_changes)}")

    print(f"\nOutput files:")
    print(f"  - {output_file}")
    print(f"  - {mapping_file}")
    print("\nReview suggested_changes.csv before applying to database!")


if __name__ == "__main__":
    main()
