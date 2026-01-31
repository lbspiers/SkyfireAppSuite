# SKYFIRE SPACING NUCLEAR CONVERSION - PHASE 2 PROMPT

## CONTEXT

Phase 1 is complete. We standardized spacing in Dashboard, TabbedPanel, Portal, and ProjectAdd modules.

[PASTE PHASE 1 SUMMARY HERE]

## THE DOCTRINE (Same as Phase 1)

- **Top padding:** `0`
- **Left padding:** `0`
- **Right padding:** `var(--spacing)` or appropriate token
- **Bottom padding:** `var(--spacing)` or appropriate token

**Exceptions (internal padding only):** Tab buttons, Buttons, Form inputs, Toggle/Radio/Checkbox

## SPACING TOKEN REFERENCE

```css
--spacing-xs: 0.25rem;        /* 4px */
--spacing-tight: 0.5rem;      /* 8px */
--spacing: 1rem;              /* 16px - DEFAULT */
--spacing-loose: 1.5rem;      /* 24px */
--spacing-wide: 2rem;         /* 32px */
--spacing-2xl: 3rem;          /* 48px */
```

## PHASE 2 TASK

Convert the following CSS files:

1. **`src/styles/Chatter_module.css`** (~1307 lines)
   - Key classes: `.chatterDrawer`, `.chatterHeader`, `.messageList`, `.messageCard`, `.chatterInputContainer`, `.threadList`, `.replyItem`, `.newThreadContainer`
   - Has many `padding: var(--spacing-tight) 0.75rem` patterns
   - Has `padding: 10px 14px` and `gap: 10px` patterns
   - SKIP: `.chatterSendBtn`, `.chatterToolBtn` internal padding

2. **`src/styles/EquipmentForm_module.css`** (~285 lines)
   - Key classes: `.section`, `.stickyHeader`, `.scrollableContent`, `.systemSelector`
   - Has `padding: 0 2rem` that needs doctrine
   - SKIP: `.systemButton`, `.stringingButton` internal padding

3. **`src/styles/FormSections_module.css`** (~379 lines)
   - Key classes: `.sectionContainer`, `.fieldGroup`, `.listItem`, `.infoBox`, `.calculationResult`
   - Mostly layout classes - apply doctrine
   - SKIP: `.addButton`, `.removeButton`, `.toggleButton` internal padding

4. **`src/styles/SubmitForm_module.css`** (~large)
   - Similar patterns to other form modules
   - Apply doctrine to all containers

### Common Patterns to Fix in These Files:

```css
/* Pattern 1: Hardcoded px */
padding: 10px 14px;  →  padding: 0 var(--spacing-tight) var(--spacing-tight) 0;

/* Pattern 2: Mixed token + hardcoded */
padding: var(--spacing-tight) 0.75rem;  →  padding: 0 var(--spacing-tight) var(--spacing-tight) 0;

/* Pattern 3: Hardcoded rem */
padding: var(--spacing-tight) 1rem;  →  padding: 0 var(--spacing) var(--spacing-tight) 0;

/* Pattern 4: Single value (all sides) */
padding: var(--spacing);  →  padding: 0 var(--spacing) var(--spacing) 0;

/* Pattern 5: Gap values */
gap: 10px;  →  gap: var(--spacing-tight);
gap: 0.75rem;  →  gap: var(--spacing-tight);
```

## WHAT TO DELIVER

```
## PHASE 2 COMPLETION SUMMARY

### Files Modified:
1. Chatter_module.css
   - X padding declarations updated
   - Key changes: [list]
   
2. EquipmentForm_module.css
   - X padding declarations updated
   - Key changes: [list]

3. FormSections_module.css
   - X padding declarations updated
   - Key changes: [list]

4. SubmitForm_module.css
   - X padding declarations updated
   - Key changes: [list]

### Patterns Applied:
- [summary of conversions]

### Classes That May Need Visual Review:
- [list]

### Ready for Phase 3:
- QCChecklistPanel_module.css
- Login_module.css
- All small component modules
```

## BEGIN

Start with `Chatter_module.css` - it has the most hardcoded values.
