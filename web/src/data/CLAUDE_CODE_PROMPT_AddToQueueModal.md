# TASK: Modal Compliance - AddToQueueModal Full Refactor

## Objective
Refactor AddToQueueModal to use base Modal component and UI components for 100% design system compliance.

## Current File Location
`/src/components/admin/AddToQueueModal.js`
`/src/components/admin/AddToQueueModal.module.css`

## Current Violations
1. Does NOT use base Modal component - has custom overlay div
2. Does NOT use Button component - has custom button elements
3. Does NOT use FormInput component - has custom input element
4. Does NOT use FormSelect component - has custom select element
5. Does NOT use Textarea component - has custom textarea element
6. Uses HTML form element (not needed with Modal)

## Required Changes

### 1. Update Imports
```jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import FormSelect from '../ui/FormSelect';
import Textarea from '../ui/Textarea';
import styles from './AddToQueueModal.module.css';
```

### 2. Remove Form Element, Use Modal Structure
```jsx
// BEFORE (wrong):
<div className={styles.overlay}>
  <div className={styles.modal}>
    <h2 className={styles.title}>Add Project to Queue</h2>
    <form onSubmit={handleSubmit} className={styles.form}>
      ...
      <div className={styles.actions}>
        <button type="button">Cancel</button>
        <button type="submit">Add to Queue</button>
      </div>
    </form>
  </div>
</div>

// AFTER (correct):
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Add Project to Queue"
  size="md"
  closeOnOverlay={!adding}
  closeOnEscape={!adding}
  footer={
    <>
      <Button variant="secondary" onClick={handleClose} disabled={adding}>
        Cancel
      </Button>
      <Button 
        variant="primary" 
        onClick={handleSubmit} 
        disabled={adding || !projectId.trim()}
        loading={adding}
      >
        Add to Queue
      </Button>
    </>
  }
>
  {/* Form fields without form wrapper */}
</Modal>
```

### 3. Replace Custom Input with FormInput
```jsx
// BEFORE (wrong):
<div className={styles.formGroup}>
  <label className={styles.label}>
    Project ID <span className={styles.required}>*</span>
  </label>
  <input
    type="text"
    value={projectId}
    onChange={(e) => setProjectId(e.target.value)}
    placeholder="Enter project ID or UUID"
    className={styles.input}
    disabled={adding}
    required
  />
</div>

// AFTER (correct):
<FormInput
  label="Project ID"
  value={projectId}
  onChange={(e) => setProjectId(e.target.value)}
  placeholder="Enter project ID or UUID"
  disabled={adding}
  required
/>
```

### 4. Replace Custom Textarea with Textarea Component
```jsx
// BEFORE (wrong):
<div className={styles.formGroup}>
  <label className={styles.label}>
    Notes for Drafter <span className={styles.optional}>(optional)</span>
  </label>
  <textarea
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    placeholder="Add any special instructions..."
    className={styles.textarea}
    rows={3}
    maxLength={500}
    disabled={adding}
  />
  <div className={styles.charCount}>{notes.length}/500</div>
</div>

// AFTER (correct):
<Textarea
  label="Notes for Drafter"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  placeholder="Add any special instructions..."
  rows={3}
  maxLength={500}
  disabled={adding}
  helper={`${notes.length}/500`}
  hint="(optional)"
/>
```

### 5. Replace Custom Select with FormSelect
```jsx
// BEFORE (wrong):
<div className={styles.formGroup}>
  <label className={styles.label}>Time Limit (minutes)</label>
  <select
    value={timeLimit}
    onChange={(e) => setTimeLimit(e.target.value)}
    className={styles.select}
    disabled={adding}
  >
    <option value="15">15 minutes</option>
    ...
  </select>
</div>

// AFTER (correct):
<FormSelect
  label="Time Limit (minutes)"
  value={timeLimit}
  onChange={(e) => setTimeLimit(e.target.value)}
  options={[
    { value: '15', label: '15 minutes' },
    { value: '20', label: '20 minutes' },
    { value: '30', label: '30 minutes (default)' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '60 minutes' },
  ]}
  disabled={adding}
/>
```

