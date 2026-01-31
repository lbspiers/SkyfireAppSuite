# SKYFIRE SPACING NUCLEAR CONVERSION - PHASE 4 (FINAL) PROMPT

## CONTEXT

Phases 1-3 are complete. We've standardized all major layout and medium-priority files.

[PASTE PHASE 3 SUMMARY HERE]

## THE DOCTRINE (Same as before)

- **Top padding:** `0`
- **Left padding:** `0`  
- **Right padding:** `var(--spacing)` or appropriate token
- **Bottom padding:** `var(--spacing)` or appropriate token

## PHASE 4 TASK

Convert ALL remaining CSS module files. These are smaller component files.

### Files to Process:

**SKIP ENTIRELY (Exception files - internal component styling):**
- Button_module.css
- Tabs_module.css
- Toggle_module.css
- Radio_module.css
- Checkbox_module.css
- FormInput_module.css
- FormSelect_module.css
- Textarea_module.css

**PROCESS these files:**
1. Alert_module.css
2. Avatar_module.css
3. Breadcrumbs_module.css
4. Card_module.css
5. Divider_module.css
6. Drawer_module.css
7. Dropdown_module.css
8. EmptyState_module.css
9. FormSection_module.css
10. InfoField_module.css
11. Inline_module.css
12. LoadingSpinner_module.css
13. Modal_module.css
14. Note_module.css
15. Pagination_module.css
16. Popover_module.css
17. Progress_module.css
18. SearchableDropdown_module.css
19. Skeleton_module.css
20. Stack_module.css
21. StatusBadge_module.css
22. Toast_module.css
23. Tooltip_module.css

### For Each File:

1. Find all `padding`, `margin`, `gap` declarations
2. Convert hardcoded values to tokens
3. Apply doctrine (top/left = 0, right/bottom = token)
4. Be mindful of component internals that may be intentional

## FINAL VERIFICATION

After processing all files, run these checks:

```bash
# Find any remaining hardcoded px values
grep -rn "padding:.*[0-9]px" src/styles/*.css | grep -v "var(--"

# Find any remaining hardcoded rem values  
grep -rn "padding:.*[0-9]rem" src/styles/*.css | grep -v "var(--"

# Find any remaining hardcoded gap values
grep -rn "gap:.*[0-9]" src/styles/*.css | grep -v "var(--"
```

Report any remaining hardcoded values that couldn't be converted (with reason).

## WHAT TO DELIVER

```
## PHASE 4 (FINAL) COMPLETION SUMMARY

### Files Modified:
[List each file with change count]

### Files Skipped (Exceptions):
- Button_module.css (button internals)
- Tabs_module.css (tab internals)
- [etc]

### Final Verification Results:
- Remaining hardcoded px: X (list reasons)
- Remaining hardcoded rem: X (list reasons)
- Total token conversions: X

### NUCLEAR CONVERSION COMPLETE

Total files processed across all phases: X
Total padding/margin/gap declarations converted: X
Doctrine (top/left=0) applied to: X container classes

### Recommended Visual Review:
[List any components that should be visually tested]
```

## BEGIN

Process each file systematically. This is the final phase!
