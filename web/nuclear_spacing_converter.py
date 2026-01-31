#!/usr/bin/env python3
"""
Nuclear Spacing Converter
Converts ALL spacing values to var(--spacing) following the doctrine
"""

import re
import sys

def convert_spacing_value(value):
    """Convert any spacing value to var(--spacing)"""
    # Skip if already var(--spacing)
    if value == 'var(--spacing)':
        return value

    # List of values to convert
    spacing_values = [
        'var(--spacing-wide)', 'var(--spacing-loose)',
        'var(--spacing-tight)', 'var(--spacing-xs)', 'var(--spacing-2xl)',
        '2rem', '1.5rem', '1.25rem', '1rem', '0.875rem', '0.75rem', '0.5rem', '0.375rem', '0.25rem', '0.125rem',
        '32px', '24px', '20px', '18px', '16px', '14px', '12px', '10px', '8px', '6px', '4px', '2px', '1px',
        '3rem', '2.5rem', '2.25rem', '1.75rem', '1.125rem', '0.625rem',
        '40px', '36px', '30px', '28px', '26px', '22px', '15px', '5px', '3px'
    ]

    if value in spacing_values:
        return 'var(--spacing)'

    return value

def process_padding(padding_value):
    """Process padding values - convert all to var(--spacing) but keep structure"""
    parts = padding_value.strip().split()
    if not parts:
        return padding_value

    # Convert all parts
    converted = [convert_spacing_value(p) for p in parts]
    return ' '.join(converted)

def process_margin(margin_value):
    """Process margin values - convert all to var(--spacing)"""
    parts = margin_value.strip().split()
    if not parts:
        return margin_value

    # Convert all parts
    converted = [convert_spacing_value(p) for p in parts]
    return ' '.join(converted)

def process_gap(gap_value):
    """Process gap values - convert to var(--spacing)"""
    return convert_spacing_value(gap_value.strip())

def convert_file(filepath):
    """Convert all spacing in a CSS file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match padding: value;
    content = re.sub(
        r'padding:\s*([^;]+);',
        lambda m: f'padding: {process_padding(m.group(1))};',
        content
    )

    # Pattern to match margin: value;
    content = re.sub(
        r'margin:\s*([^;]+);',
        lambda m: f'margin: {process_margin(m.group(1))};',
        content
    )

    # Pattern to match gap: value;
    content = re.sub(
        r'gap:\s*([^;]+);',
        lambda m: f'gap: {process_gap(m.group(1))};',
        content
    )

    # Pattern to match margin-top, margin-bottom, margin-left, margin-right
    for prop in ['margin-top', 'margin-bottom', 'margin-left', 'margin-right']:
        content = re.sub(
            rf'{prop}:\s*([^;]+);',
            lambda m: f'{prop}: {convert_spacing_value(m.group(1).strip())};',
            content
        )

    # Pattern to match padding-top, padding-bottom, padding-left, padding-right
    for prop in ['padding-top', 'padding-bottom', 'padding-left', 'padding-right']:
        content = re.sub(
            rf'{prop}:\s*([^;]+);',
            lambda m: f'{prop}: {convert_spacing_value(m.group(1).strip())};',
            content
        )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Converted {filepath}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python nuclear_spacing_converter.py <file.css>")
        sys.exit(1)

    convert_file(sys.argv[1])
