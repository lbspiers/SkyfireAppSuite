#!/usr/bin/env python3
"""
Standardize ALL button padding to var(--spacing-xs) var(--spacing)
"""

import re
import os
import glob

def standardize_button_file(filepath):
    """Standardize all button padding in a single CSS file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    changes = 0

    # Pattern to match class blocks
    # This matches .className { ... } including nested content
    def process_class(match):
        nonlocal changes
        class_name = match.group(1)
        class_body = match.group(2)

        # Check if this is a button-related class
        if not re.search(r'button|btn', class_name, re.IGNORECASE):
            return match.group(0)

        original_body = class_body

        # Replace padding
        class_body = re.sub(
            r'padding:\s*[^;]+;',
            'padding: var(--spacing-xs) var(--spacing);',
            class_body
        )

        # Update min-height if exists
        class_body = re.sub(
            r'min-height:\s*\d+px;',
            'min-height: 28px;',
            class_body
        )

        if original_body != class_body:
            changes += 1
            print(f"  Updated .{class_name}")

        return f".{class_name} {{{class_body}}}"

    # Match class definitions
    content = re.sub(
        r'\.([a-zA-Z][\w-]*)\s*\{([^}]*)\}',
        process_class,
        content,
        flags=re.MULTILINE
    )

    if original_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return changes
    return 0

def main():
    # Files to process (excluding ui/ and dev/ per doctrine)
    files = [
        'src/components/common/*.module.css',
        'src/components/pdf/*.module.css',
        'src/components/project/*.module.css',
        'src/components/project/**/*.module.css',
        'src/pages/*.module.css',
        'src/styles/*.module.css',
    ]

    total_changes = 0
    processed_files = []

    for pattern in files:
        for filepath in glob.glob(pattern, recursive=True):
            # Skip ui/ and dev/ directories
            if '/ui/' in filepath.replace('\\', '/') or '/dev/' in filepath.replace('\\', '/'):
                continue

            print(f"\nProcessing {filepath}...")
            changes = standardize_button_file(filepath)
            if changes > 0:
                total_changes += changes
                processed_files.append(filepath)
                print(f"  OK {changes} button classes updated")
            else:
                print(f"  - No button classes found")

    print(f"\n{'='*60}")
    print(f"SUMMARY: Updated {total_changes} button classes across {len(processed_files)} files")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
