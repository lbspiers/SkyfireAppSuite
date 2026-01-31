# TASK: Modal Compliance - SubmitModal Full Refactor

## Objective
Refactor SubmitModal to use base Modal component and UI components for 100% design system compliance.

## Reference Implementation (ConfirmActionModal - COPY THIS PATTERN)
```jsx
import React from 'react';
import Modal from './Modal';
import Button from './Button';
import styles from './ConfirmDialog.module.css';

const ConfirmActionModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  scopedToPanel = true,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      scopedToPanel={scopedToPanel}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
      </div>
    </Modal>
  );
};
```

## Current File Location
`/src/components/drafter/SubmitModal.js`
`/src/components/drafter/SubmitModal.module.css`

## Current Violations
1. Does NOT use base Modal component - has custom overlay div
2. Does NOT use Button component - has custom button elements
3. Has custom modal structure instead of Modal's header/body/footer

## Required Changes

### 1. Update Imports
```jsx
// REMOVE any custom overlay/modal styling reliance
// ADD these imports:
import Modal from '../ui/Modal';
import Button from '../ui/Button';
```

### 2. Replace Custom Overlay with Modal Component
```jsx
// BEFORE (wrong):
return (
  <div className={styles.overlay}>
    <div className={styles.modal}>
      ...
    </div>
  </div>
);

// AFTER (correct):
return (
  <Modal
    isOpen={isOpen}
    onClose={handleClose}
    title="Submit Project"
    size="md"
    footer={
      <>
        <Button variant="secondary" onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={submitting || !allRequiredPresent}
          loading={submitting}
        >
          Submit Project
        </Button>
      </>
    }
  >
    {/* Body content here */}
  </Modal>
);
```

### 3. Handle Success State
The current modal has a success animation state. Options:
- Option A: Keep inline success state but wrap in Modal
- Option B: Close modal and show toast on success (preferred for consistency)

Implement Option B:
```jsx
const handleSubmit = async () => {
  if (!allRequiredPresent) {
    toast.warning('Please upload all required files before submitting');
    return;
  }

  try {
    setSubmitting(true);
    await onSubmit();
    toast.success('Project submitted successfully!');
    onClose();
  } catch (error) {
    console.error('Failed to submit project:', error);
    toast.error('Failed to submit project. Please try again.');
  } finally {
    setSubmitting(false);
  }
};
```

### 4. Update CSS Module
Remove from SubmitModal.module.css:
- `.overlay` - Modal handles this
- `.modal` - Modal handles this
- `.title` - Modal handles this
- `.actions` - Modal footer handles this
- `.cancelButton` - Button component handles this
- `.submitButton` - Button component handles this

Keep/update:
- `.content` - body content styling
- `.subtitle` - description text
- `.fileChecklist` - checklist container
- `.checklistItem` - individual items
- `.checkbox` / `.checked` - checkmark styling
- `.itemLabel` / `.fileName` - text styling
- `.errorBanner` / `.successBanner` - status banners

## Button Component Props Reference
```jsx
<Button
  variant="primary" | "secondary" | "ghost" | "danger"
  size="sm" | "md" | "lg"
  disabled={boolean}
  loading={boolean}
  fullWidth={boolean}
  onClick={function}
>
  Button Text
</Button>
```

## Modal Component Props Reference
```jsx
<Modal
  isOpen={boolean}           // Required - controls visibility
  onClose={function}         // Required - close handler
  title={string}             // Optional - header title
  size="sm" | "md" | "lg" | "xl"  // Optional - default "md"
  footer={ReactNode}         // Optional - footer buttons
  closeOnOverlay={boolean}   // Optional - default true
  closeOnEscape={boolean}    // Optional - default true
  showCloseButton={boolean}  // Optional - default true
  scopedToPanel={boolean}    // Optional - for panel-scoped modals
  contained={boolean}        // Optional - for contained modals
>
  {children}
</Modal>
```

## Testing Checklist
After refactoring, verify:
- [ ] Modal opens when isOpen={true}
- [ ] Modal closes on X button click
- [ ] Modal closes on overlay click
- [ ] Modal closes on Escape key
- [ ] Cancel button closes modal
- [ ] Submit button shows loading state when submitting
- [ ] Submit button disabled when files missing
- [ ] Success shows toast and closes modal
- [ ] Error shows toast and keeps modal open
- [ ] File checklist displays correctly
- [ ] Warning/success banners display correctly

## DO NOT
- Add inline styles
- Create new custom button components
- Modify the base Modal.js or Button.js files
- Change the props interface (isOpen, onClose, onSubmit, files)

## Files to Modify
1. `/src/components/drafter/SubmitModal.js` - Main refactor
2. `/src/components/drafter/SubmitModal.module.css` - Remove unused styles

## Verification Command
After changes, the component should:
1. Import Modal from '../ui/Modal' or '../../ui/Modal' (check path)
2. Import Button from '../ui/Button' or '../../ui/Button' (check path)
3. Have NO div with className containing 'overlay'
4. Have NO button elements (only Button components)
