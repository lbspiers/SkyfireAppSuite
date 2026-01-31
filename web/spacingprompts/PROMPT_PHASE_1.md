# SKYFIRE SPACING NUCLEAR CONVERSION - PHASE 1 PROMPT

## CONTEXT

We are standardizing ALL spacing across the Skyfire React web application. Every padding, margin, and gap needs to use design tokens from `tokens.css`.

## THE DOCTRINE

**For ALL components, containers, wrappers, and elements:**
- **Top padding:** `0`
- **Left padding:** `0`
- **Right padding:** `var(--spacing)` or appropriate token
- **Bottom padding:** `var(--spacing)` or appropriate token

**The ONLY exceptions (DO NOT MODIFY internal padding for these):**
- Tab buttons (`.tab`, `.tabActive`, `.statusTab`) - internal padding only
- Buttons (any class with `Button`, `Btn` in name) - internal padding only
- Form inputs (`.input`, `.select`, `.textarea`, classes in FormInput, FormSelect, Textarea modules) - internal padding only
- Toggle/Radio/Checkbox components - internal padding only

**Note:** Container/wrapper classes for these components DO get the doctrine applied. Only the actual interactive element internals are exempt.

## SPACING TOKEN REFERENCE

```css
--spacing-xs: 0.25rem;        /* 4px */
--spacing-tight: 0.5rem;      /* 8px */
--spacing: 1rem;              /* 16px - DEFAULT */
--spacing-loose: 1.5rem;      /* 24px */
--spacing-wide: 2rem;         /* 32px */
--spacing-2xl: 3rem;          /* 48px */
```

## CONVERSION RULES

| Hardcoded Value | Convert To |
|-----------------|------------|
| `4px`, `0.25rem` | `var(--spacing-xs)` |
| `6px`, `8px`, `0.5rem` | `var(--spacing-tight)` |
| `10px`, `12px`, `14px`, `0.75rem` | `var(--spacing-tight)` |
| `16px`, `1rem` | `var(--spacing)` |
| `20px`, `1.25rem` | `var(--spacing)` |
| `24px`, `1.5rem` | `var(--spacing-loose)` |
| `32px`, `2rem` | `var(--spacing-wide)` |
| `48px`, `3rem` | `var(--spacing-2xl)` |

## PHASE 1 TASK

Convert the following HIGH-PRIORITY CSS files. For each file:

1. Find all `padding`, `margin`, and `gap` declarations
2. Convert hardcoded values (`px`, `rem`) to appropriate tokens
3. Apply the doctrine: top/left = 0, right/bottom = token
4. Skip button/input/tab INTERNAL padding (but convert their containers)

### Files to Process in Phase 1:

1. **`src/styles/Dashboard_module.css`** (~1900 lines)
   - Key classes: `.dashboardContainer`, `.dashboardHeader`, `.safeContentContainer`, `.statusContentPanel`, `.statusTabsWrapper`
   
2. **`src/styles/TabbedPanel_module.css`** (~255 lines)
   - Key classes: `.tabContentWrapper`, `.headerContent`, `.contentPanel`
   - SKIP: `.tab`, `.tabActive` internal padding
   
3. **`src/styles/Portal_module.css`** (~183 lines)
   - Key classes: `.menuContent`, `.chatterContainer`, `.comingSoonContainer`, `.gridLayout`

4. **`src/styles/ProjectAdd_module.css`** (~862 lines)
   - Key classes: `.projectContainer`, `.header`, `.leftPanel`, `.rightPanel`, `.tabContent`
   - SKIP: `.input`, `.select`, `.textarea` internal padding

### Example Transformations:

```css
/* BEFORE */
.dashboardContainer {
  padding: 0 2rem;
}

/* AFTER */
.dashboardContainer {
  padding: 0 var(--spacing-wide) var(--spacing-wide) 0;
}

/* BEFORE */
.safeContentContainer {
  padding: var(--spacing-loose) 2rem;
}

/* AFTER */
.safeContentContainer {
  padding: 0 var(--spacing-wide) var(--spacing-loose) 0;
}

/* BEFORE */
.chatterContainer {
  padding: 1.5rem;
}

/* AFTER */
.chatterContainer {
  padding: 0 var(--spacing-loose) var(--spacing-loose) 0;
}

/* BEFORE - Mixed hardcoded */
.navLink {
  padding: var(--spacing-tight) 1rem;
}

/* AFTER - Button internal, but if it's a link/nav item apply doctrine */
.navLink {
  padding: 0 var(--spacing) var(--spacing-tight) 0;
}
```

## WHAT TO DELIVER

After completing Phase 1, provide a summary in this format:

```
## PHASE 1 COMPLETION SUMMARY

### Files Modified:
1. Dashboard_module.css
   - X padding declarations updated
   - Key changes: [list major class changes]
   
2. TabbedPanel_module.css
   - X padding declarations updated
   - Key changes: [list major class changes]

3. Portal_module.css
   - X padding declarations updated
   - Key changes: [list major class changes]

4. ProjectAdd_module.css
   - X padding declarations updated
   - Key changes: [list major class changes]

### Patterns Applied:
- Converted X instances of hardcoded `2rem` to `var(--spacing-wide)`
- Converted X instances of hardcoded `1.5rem` to `var(--spacing-loose)`
- Applied top/left=0 doctrine to X container classes
- Skipped X button/input internal padding declarations

### Classes That May Need Visual Review:
- [list any classes where the change might have significant visual impact]

### Ready for Phase 2:
- Chatter_module.css
- EquipmentForm_module.css
- FormSections_module.css
```

## BEGIN

Start with `Dashboard_module.css` as it's the largest and most critical file. Work through each file systematically.
