# TASK: Modal Compliance - ReleaseModal Full Refactor

## Objective
Refactor ReleaseModal to use base Modal component and UI components for 100% design system compliance.

## Current File Location
`/src/components/drafter/ReleaseModal.js`
`/src/components/drafter/ReleaseModal.module.css`

## Current Violations
1. Does NOT use base Modal component - has custom overlay div
2. Does NOT use Button component - has custom button elements
3. Does NOT use FormSelect component - has custom select element
4. Does NOT use Textarea component - has custom textarea element

## Required Changes

### 1. Update Imports
```jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormSelect from '../ui/FormSelect';
import Textarea from '../ui/Textarea';
import styles from './ReleaseModal.module.css';
```

### 2. Replace Custom Overlay with Modal Component
```jsx
return (
  <Modal
    isOpen={isOpen}
    onClose={handleClose}
    title="Release Project"
    size="md"
    closeOnOverlay={!releasing}
    closeOnEscape={!releasing}
    footer={
      <>
        <Button variant="secondary" onClick={handleClose} disabled={releasing}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={handleRelease} 
          disabled={releasing || !reason}
          loading={releasing}
        >
          Release Project
        </Button>
      </>
    }
  >
    {/* Body content */}
  </Modal>
);
```

### 3. Replace Custom Select with FormSelect
```jsx
// BEFORE (wrong):
<select
  value={reason}
  onChange={(e) => setReason(e.target.value)}
  className={styles.select}
  disabled={releasing}
>
  <option value="">Select a reason...</option>
  {RELEASE_REASONS.map(r => (
    <option key={r.value} value={r.value}>{r.label}</option>
  ))}
</select>

// AFTER (correct):
<FormSelect
  label="Reason"
  value={reason}
  onChange={(e) => setReason(e.target.value)}
  options={[
    { value: '', label: 'Select a reason...' },
    ...RELEASE_REASONS.map(r => ({ value: r.value, label: r.label }))
  ]}
  disabled={releasing}
  required
/>
```

### 4. Replace Custom Textarea with Textarea Component
```jsx
// BEFORE (wrong):
<textarea
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  placeholder="Add any additional details..."
  className={styles.textarea}
  rows={4}
  maxLength={500}
  disabled={releasing}
/>
<div className={styles.charCount}>{notes.length}/500</div>

// AFTER (correct):
<Textarea
  label="Notes"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  placeholder="Add any additional details..."
  rows={4}
  maxLength={500}
  disabled={releasing}
  helper={`${notes.length}/500`}
  hint="(optional)"
/>
```

### 5. Keep Warning Banner Styling
The warning banner about releases remaining should stay - just ensure it uses CSS module classes:
```jsx
<div className={styles.warningBanner}>
  <span className={styles.warningIcon}>⚠️</span>
  <div>
    <div className={styles.warningText}>Releasing affects your completion rate</div>
    <div className={styles.warningSubtext}>
      Releases remaining: <strong>{releasesRemaining}/2</strong>
    </div>
  </div>
</div>
```

## Complete Refactored Structure
```jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormSelect from '../ui/FormSelect';
import Textarea from '../ui/Textarea';
import styles from './ReleaseModal.module.css';

const RELEASE_REASONS = [
  { value: 'complex', label: 'Complex project' },
  { value: 'missing_info', label: 'Missing information' },
  { value: 'technical_issue', label: 'Technical issue' },
  { value: 'personal_emergency', label: 'Personal emergency' },
  { value: 'other', label: 'Other' }
];

const ReleaseModal = ({ isOpen, onClose, onRelease, releasesRemaining = 0 }) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [releasing, setReleasing] = useState(false);

  const handleRelease = async () => {
    if (!reason) {
      toast.warning('Please select a reason for releasing');
      return;
    }

    try {
      setReleasing(true);
      await onRelease(reason, notes.trim());
      // Parent handles success (closes modal, shows toast, redirects)
    } catch (error) {
      console.error('Failed to release project:', error);
      toast.error('Failed to release project. Please try again.');
      setReleasing(false);
    }
  };

  const handleClose = () => {
    if (!releasing) {
      setReason('');
      setNotes('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Release Project"
      size="md"
      closeOnOverlay={!releasing}
      closeOnEscape={!releasing}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={releasing}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleRelease} 
            disabled={releasing || !reason}
            loading={releasing}
          >
            Release Project
          </Button>
        </>
      }
    >
      {/* Warning Banner */}
      <div className={styles.warningBanner}>
        <span className={styles.warningIcon}>⚠️</span>
        <div>
          <div className={styles.warningText}>Releasing affects your completion rate</div>
          <div className={styles.warningSubtext}>
            Releases remaining: <strong>{releasesRemaining}/2</strong>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <FormSelect
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          options={[
            { value: '', label: 'Select a reason...' },
            ...RELEASE_REASONS.map(r => ({ value: r.value, label: r.label }))
          ]}
          disabled={releasing}
          required
        />

        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional details..."
          rows={4}
          maxLength={500}
          disabled={releasing}
          helper={`${notes.length}/500`}
          hint="(optional)"
        />
      </div>
    </Modal>
  );
};

export default ReleaseModal;
```

## Update CSS Module
Remove from ReleaseModal.module.css:
- `.overlay` - Modal handles this
- `.modal` - Modal handles this
- `.title` - Modal handles this
- `.actions` - Modal footer handles this
- `.cancelButton` - Button component handles this
- `.releaseButton` - Button component handles this
- `.select` - FormSelect handles this
- `.textarea` - Textarea handles this
- `.formGroup` - FormSelect/Textarea handle this
- `.label` - FormSelect/Textarea handle this
- `.required` / `.optional` - FormSelect/Textarea handle this
- `.charCount` - Textarea helper handles this

Keep:
- `.content` - body content spacing
- `.warningBanner` - warning banner container
- `.warningIcon` - icon styling
- `.warningText` - main warning text
- `.warningSubtext` - secondary text

## Testing Checklist
- [ ] Modal opens when isOpen={true}
- [ ] Modal closes on X button click
- [ ] Modal closes on overlay click (when not releasing)
- [ ] Modal closes on Escape key (when not releasing)
- [ ] Modal does NOT close during release (closeOnOverlay/Escape disabled)
- [ ] Cancel button closes modal and resets form
- [ ] Release button shows loading state
- [ ] Release button disabled when no reason selected
- [ ] Warning banner displays correctly with releases remaining
- [ ] FormSelect shows all reason options
- [ ] Textarea shows character count
- [ ] Error shows toast and keeps modal open

## DO NOT
- Add inline styles
- Create new custom components
- Modify base UI component files
- Change the props interface (isOpen, onClose, onRelease, releasesRemaining)