### 6. Update Submit Handler (Remove Event Prevention)
```jsx
// BEFORE (wrong - used with form):
const handleSubmit = async (e) => {
  e.preventDefault();
  ...
};

// AFTER (correct - no form):
const handleSubmit = async () => {
  if (!projectId.trim()) {
    toast.warning('Please enter a project ID');
    return;
  }

  try {
    setAdding(true);
    const timeLimitSeconds = parseInt(timeLimit) * 60;
    await onAdd(projectId.trim(), notes.trim(), timeLimitSeconds);
    
    // Reset and close
    setProjectId('');
    setNotes('');
    setTimeLimit('30');
    onClose();
  } catch (error) {
    toast.error('Failed to add project to queue');
  } finally {
    setAdding(false);
  }
};
```

## Complete Refactored Structure
```jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import FormSelect from '../ui/FormSelect';
import Textarea from '../ui/Textarea';
import styles from './AddToQueueModal.module.css';

const AddToQueueModal = ({ isOpen, onClose, onAdd }) => {
  const [projectId, setProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [timeLimit, setTimeLimit] = useState('30');
  const [adding, setAdding] = useState(false);

  const handleSubmit = async () => {
    if (!projectId.trim()) {
      toast.warning('Please enter a project ID');
      return;
    }

    try {
      setAdding(true);
      const timeLimitSeconds = parseInt(timeLimit) * 60;
      await onAdd(projectId.trim(), notes.trim(), timeLimitSeconds);
      
      setProjectId('');
      setNotes('');
      setTimeLimit('30');
      onClose();
    } catch (error) {
      toast.error('Failed to add project to queue');
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    if (!adding) {
      setProjectId('');
      setNotes('');
      setTimeLimit('30');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Project to Queue"
      size="md"
      closeOnOverlay={!adding}
      closeOnEscape={!adding}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={adding}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={adding || !projectId.trim()}
            loading={adding}
          >
            Add to Queue
          </Button>
        </>
      }
    >
      <div className={styles.content}>
        <FormInput
          label="Project ID"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="Enter project ID or UUID"
          disabled={adding}
          required
        />

        <Textarea
          label="Notes for Drafter"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any special instructions..."
          rows={3}
          maxLength={500}
          disabled={adding}
          helper={`${notes.length}/500`}
          hint="(optional)"
        />

        <FormSelect
          label="Time Limit (minutes)"
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
          options={[
            { value: '15', label: '15 minutes' },
            { value: '20', label: '20 minutes' },
            { value: '30', label: '30 minutes (default)' },
            { value: '45', label: '45 minutes' },
            { value: '60', label: '60 minutes' },
          ]}
          disabled={adding}
        />
      </div>
    </Modal>
  );
};

export default AddToQueueModal;
```

## Update CSS Module
Remove from AddToQueueModal.module.css:
- `.overlay` - Modal handles this
- `.modal` - Modal handles this
- `.title` - Modal handles this
- `.form` - No longer using form element
- `.formGroup` - UI components handle this
- `.label` - UI components handle this
- `.required` / `.optional` - UI components handle this
- `.input` - FormInput handles this
- `.textarea` - Textarea handles this
- `.select` - FormSelect handles this
- `.charCount` - Textarea helper handles this
- `.actions` - Modal footer handles this
- `.cancelButton` - Button handles this
- `.addButton` - Button handles this

Keep:
- `.content` - body content spacing/layout

## Testing Checklist
- [ ] Modal opens when isOpen={true}
- [ ] Modal closes on X button click
- [ ] Modal closes on overlay click (when not adding)
- [ ] Modal closes on Escape key (when not adding)
- [ ] Modal does NOT close during add operation
- [ ] Cancel button closes modal and resets form
- [ ] Add button shows loading state
- [ ] Add button disabled when project ID empty
- [ ] FormInput shows required indicator
- [ ] Textarea shows character count
- [ ] FormSelect shows all time limit options
- [ ] Success resets form and closes modal
- [ ] Error shows toast and keeps modal open

## DO NOT
- Add inline styles
- Keep the `<form>` element wrapper
- Create new custom components
- Modify base UI component files
- Change the props interface (isOpen, onClose, onAdd)
