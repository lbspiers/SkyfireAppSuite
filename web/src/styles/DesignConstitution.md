# 🎨 SKYFIRE DESIGN CONSTITUTION
## The Complete Design System Reference
**Last Updated:** January 2026
**Status:** ✅ Verified against Design Portal implementation

---

> ⚠️ **MANDATORY READING BEFORE ANY DEVELOPMENT**
>
> This document is the **single source of truth** for all UI development.
> Every pattern, component, token, and rule documented here reflects the **actual Design Portal implementation**.
> Deviations from this document will be rejected.

---

## 📖 Table of Contents

1. [Core Principles](#core-principles)
2. [Styling Rules](#styling-rules)
3. [Design Tokens Reference](#design-tokens-reference)
4. [Component Library](#component-library)
5. [Layout Patterns](#layout-patterns)
6. [Equipment Form Patterns](#equipment-form-patterns)
7. [File Structure](#file-structure)
8. [Pre-Commit Checklist](#pre-commit-checklist)
9. [Migration Guide](#migration-guide)

---

## 🎯 Core Principles

### 1. Token-First Development
**Every visual property must use a design token.**

```css
/* ❌ WRONG */
color: #FD7332;
margin: 16px;
font-size: 14px;

/* ✅ CORRECT */
color: var(--color-primary);
margin-bottom: var(--spacing);
font-size: var(--text-sm);
```

### 2. CSS Modules Only
**No inline styles for static properties.**

```jsx
/* ❌ WRONG - Static inline styles */
<div style={{ marginBottom: '16px', color: '#FD7332' }}>

/* ✅ CORRECT - CSS Modules */
import styles from './Component.module.css';
<div className={styles.container}>
```

**Exception:** Dynamic layout logic only
```jsx
/* ✅ OK - Runtime calculated values */
<div style={{ left: `${calculated}px` }}>
<div style={{ display: 'flex', flexDirection: 'column' }}>
```

### 3. Component Reuse
**Always use existing components before creating new ones.**

Check `src/components/ui/` before building ANY UI element.

### 4. Spacing Direction Convention
- **Vertical:** Use `margin-bottom` ONLY (never `margin-top`)
- **Horizontal:** Use `margin-right` ONLY (never `margin-left`)
- **Flex/Grid:** Use `gap` instead of margins

```css
/* ❌ WRONG */
.item {
  margin-top: var(--spacing);
  margin-left: var(--spacing);
}

/* ✅ CORRECT */
.container {
  display: flex;
  gap: var(--spacing);
}

.item {
  margin-bottom: var(--spacing);
  margin-right: var(--spacing);
}
```

---

## 🎨 Styling Rules

### Rule 1: No Inline Styles for Static Properties

**FORBIDDEN:**
```jsx
<div style={{ color: '#FD7332', padding: '16px' }}>
<span style={{ fontSize: '14px', fontWeight: 600 }}>
```

**ALLOWED (Dynamic Only):**
```jsx
<div style={{ left: `${position}px` }}>
<div style={{ display: 'flex', flexDirection: isVertical ? 'column' : 'row' }}>
```

### Rule 2: CSS Modules + Design Tokens

Every component MUST have:
- `ComponentName.js` - Component logic
- `ComponentName.module.css` - Component styles

```jsx
// ComponentName.js
import styles from './ComponentName.module.css';

const ComponentName = () => (
  <div className={styles.container}>
    <span className={styles.label}>Label</span>
  </div>
);
```

```css
/* ComponentName.module.css */
.container {
  padding: var(--spacing);
  background: var(--bg-surface);
  border-radius: var(--radius-md);
}

.label {
  font-size: var(--text-sm);
  color: var(--text-muted);
}
```

### Rule 3: Import Pattern

Use **direct imports** from individual component files:

```jsx
/* ✅ CORRECT */
import Button from '../ui/Button';
import EquipmentRow from '../ui/EquipmentRow';
import TableDropdown from '../ui/TableDropdown';

/* ❌ WRONG - Barrel exports not used */
import { Button, EquipmentRow } from '../ui';
```

---

## 🎨 Design Tokens Reference

All tokens are defined in: **`src/styles/tokens.css`**

### Spacing Tokens

| Token | Size | Usage |
|-------|------|-------|
| `--spacing-xxs` | 6px | Portal pills, micro adjustments |
| `--spacing-xs` | 4px | Micro adjustments |
| `--spacing-tight` | 8px | **Compact spacing** - tabs, labels, icon gaps |
| `--spacing-sm` | 12px | Small spacing |
| `--spacing` | **16px** | **DEFAULT** - Use when unsure |
| `--spacing-md` | 20px | Medium spacing |
| `--spacing-loose` | 24px | **Section breaks** |
| `--spacing-wide` | 32px | **Major sections** |
| `--spacing-2xl` | 48px | Hero sections |
| `--spacing-3xl` | 64px | Extra large sections |

**Default Rule:** When unsure, use `var(--spacing)` (16px)

**Common Patterns:**
```css
/* Section wrapper */
.section {
  margin-bottom: var(--spacing);
}

/* Button groups */
.buttonGroup {
  display: flex;
  gap: var(--spacing-tight);
}

/* Form fields */
.fieldGroup {
  display: flex;
  flex-direction: column;
  gap: var(--spacing);
}

/* Major section breaks */
.majorSection {
  margin-bottom: var(--spacing-loose);
}
```

### Color Tokens

#### Brand Colors
```css
--color-primary: #FD7332;           /* Skyfire Orange */
--color-primary-dark: #B92011;
--color-primary-light: #FF8C42;
--color-primary-lighter: rgba(253, 115, 50, 0.05);
```

#### Grayscale (Tailwind Compatible)
```css
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;
```

#### Background Colors
```css
--bg-page: #0C1F3F;                 /* Page background */
--bg-panel: #0A1628;                /* Panel background */
--bg-surface: #111C2E;              /* Surface/card background */
--bg-elevated: #213454;             /* Elevated elements */
--bg-input: #0C1F3F;                /* Input fields */
--bg-input-hover: #2E4161;
--bg-input-disabled: rgba(30, 41, 59, 0.5);
--bg-glass: rgba(17, 24, 39, 0.7);
--bg-hover: rgba(255, 255, 255, 0.05);
--bg-active: rgba(255, 255, 255, 0.1);
```

#### Text Colors
```css
--text-primary: #F9FAFB;            /* Primary text */
--text-secondary: #D1D5DB;          /* Secondary text */
--text-tertiary: #9CA3AF;           /* Tertiary text */
--text-muted: #9CA3AF;              /* Muted/labels */
--text-disabled: #6B7280;           /* Disabled state */
```

#### Border Colors
```css
--border-subtle: rgba(255, 255, 255, 0.1);
--border-default: rgba(255, 255, 255, 0.15);
--border-elevated: rgba(255, 255, 255, 0.2);
--border-focus: #FD7332;
--border-inactive: #888888;
```

#### Status Colors
```css
--color-success: #10B981;           /* Green - success */
--color-info: #3B82F6;              /* Blue - info */
--color-warning: #F59E0B;           /* Amber - warning */
--color-error: #EF4444;             /* Red - error */

/* Light variants for backgrounds */
--color-success-light: rgba(16, 185, 129, 0.1);
--color-warning-light: rgba(245, 158, 11, 0.1);
--color-error-light: rgba(239, 68, 68, 0.1);
--color-info-light: rgba(59, 130, 246, 0.1);
```

#### Project Status Colors (Mobile App Sync)
```css
--status-pending: #94A3B8;
--status-sales: #E6C800;
--status-site-survey: #FFA300;
--status-design: #FD7332;
--status-revisions: #FF0000;
--status-permits: #7FDB51;
--status-install: #00B140;
--status-commissioning: #00B7C2;
--status-inspection: #00B7C2;
--status-pto: #6A0DAD;
--status-on-hold: #979797;
--status-canceled: #000000;
```

#### Semantic Colors
```css
--color-link: #0EA5E9;              /* Sky blue - hyperlinks */
--color-danger: #DC2626;            /* Red-600 - delete/destructive */
```

#### Accent Colors (Charts, Visualizations)
```css
--color-accent-blue: #3B82F6;
--color-accent-blue-dark: #2563EB;
--color-accent-blue-light: #60A5FA;
--color-accent-pink: #EC4899;
--color-accent-indigo: #6366F1;
--color-accent-purple: #8B5CF6;
--color-accent-cyan: #06B6D4;
--color-accent-yellow: #EAB308;
```

#### Overlay Tokens (Modals, Backdrops)
```css
--overlay-light: rgba(0, 0, 0, 0.5);
--overlay-medium: rgba(0, 0, 0, 0.7);
--overlay-dark: rgba(0, 0, 0, 0.95);
```

### Typography Tokens

#### Font Families
```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;
```

#### Font Sizes
```css
--text-xs: 0.75rem;      /* 12px - Labels, hints */
--text-sm: 0.875rem;     /* 14px - UI elements (MOST COMMON) */
--text-base: 1rem;       /* 16px - Body text */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.5rem;      /* 40px */
```

**Default:** `--text-sm` for most UI elements

#### Font Weights
```css
--font-normal: 400;      /* Default text */
--font-medium: 500;      /* Field values */
--font-semibold: 600;    /* Titles, labels */
--font-bold: 700;        /* Emphasis */
```

#### Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Border Tokens

#### Border Radius
```css
--radius-sm: 0.25rem;    /* 4px */
--radius-md: 0.5rem;     /* 8px - DEFAULT */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-pill: 9999px;   /* Pill shape */
--radius-circle: 50%;    /* Perfect circle */
```

#### Border Widths
```css
--border-thin: 1px;
--border-medium: 2px;
```

### Shadow Tokens

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.2);
--shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.3);
--shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.4);

/* Glow effects */
--glow-orange: 0 0 20px rgba(253, 115, 50, 0.4);
--glow-orange-strong: 0 4px 12px rgba(253, 115, 50, 0.5);
--glow-blue: 0 0 20px rgba(59, 130, 246, 0.3);
--glow-blue-strong: 0 4px 12px rgba(59, 130, 246, 0.4);

/* Component-specific */
--shadow-tab: 4px 4px 8px rgba(0, 0, 0, 0.3);
--ring-focus: 0 0 0 2px rgba(253, 115, 50, 0.3);
```

### Gradient Tokens

```css
--gradient-primary: linear-gradient(180deg, #FD7332 0%, #B92011 100%);
--gradient-chatter: linear-gradient(180deg, #3B82F6 0%, #2563EB 100%);
--gradient-input: linear-gradient(180deg, #0C1F3F 0%, #2E4161 100%);
--gradient-page: linear-gradient(180deg, #0C1F3F 0%, #2E4161 100%);
--gradient-tab-inactive: linear-gradient(180deg, #213454 0%, #0C1F3F 100%);
--gradient-tab-hover: linear-gradient(180deg, #1a2f52 0%, #3A4F6E 100%);
--gradient-button-hover: linear-gradient(180deg, #2a3f62 0%, #1f2f4a 100%);
--gradient-header-expanded: linear-gradient(180deg, #2563EB 0%, #0C1F3F 100%);
```

**Usage:**
```css
/* Primary buttons */
.buttonPrimary {
  background: var(--gradient-primary);
}

/* Expanded equipment rows */
.expanded {
  background: var(--gradient-tab-inactive);
}

/* Input fields */
.input {
  background: var(--gradient-input);
}
```

### Transition Tokens

```css
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;

--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

--transition-base: all var(--duration-base) ease;
--transition-colors: background-color var(--duration-base), border-color var(--duration-base), color var(--duration-base);
```

### Z-Index Scale

```css
--z-base: 1;
--z-dropdown: 10;
--z-tooltip: 50;
--z-sticky: 100;
--z-modal: 1000;
--z-toast: 9999;
```

### Opacity Tokens

```css
--opacity-disabled: 0.5;
--opacity-hover: 0.8;
--opacity-muted: 0.6;
```

### Component Tokens

```css
--touch-target-min: 44px;         /* Minimum touch target size */
--scrollbar-width: 8px;
--scrollbar-thumb: #FD7332;
--scrollbar-track: rgba(0, 0, 0, 0.2);
```

---

## 🧩 Component Library

All components are in: **`src/components/ui/`**

### Primary Components (Equipment Forms)

#### EquipmentRow ⭐ PRIMARY CONTAINER
**Purpose:** Main equipment container with collapsible header and gradient background
**File:** `src/components/ui/EquipmentRow.js`

**Pattern:**
```jsx
import EquipmentRow from '../ui/EquipmentRow';

<EquipmentRow
  title="Inverter"
  subtitle="Tesla Powerwall 3 11.5kW"
  showNewExistingToggle={true}
  isNew={formData.inverter_isnew !== false}
  onNewExistingChange={(isNew) => onChange('inverter_isnew', isNew)}
  onEdit={handleEdit}
  onCamera={handleCamera}
  onDelete={handleDelete}
  headerRightContent={<PreferredButton />}
>
  {/* TableDropdown and FormFieldRow components here */}
</EquipmentRow>
```

**Features:**
- **Collapsed state:** Chevron + Title + Subtitle (clean, minimal)
- **Expanded state:** Gradient background + New/Existing toggle + Form fields + Action buttons
- Action buttons: Edit (pencil), Camera, Delete (trash)
- Optional `headerRightContent` for additional buttons

**Visual:**
- Collapsed: `bg-surface`, `border-subtle`
- Expanded: `gradient-tab-inactive`, `border-primary`, `shadow-md`

---

#### TableDropdown ⭐ INLINE DROPDOWN
**Purpose:** Searchable dropdown for equipment rows (30/70 label-to-field ratio)
**File:** `src/components/ui/TableDropdown.js`

**Pattern:**
```jsx
import TableDropdown from '../ui/TableDropdown';

<TableDropdown
  label="Make"
  value={formData.inverter_make || ''}
  onChange={(value) => handleChange('inverter_make', value)}
  options={[
    { value: 'tesla', label: 'Tesla' },
    { value: 'enphase', label: 'Enphase' }
  ]}
  placeholder="Select make"
  disabled={loading}
/>
```

**Layout:**
- 30% label (left, muted text)
- 70% dropdown field (right, transparent background)
- Searchable dropdown menu on click
- Orange chevron icon

---

#### FormFieldRow ⭐ FIELD WRAPPER
**Purpose:** Label + content wrapper for custom inputs/buttons (30/70 ratio)
**File:** `src/components/ui/FormFieldRow.js`

**Pattern:**
```jsx
import FormFieldRow from '../ui/FormFieldRow';
import TableRowButton from '../ui/TableRowButton';

<FormFieldRow label="Stringing">
  <TableRowButton
    label="Auto"
    active={type === 'auto'}
    onClick={() => setType('auto')}
  />
  <TableRowButton
    label="Custom"
    active={type === 'custom'}
    onClick={() => setType('custom')}
  />
</FormFieldRow>

<FormFieldRow label="Quantity">
  <input type="number" value={qty} onChange={handleChange} />
</FormFieldRow>
```

**Features:**
- 30% label / 70% content
- Transparent text inputs (styled automatically)
- `noBorder` prop to remove bottom border

---

#### TableRowButton ⭐ TOGGLE BUTTON
**Purpose:** Pill-shaped toggle buttons for equipment options
**File:** `src/components/ui/TableRowButton.js`

**Pattern:**
```jsx
import TableRowButton from '../ui/TableRowButton';

<TableRowButton
  label="MPU"
  variant="outline"
  active={isMPU}
  onClick={handleClick}
/>
```

**Variants:**
- `outline` (default) - Border style
- `filled` - Solid background

**States:**
- Active: Orange gradient background, white text
- Inactive: Transparent, muted text

---

### Action Components

#### Button - Primary UI Button
**File:** `src/components/ui/Button.js`

**Variants:**
- `primary` - Orange gradient with glow
- `secondary` - Gray/subtle
- `outline` - Border only
- `ghost` - No background

**Sizes:**
- `sm` - Small
- `md` - Medium (default)
- `lg` - Large

**Pattern:**
```jsx
import Button from '../ui/Button';

<Button variant="primary" size="md" onClick={handleSave}>
  Save Changes
</Button>

<Button variant="outline" size="sm" onClick={handleCancel}>
  Cancel
</Button>
```

---

#### ActionButton - Icon-based Actions
**File:** `src/components/ui/ActionButton.js`

**Purpose:** Circular icon buttons for edit/camera/delete actions in EquipmentRow

**Pattern:**
```jsx
import ActionButton from '../ui/ActionButton';
import pencilIcon from '../../assets/images/icons/pencil_icon_white.png';

<ActionButton
  icon={pencilIcon}
  label="Edit"
  onClick={handleEdit}
/>

<ActionButton
  icon="trash"  // Special case for trash icon
  label="Delete"
  onClick={handleDelete}
/>
```

---

#### AddSectionButton - Add Section Action
**File:** `src/components/ui/AddSectionButton.js`

**Purpose:** Orange gradient line extending full width for adding sections

**Pattern:**
```jsx
import AddSectionButton from '../ui/AddSectionButton';

<AddSectionButton
  label="Battery Type 2"
  onClick={handleAddBattery}
  disabled={!isComplete}
/>
```

---

#### PreferredButton - Equipment Preference
**File:** `src/components/ui/PreferredButton.js`

**Purpose:** Star icon button for marking preferred equipment

**Pattern:**
```jsx
import PreferredButton from '../ui/PreferredButton';

<PreferredButton
  isPreferred={formData.is_preferred}
  onClick={handlePreferredToggle}
/>
```

---

### Form Components

#### FormInput - Standard Text Input
**File:** `src/components/ui/FormInput.js`

**Pattern:**
```jsx
import FormInput from '../ui/FormInput';

<FormInput
  label="Customer Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="Enter name"
  required
  autoCapitalize
/>
```

**Features:**
- Gradient input background
- Optional password toggle for `type="password"`
- Auto-capitalize option
- Required indicator

---

#### FormSelect - Standard Dropdown
**File:** `src/components/ui/FormSelect.js`

**Pattern:**
```jsx
import FormSelect from '../ui/FormSelect';

<FormSelect
  label="State"
  value={state}
  onChange={(e) => setState(e.target.value)}
  options={[
    { value: 'CA', label: 'California' },
    { value: 'TX', label: 'Texas' }
  ]}
  placeholder="Select state"
  required
/>
```

---

#### SearchableDropdown - Searchable Select
**File:** `src/components/ui/SearchableDropdown.js`

**Purpose:** Full-width searchable dropdown (not for equipment rows)

---

### Modal Components

#### Modal - Base Modal
**File:** `src/components/ui/Modal.js`

**Pattern:**
```jsx
import Modal from '../ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
>
  <p>Modal content here</p>
</Modal>
```

---

#### SectionClearModal - Clear Section Confirmation
**File:** `src/components/ui/SectionClearModal.js`

**Pattern:**
```jsx
import SectionClearModal from '../ui/SectionClearModal';

<SectionClearModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleClear}
  sectionName="Inverter"
/>
```

---

#### ConfirmActionModal - General Confirmation
**File:** `src/components/ui/ConfirmActionModal.js`

**Pattern:**
```jsx
import ConfirmActionModal from '../ui/ConfirmActionModal';

<ConfirmActionModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleAction}
  title="Delete Project?"
  message="This action cannot be undone."
  confirmLabel="Delete"
  cancelLabel="Cancel"
/>
```

---

#### PhotoModal - Image Viewing
**File:** `src/components/ui/PhotoModal.js`

---

#### SystemDeleteModal - Delete System Confirmation
**File:** `src/components/ui/SystemDeleteModal.js`

---

#### SectionRemoveModal - Remove Section Confirmation
**File:** `src/components/ui/SectionRemoveModal.js`

---

### Layout Components

#### FormSection - Collapsible Section
**File:** `src/components/ui/FormSection.js`

**Purpose:** Alternative to EquipmentRow for non-equipment sections

**Pattern:**
```jsx
import FormSection from '../ui/FormSection';

<FormSection
  title="Site Information"
  collapsible
  initiallyOpen={true}
  onClear={handleClear}
>
  {/* Content here */}
</FormSection>
```

---

#### Card - Content Card
**File:** `src/components/ui/Card.js`

---

#### CollapsibleSection - Simple Collapsible
**File:** `src/components/ui/CollapsibleSection.js`

---

### Status & Feedback Components

#### Alert - Info/Warning Messages
**File:** `src/components/ui/Alert.js`

**Pattern:**
```jsx
import Alert from '../ui/Alert';

<Alert variant="warning">
  This field is required for SolarAPP+ submission.
</Alert>

<Alert variant="info" collapsible>
  Additional information about this section.
</Alert>
```

**Variants:**
- `info` - Blue
- `warning` - Amber
- `error` - Red
- `success` - Green

---

#### Toast - Toast Notifications
**File:** `src/components/ui/Toast.js`

---

#### StatusBadge - Project Status Badge
**File:** `src/components/ui/StatusBadge.js`

---

#### Skeleton - Loading State
**File:** `src/components/ui/Skeleton.js`

---

#### LoadingSpinner - Loading Indicator
**File:** `src/components/ui/LoadingSpinner.js`

---

#### EmptyState - Empty State Message
**File:** `src/components/ui/EmptyState.js`

---

### Toggle Components

#### Toggle - Standard Toggle Switch
**File:** `src/components/ui/Toggle.js`

---

#### CompactToggle - Compact Toggle
**File:** `src/components/ui/CompactToggle.js`

---

#### CircleToggle - Circular Toggle
**File:** `src/components/ui/CircleToggle.js`

---

#### TripleToggle - Three-way Toggle
**File:** `src/components/ui/TripleToggle.js`

---

#### GridSizeToggle - Grid Size Selector
**File:** `src/components/ui/GridSizeToggle.js`

---

#### PillToggle - Pill-shaped Toggle
**File:** `src/components/ui/PillToggle.js`

---

### Other UI Components

#### Checkbox - Checkbox Input
**File:** `src/components/ui/Checkbox.js`

---

#### Radio - Radio Button
**File:** `src/components/ui/Radio.js`

---

#### Textarea - Multiline Text Input
**File:** `src/components/ui/Textarea.js`

---

#### Dropdown - Basic Dropdown
**File:** `src/components/ui/Dropdown.js`

---

#### Tabs - Tab Navigation
**File:** `src/components/ui/Tabs.js`

---

#### Tooltip - Contextual Help
**File:** `src/components/ui/Tooltip.js`

---

#### Divider - Visual Separator
**File:** `src/components/ui/Divider.js`

---

#### Breadcrumbs - Navigation Trail
**File:** `src/components/ui/Breadcrumbs.js`

---

#### Pagination - Page Navigation
**File:** `src/components/ui/Pagination.js`

---

#### Avatar - User Avatar
**File:** `src/components/ui/Avatar.js`

---

#### Progress - Progress Bar
**File:** `src/components/ui/Progress.js`

---

#### Popover - Popover Container
**File:** `src/components/ui/Popover.js`

---

#### Drawer - Side Drawer
**File:** `src/components/ui/Drawer.js`

---

#### Stack - Vertical Stack Layout
**File:** `src/components/ui/Stack.js`

---

#### Inline - Horizontal Inline Layout
**File:** `src/components/ui/Inline.js`

---

#### ButtonGroup - Button Group Container
**File:** `src/components/ui/ButtonGroup.js`

---

#### SectionHeader - Section Header Component
**File:** `src/components/ui/SectionHeader.js`

---

#### InfoField - Read-only Info Field
**File:** `src/components/ui/InfoField.js`

---

#### Note - Note/Comment Component
**File:** `src/components/ui/Note.js`

---

#### ProjectHeader - Portal Header
**File:** `src/components/ui/ProjectHeader.js`

---

#### PortalNavigationPill - Portal Navigation
**File:** `src/components/ui/PortalNavigationPill.js`

---

#### ErrorState - Error State Display
**File:** `src/components/ui/ErrorState.js`

---

#### KeyboardHint - Keyboard Shortcut Hint
**File:** `src/components/ui/KeyboardHint.js`

---

#### IconButton - Icon Button
**File:** `src/components/ui/IconButton.js`

---

#### PillButton - Pill-shaped Button
**File:** `src/components/ui/PillButton.js`

---

#### AddButton - Simple Add Button
**File:** `src/components/ui/AddButton.js`

---

#### ToggleButton - Toggle Button
**File:** `src/components/ui/ToggleButton.js`

---

#### LaunchButton - Launch Action Button
**File:** `src/components/ui/LaunchButton.js`

---

#### SendButton - Send Action Button
**File:** `src/components/ui/SendButton.js`

---

#### GradientInput - Gradient Input Field
**File:** `src/components/ui/GradientInput.js`

---

#### TableSelect - Simple Table Dropdown
**File:** `src/components/ui/TableSelect.js`

**Purpose:** Non-searchable dropdown for table rows (30/70 ratio)

---

#### SolarAPPStatusBadge - SolarAPP+ Status Badge
**File:** `src/components/ui/SolarAPPStatusBadge.js`

---

#### Accordion - Accordion Container
**File:** `src/components/ui/Accordion.js`

---

#### UpdateModal - Update Notification Modal
**File:** `src/components/ui/UpdateModal.js`

---

#### DeleteConfirmModal - Delete Confirmation Modal
**File:** `src/components/ui/DeleteConfirmModal.js`

---

#### ConfirmDialog - Confirmation Dialog
**File:** `src/components/ui/ConfirmDialog.js`

---

#### WarningModal - Warning Modal
**File:** `src/components/ui/WarningModal.js`

---

## 📐 Layout Patterns

### The 30/70 Ratio (Equipment Forms)

All form fields within `EquipmentRow` follow a **30% label / 70% content** ratio.

**Implementation:**
```css
/* TableDropdown.module.css, FormFieldRow.module.css, TableSelect.module.css */
.label {
  flex: 0 0 30%;  /* Fixed 30% */
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.content {
  flex: 1;  /* Remaining 70% */
}
```

**Visual Example:**
```
┌─────────────────────────────────────────┐
│ Make          │ Tesla Powerwall         │
│ (30%)         │ (70%)                   │
├─────────────────────────────────────────┤
│ Model         │ Powerwall 3 11.5kW      │
│ (30%)         │ (70%)                   │
└─────────────────────────────────────────┘
```

---

### Container Padding Standard

```css
/* Panel/section padding */
.panel {
  padding: var(--spacing);
}

/* Compact padding (tabs, tight areas) */
.compact {
  padding: var(--spacing-tight);
}

/* Input internal padding */
.input {
  padding: var(--spacing-tight) var(--spacing);
}
```

---

### Flex Layout Best Practices

```css
/* Vertical stacking with consistent gaps */
.verticalStack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing);
}

/* Horizontal alignment with gaps */
.horizontalRow {
  display: flex;
  align-items: center;
  gap: var(--spacing-tight);
}

/* Space-between pattern */
.spaceBetween {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

---

### Grid Layout Pattern

```css
/* Two-column grid */
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing);
}

/* Responsive grid */
.responsiveGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing);
}
```

---

## ⚙️ Equipment Form Patterns

### Standard Equipment Section Structure

```jsx
import EquipmentRow from '../ui/EquipmentRow';
import TableDropdown from '../ui/TableDropdown';
import FormFieldRow from '../ui/FormFieldRow';
import TableRowButton from '../ui/TableRowButton';

const InverterSection = ({ formData, onChange }) => (
  <EquipmentRow
    title="Inverter"
    subtitle={getSubtitle(formData)}
    showNewExistingToggle={true}
    isNew={formData.inverter_isnew !== false}
    onNewExistingChange={(isNew) => onChange('inverter_isnew', isNew)}
    onEdit={handleEdit}
    onCamera={handleCamera}
    onDelete={handleDelete}
  >
    {/* Dropdown fields */}
    <TableDropdown
      label="Make"
      value={formData.inverter_make || ''}
      onChange={(value) => onChange('inverter_make', value)}
      options={makeOptions}
      placeholder="Select make"
    />

    <TableDropdown
      label="Model"
      value={formData.inverter_model || ''}
      onChange={(value) => onChange('inverter_model', value)}
      options={modelOptions}
      placeholder="Select model"
    />

    {/* Custom input field */}
    <FormFieldRow label="Quantity">
      <input
        type="number"
        value={formData.inverter_quantity || ''}
        onChange={(e) => onChange('inverter_quantity', e.target.value)}
      />
    </FormFieldRow>

    {/* Toggle buttons */}
    <FormFieldRow label="Stringing">
      <TableRowButton
        label="Auto"
        active={formData.stringing_type === 'auto'}
        onClick={() => onChange('stringing_type', 'auto')}
      />
      <TableRowButton
        label="Custom"
        active={formData.stringing_type === 'custom'}
        onClick={() => onChange('stringing_type', 'custom')}
      />
    </FormFieldRow>
  </EquipmentRow>
);
```

---

### Multiple Equipment Instances Pattern

```jsx
const BatterySection = ({ batteries, onAddBattery, onRemoveBattery, onChange }) => (
  <>
    {batteries.map((battery, index) => (
      <EquipmentRow
        key={battery.id}
        title={`Battery Type ${index + 1}`}
        subtitle={getBatterySubtitle(battery)}
        onDelete={() => onRemoveBattery(battery.id)}
      >
        <TableDropdown
          label="Make"
          value={battery.make}
          onChange={(value) => onChange(battery.id, 'make', value)}
          options={batteryMakes}
        />
        {/* More fields... */}
      </EquipmentRow>
    ))}

    <AddSectionButton
      label={`Battery Type ${batteries.length + 1}`}
      onClick={onAddBattery}
      disabled={!lastBatteryComplete}
    />
  </>
);
```

---

### Form Navigation Footer Pattern

```jsx
import styles from './EquipmentForm.module.css';

<form className={styles.formContainer}>
  <div className={styles.scrollableContent}>
    {/* Equipment sections here */}
  </div>

  <div className={styles.navigationFooter}>
    <Button variant="secondary" onClick={handlePrevious}>
      Previous
    </Button>
    <Button variant="primary" onClick={handleNext}>
      Next
    </Button>
  </div>
</form>
```

```css
/* EquipmentForm.module.css */
.formContainer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.scrollableContent {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing);
}

.navigationFooter {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing);
  border-top: var(--border-thin) solid var(--border-subtle);
  background: var(--bg-surface);
}
```

---

## 📁 File Structure

### Required Structure

Every component MUST have:
```
ComponentName.js
ComponentName.module.css
```

### Example Directory Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.js
│   │   ├── Button.module.css
│   │   ├── EquipmentRow.js
│   │   ├── EquipmentRow.module.css
│   │   ├── TableDropdown.js
│   │   ├── TableDropdown.module.css
│   │   └── ...
│   ├── project/
│   │   ├── EquipmentForm.js
│   │   ├── EquipmentForm.module.css
│   │   ├── equipment/
│   │   │   ├── InverterMicroSection.js
│   │   │   ├── InverterMicroSection.module.css
│   │   │   ├── BatteryTypeSection.js
│   │   │   └── BatteryTypeSection.module.css
│   │   └── ...
│   └── ...
├── styles/
│   ├── tokens.css          # All design tokens
│   ├── utilities.css       # Utility classes
│   └── DesignConstitution.md  # This file
└── ...
```

---

## ✅ Pre-Commit Checklist

Before committing ANY code, verify:

- [ ] **No inline styles** for static properties (colors, fonts, fixed spacing)
- [ ] **No hardcoded colors** (`#FD7332` → `var(--color-primary)`)
- [ ] **No hardcoded pixels** (`16px` → `var(--spacing)`)
- [ ] **CSS Module exists** and is imported
- [ ] **All styles use tokens** (`var(--token)` format)
- [ ] **Existing components used** where applicable
- [ ] **Spacing direction correct** (`margin-bottom`, `margin-right`, `gap`)
- [ ] **Import pattern correct** (direct imports from component files)
- [ ] **30/70 ratio** maintained for equipment form fields
- [ ] **Component file structure** correct (`.js` + `.module.css`)

---

## 🔄 Migration Guide

### Migrating Legacy Components to Design System

#### Step 1: Identify Violations
```jsx
// ❌ OLD - Inline styles and hardcoded values
<div style={{ marginBottom: '16px', color: '#FD7332' }}>
  <span style={{ fontSize: '14px' }}>Label</span>
</div>
```

#### Step 2: Create CSS Module
```css
/* Component.module.css */
.container {
  margin-bottom: var(--spacing);
  color: var(--color-primary);
}

.label {
  font-size: var(--text-sm);
}
```

#### Step 3: Update Component
```jsx
// ✅ NEW - CSS Modules + Tokens
import styles from './Component.module.css';

<div className={styles.container}>
  <span className={styles.label}>Label</span>
</div>
```

---

### Converting to EquipmentRow Pattern

#### Before (Legacy FormSection)
```jsx
<FormSection title="Inverter">
  <div style={{ display: 'flex', marginBottom: '8px' }}>
    <label style={{ width: '30%' }}>Make</label>
    <select style={{ width: '70%' }} value={make} onChange={handleMakeChange}>
      {/* options */}
    </select>
  </div>
</FormSection>
```

#### After (EquipmentRow + TableDropdown)
```jsx
<EquipmentRow
  title="Inverter"
  subtitle={getSubtitle()}
  onDelete={handleDelete}
>
  <TableDropdown
    label="Make"
    value={make}
    onChange={handleMakeChange}
    options={makeOptions}
  />
</EquipmentRow>
```

---

## 🚨 Common Mistakes to Avoid

### 1. Using margin-top or margin-left
```css
/* ❌ WRONG */
.item {
  margin-top: 16px;
  margin-left: 16px;
}

/* ✅ CORRECT */
.container {
  display: flex;
  gap: var(--spacing);
}

.item {
  margin-bottom: var(--spacing);
  margin-right: var(--spacing);
}
```

### 2. Hardcoding colors
```css
/* ❌ WRONG */
.button {
  background: #FD7332;
  color: #FFFFFF;
}

/* ✅ CORRECT */
.button {
  background: var(--color-primary);
  color: var(--text-primary);
}
```

### 3. Inline styles for static properties
```jsx
/* ❌ WRONG */
<div style={{ padding: '16px', color: '#9CA3AF' }}>

/* ✅ CORRECT */
<div className={styles.container}>

/* styles.container has padding: var(--spacing); color: var(--text-muted); */
```

### 4. Not using existing components
```jsx
/* ❌ WRONG - Creating custom dropdown */
<div>
  <label>Make</label>
  <select>...</select>
</div>

/* ✅ CORRECT - Using TableDropdown */
<TableDropdown label="Make" ... />
```

### 5. Inconsistent spacing
```css
/* ❌ WRONG - Random values */
gap: 12px;
margin-bottom: 20px;

/* ✅ CORRECT - Token values */
gap: var(--spacing-sm);
margin-bottom: var(--spacing-md);
```

---

## 📚 Additional Resources

| Resource | Location |
|----------|----------|
| **Design Tokens** | `src/styles/tokens.css` |
| **Token JS Exports** | `src/styles/tokens.js` |
| **Utility Classes** | `src/styles/utilities.css` |
| **UI Components** | `src/components/ui/` |
| **Equipment Examples** | `src/components/project/equipment/` |
| **CLAUDE.md** | Root directory (quick reference) |

---

## 🔥 The Golden Rules

### Rule 1: Token First
**If you type a raw number or hex color, STOP and find the token.**

### Rule 2: Component First
**If you're building UI, check if it exists in `src/components/ui/` first.**

### Rule 3: CSS Modules Always
**No inline styles for static properties. Ever.**

### Rule 4: 30/70 Ratio
**All equipment form fields use 30% label / 70% content.**

### Rule 5: Spacing Direction
**Vertical: `margin-bottom`. Horizontal: `margin-right`. Flex/Grid: `gap`.**

---

## 🎯 Quick Reference Card

```
SPACING
-------
--spacing-xxs  → 6px   (portal pills)
--spacing-xs   → 4px   (micro)
--spacing-tight→ 8px   (compact)
--spacing-sm   → 12px  (small)
--spacing      → 16px  (DEFAULT)
--spacing-md   → 20px  (medium)
--spacing-loose→ 24px  (section breaks)
--spacing-wide → 32px  (major sections)

COLORS
------
--color-primary         → #FD7332 (orange)
--bg-surface           → #111C2E (cards)
--text-primary         → #F9FAFB (white)
--text-muted           → #9CA3AF (labels)
--border-subtle        → rgba(255,255,255,0.1)

TYPOGRAPHY
----------
--text-xs      → 12px (labels)
--text-sm      → 14px (UI - MOST COMMON)
--text-base    → 16px (body)
--font-semibold→ 600  (titles)

COMPONENTS
----------
EquipmentRow      → Main equipment container
TableDropdown     → Inline dropdown (30/70)
FormFieldRow      → Field wrapper (30/70)
TableRowButton    → Pill toggle buttons
Button            → Primary action buttons
AddSectionButton  → Add section action

LAYOUT
------
30/70 ratio for equipment form fields
margin-bottom/margin-right only
gap for flex/grid spacing
```

---

**Last Updated:** January 2026
**Verified Against:** Design Portal (DesignPortal.js, EquipmentForm.js, equipment sections)
**Maintained By:** Skyfire Development Team

---

> 💡 **Remember:** This document is the single source of truth. When in doubt, reference this guide, check `tokens.css`, or look at compliant components in `src/components/ui/`.
