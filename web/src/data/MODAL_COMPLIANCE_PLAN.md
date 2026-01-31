# Modal Compliance Implementation Plan

## Executive Summary

**26 Total Modals Audited**
- ✅ **9 Fully Compliant** (35%)
- ⚠️ **17 Require Fixes** (65%)

**Total Estimated Hours:** ~35 hours

---

## Compliance Standard

All modals must:
1. Use base `Modal` component from `/components/ui/Modal`
2. Use `Button` component for all buttons
3. Use `FormInput`, `FormSelect`, `Textarea` for form elements
4. Use CSS modules (no inline styles except dynamic values)
5. Use Modal's `footer` prop for action buttons
6. Leverage Modal's built-in escape/overlay handling

### Reference Implementation: ConfirmActionModal
```jsx
import Modal from './Modal';
import Button from './Button';
import styles from './ConfirmDialog.module.css';

const ConfirmActionModal = ({ isOpen, onClose, onConfirm, title, message }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={onConfirm}>Confirm</Button>
      </>
    }
  >
    <div className={styles.content}>
      <p className={styles.message}>{message}</p>
    </div>
  </Modal>
);
```

---

## Priority Tiers

### Tier 1: High Priority - Full Refactors (15-17 hours)
| Modal | Violations | Est. Hours |
|-------|-----------|------------|
| SubmitModal | No Modal, no Button | 2h |
| ReleaseModal | No Modal, no UI components | 2h |
| AddToQueueModal | No Modal, no UI components | 2h |
| AddUserModal | No Modal, custom inputs | 3h |
| EventModal | No Modal, inline styles, no UI | 4h |

### Tier 2: Medium Priority - Specialized Refactors (9.5 hours)
| Modal | Violations | Est. Hours |
|-------|-----------|------------|
| PhotoModal | No Modal, custom buttons | 2.5h |
| UpdateModal | No Modal, custom buttons | 1.5h |
| GenerateStatusModal | No Modal, custom button | 1.5h |
| AttestationModal | No Modal, custom buttons | 1.5h |
| PdfFullScreenModal | No Modal, custom buttons | 2h |

### Tier 3: Low Priority - Minor Fixes (5.75 hours)
| Modal | Violations | Est. Hours |
|-------|-----------|------------|
| DeleteConfirmModal | Custom buttons/input | 1h |
| BOSEquipmentModal | Custom buttons | 0.75h |
| TaskModal | Custom inputs | 1h |
| WarningModal | Footer not in prop | 0.25h |
| ChangePasswordModal | Footer not in prop | 0.5h |
| InviteCustomerModal | Footer not in prop | 0.5h |
| PreferredEquipmentModal | Custom buttons | 1h |
| BOSDetectionModal | Wrong CSS import | 0.75h |
| UtilityValidationModal | Custom link buttons | 0.5h |
| OTPModal | Inline styles | 0.5h |
| PayoutRequestModal | Custom max button | 0.25h |

### Tier 4: Templates & Infrastructure (6.5 hours)
| Task | Purpose | Est. Hours |
|------|---------|------------|
| StatusModal Template | Reusable sending/success/error | 2h |
| WizardModal Template | Multi-step modal pattern | 2.5h |
| FormModal Template | Form submission pattern | 2h |

---

## Fully Compliant Modals (No Changes Needed)

1. **ConfirmActionModal** ✅
2. **SectionClearModal** ✅
3. **CSVUploadModal** ✅
4. **WarningModal** ✅ (minor footer fix)
5. **ChangePasswordModal** ✅ (minor footer fix)
6. **InviteCustomerModal** ✅ (minor footer fix)
7. **UtilityValidationModal** ✅ (minor link button fix)
8. **PayoutRequestModal** ✅ (minor button fix)
9. **BOSDetectionModal** ✅ (minor CSS fix)

---

## Implementation Order Recommendation

### Phase 1: Drafter Portal (Week 1)
1. SubmitModal
2. ReleaseModal
3. AddToQueueModal

**Why:** High business value, drafter workflow critical path

### Phase 2: Status/Feedback Modals (Week 1-2)
4. Create StatusModal template
5. UpdateModal (refactor using template)
6. GenerateStatusModal (refactor using template)

**Why:** Creates reusable pattern, reduces duplicate code

### Phase 3: Form Modals (Week 2)
7. Create FormModal template
8. TaskModal
9. DeleteConfirmModal
10. AttestationModal

### Phase 4: Complex Modals (Week 2-3)
11. Create WizardModal template
12. AddUserModal (refactor using template)
13. EventModal (comprehensive refactor)

### Phase 5: Specialized Viewers (Week 3)
14. PhotoModal
15. PdfFullScreenModal

### Phase 6: Minor Fixes (Week 3-4)
16-26. All remaining minor fixes

### Phase 7: Verification (Week 4)
- Run comprehensive audit
- Document any approved exceptions
- Create MODAL_COMPLIANCE_REPORT.md

---

## Testing Checklist Per Modal

- [ ] Modal opens correctly with `isOpen={true}`
- [ ] Modal closes on overlay click (if `closeOnOverlay={true}`)
- [ ] Modal closes on Escape key (if `closeOnEscape={true}`)
- [ ] Modal closes via X button (if `showCloseButton={true}`)
- [ ] All buttons use Button component
- [ ] All form elements use appropriate UI components
- [ ] No inline styles (except dynamic values)
- [ ] Footer buttons properly spaced
- [ ] Loading states work correctly
- [ ] Error states display properly
- [ ] Accessibility: aria labels present
- [ ] Mobile responsive

---

## Files Reference

### Base Components
- `/src/components/ui/Modal.js`
- `/src/components/ui/Modal.module.css`
- `/src/components/ui/Button.js`
- `/src/components/ui/FormInput.js`
- `/src/components/ui/FormSelect.js`
- `/src/components/ui/Textarea.js`

### Compliant Examples
- `/src/components/ui/ConfirmActionModal.js`
- `/src/components/common/SectionClearModal.js`
- `/src/components/dev/CSVUploadModal.js`
