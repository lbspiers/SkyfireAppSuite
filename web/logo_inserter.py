"""
Logo insertion module for PDF plansets using PyMuPDF.
Supports both image logos (PNG/JPG) and PDF logos.
PDF logos preserve exact positioning from source file.
"""

import os
import shutil
from datetime import datetime
import fitz  # PyMuPDF

# =========================
# CONFIGURATION
# =========================

LOGO_DIR = r"C:\Users\LoganSpiers\Dropbox\Skyfire App\Client Templates DWG\logos"

LOGO_CONFIG = {
    # Rendering options
    "as_background": True,

    # Debug mode
    "debug_draw_box": False
}

POINTS_PER_INCH = 72


# =========================
# BACKUP FUNCTION
# =========================

def create_backup():
    """Create timestamped backup of this file."""
    current_file = __file__
    if not os.path.exists(current_file):
        return None

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"logo_inserter_backup_{timestamp}.py"
    backup_path = os.path.join(os.path.dirname(current_file), backup_name)

    try:
        shutil.copy2(current_file, backup_path)
        print(f"✓ Backup created: {backup_name}")
        return backup_path
    except Exception as e:
        print(f"✗ Backup failed: {e}")
        return None


# =========================
# PUBLIC ENTRY POINT
# =========================

def add_company_logo(
    pdf_path: str,
    client: str,
    modify_inplace: bool = True,
    config: dict = None
) -> str:
    """
    Add company logo to all pages of a PDF.
    Supports both image logos and PDF logos.

    Args:
        pdf_path: Path to PDF file (modified in-place)
        client: Client name (logo filename match)
        modify_inplace: Accepted for compatibility
        config: Optional override config

    Returns:
        Path to modified PDF (or original path if skipped/failed)
    """
    try:
        cfg = LOGO_CONFIG.copy()
        if config:
            cfg.update(config)

        client = client.strip()

        logo_path = _find_logo_file(client)
        if not logo_path:
            print(f"⚠ Logo not found for client '{client}' — skipping logo insertion")
            return pdf_path

        print(f"✓ Found logo: {os.path.basename(logo_path)}")

        # Check if logo is PDF or image
        is_pdf_logo = logo_path.lower().endswith('.pdf')

        doc = fitz.open(pdf_path)
        num_pages = len(doc)

        if is_pdf_logo:
            print(f"  Using PDF overlay method (exact copy from source)")
            logo_doc = fitz.open(logo_path)

            for page_index, page in enumerate(doc):
                _overlay_pdf_logo(page, logo_doc, cfg)

            logo_doc.close()
        else:
            print(f"  Using image insertion method")
            for page_index, page in enumerate(doc):
                _stamp_image_logo(page, logo_path, cfg)

        doc.save(pdf_path, incremental=True, encryption=fitz.PDF_ENCRYPT_KEEP)
        doc.close()

        print(f"✓ Logo applied successfully to {num_pages} page(s)")
        return pdf_path

    except Exception as e:
        print(f"✗ Logo insertion failed for '{client}': {e}")
        import traceback
        traceback.print_exc()
        return pdf_path  # NEVER block the publish pipeline


# =========================
# INTERNAL HELPERS
# =========================

def _find_logo_file(client_name: str) -> str | None:
    """Find logo file by client name (case-insensitive). Checks PDF first, then images."""
    if not os.path.exists(LOGO_DIR):
        return None

    # Check for PDF first (preferred for exact positioning)
    # Try with " Logo" suffix first (standard naming convention)
    for ext in (".pdf", ".PDF"):
        path = os.path.join(LOGO_DIR, f"{client_name} Logo{ext}")
        if os.path.exists(path):
            return path

    # Try without " Logo" suffix as fallback
    for ext in (".pdf", ".PDF"):
        path = os.path.join(LOGO_DIR, f"{client_name}{ext}")
        if os.path.exists(path):
            return path

    # Fall back to image formats with " Logo" suffix
    for ext in (".png", ".jpg", ".jpeg", ".PNG", ".JPG", ".JPEG"):
        path = os.path.join(LOGO_DIR, f"{client_name} Logo{ext}")
        if os.path.exists(path):
            return path

    # Try images without " Logo" suffix
    for ext in (".png", ".jpg", ".jpeg", ".PNG", ".JPG", ".JPEG"):
        path = os.path.join(LOGO_DIR, f"{client_name}{ext}")
        if os.path.exists(path):
            return path

    return None


def _overlay_pdf_logo(page, logo_doc, cfg: dict):
    """
    Overlay entire logo PDF page onto target page.
    This preserves EXACT positioning from the source PDF.
    """
    page_rect = page.rect

    print(f"  Page {page.number + 1}: {page_rect.width/72:.2f}\" x {page_rect.height/72:.2f}\"")
    print(f"    Overlaying logo PDF (preserves source positioning)...")

    # Overlay the first page of logo PDF onto target page
    # This is the programmatic equivalent of copy/paste in Adobe Acrobat
    page.show_pdf_page(
        page_rect,              # Target area (full page)
        logo_doc,               # Source document
        0,                      # Page number (first page of logo PDF)
        overlay=not cfg["as_background"]  # True=foreground, False=background
    )

    print(f"    ✓ Logo PDF overlaid")


def _stamp_image_logo(page, logo_path: str, cfg: dict):
    """
    Insert image logo with calculated positioning.
    Fallback method for when logo is not a PDF.
    """
    page_rect = page.rect
    pw = page_rect.width
    ph = page_rect.height

    # Default positioning (bottom-right for portrait, rotated 270° / -90°)
    width = 1.30 * POINTS_PER_INCH
    height = 1.30 * POINTS_PER_INCH
    right_margin = 0.75 * POINTS_PER_INCH
    bottom_margin = 0.75 * POINTS_PER_INCH

    # Shift 0.75 inch up (towards top) and 0.5 inch left from original position
    up_shift = 0.75 * POINTS_PER_INCH
    left_shift = 0.5 * POINTS_PER_INCH

    # Bottom-right of portrait page, shifted up 0.75" and left 0.5"
    x = pw - width - right_margin - left_shift
    y = ph - height - bottom_margin - up_shift

    logo_rect = fitz.Rect(x, y, x + width, y + height)

    print(f"  Page {page.number + 1}: {pw/72:.2f}\" x {ph/72:.2f}\"")
    print(f"    Image logo at: ({x:.1f}, {y:.1f}) - shifted 0.75\" up, 0.5\" left")

    # Insert logo with rotation (270° = -90°)
    page.insert_image(
        logo_rect,
        filename=logo_path,
        rotate=270,  # 270° (or -90°) - rotated opposite from original 90°
        overlay=not cfg["as_background"],
        keep_proportion=True
    )

    print(f"    ✓ Image logo inserted")


# =========================
# CLI SUPPORT
# =========================

if __name__ == "__main__":
    import sys

    # Create backup before running
    create_backup()

    if len(sys.argv) < 3:
        print("Usage: python logo_inserter.py <pdf_path> <client_name>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    client_name = sys.argv[2]

    add_company_logo(pdf_path, client_name)
