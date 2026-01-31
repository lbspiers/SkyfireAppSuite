# Reusable UI Components

This directory contains reusable UI components built for the Skyfire Web App, inspired by the mobile app design and optimized for web.

## Components

### GradientInput

A styled input component with gradient background and optional password visibility toggle.

**Props:**
- `label` (string): Label text displayed above the input
- `type` (string): Input type (text, password, email, etc.)
- `placeholder` (string): Placeholder text
- `value` (string): Input value
- `onChange` (function): Change handler
- `onBlur` (function): Blur handler
- `error` (string): Error message to display below the input
- `showPasswordToggle` (boolean): Show eye icon for password fields
- `name` (string): Input name attribute
- `id` (string): Input id attribute

**Features:**
- Linear gradient background (#2C4161 to #1D2E4A)
- Orange border (#FD7332) when focused or has value
- Built-in password visibility toggle
- Automatic focus state management
- Field-level validation error display

**Usage:**
```jsx
import { GradientInput } from './ui';

<GradientInput
  label="Email"
  type="email"
  name="email"
  placeholder="you@example.com"
  value={formik.values.email}
  onChange={formik.handleChange}
  onBlur={formik.handleBlur}
  error={formik.touched.email && formik.errors.email}
/>
```

---

### Checkbox

A custom checkbox component with icon styling matching the mobile app design.

**Props:**
- `checked` (boolean): Whether the checkbox is checked
- `onChange` (function): Change handler that receives the new checked state
- `label` (string): Label text displayed next to the checkbox
- `id` (string): Checkbox id attribute
- `name` (string): Checkbox name attribute

**Features:**
- Custom selected/unselected icon images
- Keyboard accessible (Enter/Space to toggle)
- Click anywhere on container to toggle
- Hidden native checkbox for form integration

**Usage:**
```jsx
import { Checkbox } from './ui';

<Checkbox
  checked={formik.values.keepSignIn}
  onChange={(checked) => formik.setFieldValue('keepSignIn', checked)}
  label="Keep Me Logged In"
  name="keepSignIn"
/>
```

---

### IconButton

An icon-based button component with image and label, matching the mobile app style.

**Props:**
- `icon` (string): Path to icon image
- `label` (string): Button label text
- `onClick` (function): Click handler
- `primary` (boolean): Apply primary styling (orange color)
- `disabled` (boolean): Disable the button
- `type` (string): Button type (button, submit, reset)

**Features:**
- Icon + label vertical layout
- Hover scale animation
- Primary variant with orange text color
- Disabled state handling
- Supports all native button props

**Usage:**
```jsx
import { IconButton } from './ui';
import appIcon from '../../assets/images/appIcon.png';

<IconButton
  icon={appIcon}
  label="Sign In"
  onClick={handleSubmit}
  disabled={loading}
  primary
  type="submit"
/>
```

---

## Styling

All components use CSS Modules from `src/styles/Login.module.css` for scoped, modular styling.

### Color Palette
- **Primary Orange:** #FD7332
- **Background Gradient:** #2E4161 → #0C1F3F
- **Input Gradient:** #2C4161 → #1D2E4A
- **Text White:** #FFFFFF
- **Border Inactive:** #888888
- **Error Red:** #EF4444
- **Placeholder:** #BBBBBB

### Responsive Design
The components are fully responsive with breakpoints at:
- Desktop: Full size (default)
- Tablet: 768px and below
- Mobile: 480px and below

---

## Assets

Required assets are located in `src/assets/images/`:
- `applogo.png` - Skyfire logo
- `appIcon.png` - App icon for sign-in button
- `icons/eye.png` - Password visibility toggle
- `icons/selected.png` - Checked checkbox icon
- `icons/unselected.png` - Unchecked checkbox icon
- `icons/plus_icon_orange_fd7332.png` - Sign up button icon

All assets are copied from the mobile app: `D:\Release3.1.0_16kb\Front\skyfire_mobileapp_dev\src\assets\Images\`

---

## Implementation Notes

1. **Modular Architecture:** Each component is self-contained with its own logic and can be used independently
2. **Form Integration:** Components work seamlessly with Formik for form state management
3. **Accessibility:** All components include proper ARIA attributes and keyboard support
4. **Performance:** CSS Modules provide optimized, scoped styling with no conflicts
5. **Maintainability:** Components follow React best practices with clear prop interfaces

---

## Future Enhancements

Potential improvements for these components:
- [ ] Add loading spinner variant for IconButton
- [ ] Support for different GradientInput sizes (small, medium, large)
- [ ] Dark mode support
- [ ] Animation transitions for state changes
- [ ] Additional validation states (warning, success)
- [ ] TypeScript conversion for better type safety
