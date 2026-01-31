## TASK: Create Fordje Tab in Permitting Portal (QUICK - 30 min)

### Context
Meeting with Fordje today - need a placeholder tab to show how their AHJ/Utility data could display. This is a DEMO/TALKING POINT only - no API integration, just display the temp data.

### Files to Reference
1. Read `/mnt/project/DesignConstitution.md` for design patterns
2. Read existing permitting tabs for structure reference
3. Use the new constants file: `src/constants/fordjeTempData.js` (copy from outputs)

### What to Build

**1. Copy the constants file first:**
```bash
cp /mnt/user-data/outputs/fordjeTempData.js src/constants/fordjeTempData.js
```

**2. Create `FordjePanel.js`** in `src/components/Permitting/` (or wherever permitting components live)

Structure:
- Two sub-tabs at top: "AHJ" and "Utility" (use CompactTabs component if available)
- Each sub-tab displays the items from `FORDJE_DEMO_DATA`
- Group items by category (Code Cycle, Contact, Design, Engineering, etc.)
- Use CollapsibleSection for each category group
- Simple InfoField or similar for each item (name: value pairs)
- Values with `\n` should display as multi-line (use `whiteSpace: 'pre-line'`)

**3. Add to Permitting Portal tabs:**
- Add "Fordje" tab FIRST in the tab list (before SolarAPP+)
- Route to FordjePanel component

### Design Requirements
- Follow DesignConstitution.md strictly
- Use design tokens from tokens.css only
- CSS Modules only, no inline styles
- Reuse existing components (CollapsibleSection, CompactTabs, InfoField, Card, etc.)
- Keep it clean and simple - this is a demo

### Visual Structure
```
[Fordje] [SolarAPP+] [Other tabs...]
         |
         v
    ┌─────────────────────────────┐
    │  [AHJ]  [Utility]           │  <- sub-tabs
    ├─────────────────────────────┤
    │  ▼ Code Cycle               │  <- CollapsibleSection
    │    Building Code: 2021 IBC  │
    │    Electrical: 2023 NEC     │
    │  ▼ Contact                  │
    │    Building Dept: ...       │
    │  ▼ Engineering              │
    │    Wind Speed: 110 MPH      │
    └─────────────────────────────┘
```

### Time Constraint
This needs to be done in ~25 minutes. Keep it simple:
- No API calls
- No state management beyond local tab state
- Just render the static data nicely
- Don't over-engineer

GO!
