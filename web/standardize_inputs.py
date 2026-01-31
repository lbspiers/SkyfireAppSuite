#!/usr/bin/env python3
"""
Standardize ALL input/select/dropdown padding to var(--spacing-xs) var(--spacing)
Matches the 28px button height
"""

import re
import glob

def standardize_input_file(filepath):
    """Standardize all input/select/dropdown padding in a single CSS file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    changes = 0

    # Keywords that indicate form input classes
    input_keywords = [
        'input', 'select', 'filter', 'dropdown', 'search',
        'picker', 'chooser', 'field', 'textbox'
    ]

    def process_class(match):
        nonlocal changes
        class_name = match.group(1)
        class_body = match.group(2)

        # Check if this is an input-related class
        is_input_class = any(keyword in class_name.lower() for keyword in input_keywords)

        # Skip button classes (already handled)
        if 'button' in class_name.lower() or 'btn' in class_name.lower():
            return match.group(0)

        # Skip non-input classes
        if not is_input_class:
            return match.group(0)

        original_body = class_body

        # Check if it's a textarea (multiline) - preserve vertical, standardize horizontal
        is_textarea = 'textarea' in class_name.lower()

        if is_textarea:
            # For textarea, standardize to use spacing tokens but keep larger min-height
            class_body = re.sub(
                r'padding:\s*[^;]+;',
                'padding: var(--spacing-xs) var(--spacing);',
                class_body
            )
            # Ensure min-height is decent for multiline
            if 'min-height' not in class_body:
                # Add min-height before the closing brace
                class_body = class_body.rstrip() + '\n  min-height: 80px;'
        else:
            # For single-line inputs/selects, standardize padding
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
            # Update height if exists (remove or set to 28px)
            class_body = re.sub(
                r'height:\s*\d+px;',
                '', # Remove fixed height, let padding define it
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
            changes = standardize_input_file(filepath)
            if changes > 0:
                total_changes += changes
                processed_files.append(filepath)
                print(f"  OK {changes} input/select/dropdown classes updated")
            else:
                print(f"  - No input classes found")

    print(f"\n{'='*60}")
    print(f"SUMMARY: Updated {total_changes} input classes across {len(processed_files)} files")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
