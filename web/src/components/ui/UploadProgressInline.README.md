# UploadProgressInline Component

## Overview
Inline upload progress indicator that replaces the modal approach. Shows upload progress directly in the UI next to or near the upload button.

## Design Changes

### Before (Modal)
- Full-screen modal overlay
- Separate floating indicator when minimized
- Blocks user interaction
- Shows detailed file-by-file progress in scrollable list
- "Done" button to close modal
- "Retry Failed" button in modal footer

### After (Inline)
- Compact inline progress bar
- No modal overlay - non-blocking
- Shows summary: "Uploading X of Y..." or "X uploaded, Y failed"
- Progress bar with percentage
- "Retry (N)" button inline when failures occur
- Success checkmark when complete
- Auto-hides when no uploads (total === 0)

## Usage

```jsx
import { UploadProgressInline } from '../ui';

function MyUploadComponent() {
  return (
    <div>
      <button onClick={handleUpload}>Upload Files</button>

      {/* Add inline progress indicator */}
      <UploadProgressInline />

      {/* Your other content */}
    </div>
  );
}
```

## Integration Points

Already integrated in:
- **FilesPanel** (`src/components/project/FilesPanel.js`) - Below toolbar, above file list

Can be added to:
- **UploadZone** - Below drag-and-drop area
- **MediaGallery** - In header or below upload trigger
- **FileUploadPanel** (Drafter Portal) - Per file type section

## Features

- **Auto-show/hide**: Only visible when uploads exist (total > 0)
- **Real-time updates**: Uses `useUploadManager` hook for reactive state
- **Retry functionality**: Inline "Retry (N)" button for failed uploads
- **Progress states**:
  - Processing: "Uploading X of Y..." with animated progress bar
  - Success: "All N files uploaded!" with checkmark
  - Mixed: "X uploaded, Y failed" with warning color + retry button

## Props

None - component is self-contained and subscribes to global uploadManager

## Styling

- Uses design tokens from `tokens.css`
- CSS Modules: `UploadProgressInline.module.css`
- Responsive flexbox layout
- Smooth transitions and animations
- Follows design constitution spacing rules

## State Management

Connected to global `uploadManager` singleton:
- Subscribes to upload events automatically
- Updates in real-time as files upload
- No props needed - fully autonomous

## Accessibility

- Progress bar has proper ARIA attributes
- Semantic HTML structure
- Clear status text
- Keyboard-accessible retry button
