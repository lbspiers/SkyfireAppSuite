# MASTER TEMPLATE: Modal Compliance Refactor

Use this template for any modal refactor task. Copy and customize the sections.

---

## Quick Reference - UI Components

### Modal
```jsx
import Modal from '../ui/Modal';  // Adjust path as needed

<Modal
  isOpen={boolean}           // Required
  onClose={function}         // Required
  title={string}             // Header title
  size="sm" | "md" | "lg" | "xl"
  footer={ReactNode}         // Action buttons
  closeOnOverlay={boolean}   // Default true
  closeOnEscape={boolean}    // Default true
  showCloseButton={boolean}  // Default true
  scopedToPanel={boolean}    // For panel-scoped modals
  contained={boolean}        // For contained modals
>
  {children}
</Modal>
```

### Button
```jsx
import Button from '../ui/Button';

<Button
  variant="primary" | "secondary" | "ghost" | "danger"
  size="sm" | "md" | "lg"
  disabled={boolean}
  loading={boolean}
  fullWidth={boolean}
  onClick={function}
  type="button" | "submit"
>
  Button Text
</Button>
```

### FormInput
```jsx
import FormInput from '../ui/FormInput';

<FormInput
  label="Label Text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Placeholder..."
  type="text" | "email" | "password" | "number" | "tel"
  disabled={boolean}
  required={boolean}
  error={string}
  helper={string}
  hint={string}
/>
```

### FormSelect
```jsx
import FormSelect from '../ui/FormSelect';

<FormSelect
  label="Label Text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  options={[
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
  ]}
  placeholder="Select..."
  disabled={boolean}
  required={boolean}
  error={string}
/>
```

### Textarea
```jsx
import Textarea from '../ui/Textarea';

<Textarea
  label="Label Text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Placeholder..."
  rows={4}
  maxLength={500}
  disabled={boolean}
  helper={`${value.length}/500`}
  hint="(optional)"
/>
```

---

## Standard Refactor Pattern

### BEFORE (Non-Compliant)
```jsx
const MyModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Title</h2>
        <div className={styles.content}>
          {/* content */}
        </div>
        <div className={styles.actions}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};
```

### AFTER (Compliant)
```jsx
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import styles from './MyModal.module.css';

const MyModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Title"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Confirm
          </Button>
        </>
      }
    >
      <div className={styles.content}>
        {/* content */}
      </div>
    </Modal>
  );
};
```

---

## CSS Module Cleanup

### Remove These (Modal/UI Components Handle)
- `.overlay` → Modal overlay
- `.modal` → Modal container
- `.title` / `.header` → Modal header
- `.actions` / `.footer` / `.buttons` → Modal footer
- `.cancelButton` / `.submitButton` / any button styles → Button component
- `.input` / `.formInput` → FormInput component
- `.select` / `.dropdown` → FormSelect component
- `.textarea` → Textarea component
- `.formGroup` / `.label` / `.required` / `.optional` → Form components
- `.charCount` → Textarea helper prop

### Keep These
- `.content` → Body content container
- Custom banners/alerts
- Custom icons/illustrations
- Layout-specific styles (grids, spacing)
- State-specific styling (success, error banners)

---

## Common Patterns

### Loading State During Async Action
```jsx
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  try {
    setLoading(true);
    await someAsyncAction();
    onClose();
  } catch (error) {
    toast.error('Something went wrong');
  } finally {
    setLoading(false);
  }
};

// In footer:
<Button 
  variant="primary" 
  onClick={handleSubmit}
  disabled={loading}
  loading={loading}
>
  Submit
</Button>
```

### Prevent Close During Operation
```jsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  closeOnOverlay={!loading}
  closeOnEscape={!loading}
  ...
>
```

### Form Reset on Close
```jsx
const handleClose = () => {
  if (!loading) {
    setField1('');
    setField2('');
    onClose();
  }
};
```

### Confirmation Before Close (Dirty Form)
```jsx
const handleClose = () => {
  if (hasUnsavedChanges) {
    if (window.confirm('Discard changes?')) {
      onClose();
    }
  } else {
    onClose();
  }
};
```

---

## Testing Checklist (Copy for Each Modal)

### Modal Behavior
- [ ] Opens when isOpen={true}
- [ ] Closes on X button click
- [ ] Closes on overlay click
- [ ] Closes on Escape key
- [ ] Respects closeOnOverlay/closeOnEscape props

### Button Behavior  
- [ ] All buttons use Button component
- [ ] Loading states work
- [ ] Disabled states work
- [ ] Correct variants (primary, secondary, danger)

### Form Behavior (if applicable)
- [ ] All inputs use FormInput/FormSelect/Textarea
- [ ] Required indicators show
- [ ] Error states display
- [ ] Helper text displays
- [ ] Character counts work

### State Management
- [ ] Form resets on close
- [ ] Loading prevents double-submit
- [ ] Errors show toast and keep modal open
- [ ] Success closes modal appropriately

---

## DO NOT (Universal Rules)

1. **No inline styles** except for truly dynamic values (transforms, calculated dimensions)
2. **No custom button elements** - always use Button component
3. **No custom form elements** - use FormInput, FormSelect, Textarea
4. **No custom overlays** - Modal handles this
5. **Don't modify base UI components** - only the modal being refactored
6. **Don't change props interface** - keep backward compatibility
7. **Don't use `<form>` wrapper** - Modal footer handles submission
