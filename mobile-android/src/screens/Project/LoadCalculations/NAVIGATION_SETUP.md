# Load Calculations - Navigation Setup Instructions

## What Was Done

1. ✅ **MainPanelA.tsx** - Lightning bolt icon now navigates to Load Calculations
   - Enabled the TouchableOpacity (was commented out)
   - Passes `panelType`, `projectId`, and `companyId` as navigation params

2. ✅ **LoadCalculationsScreen.tsx** - Now uses LargeHeader component
   - Replaced custom header with LargeHeader component
   - Accepts navigation route params
   - Back button (drawer icon) navigates back to previous screen

## What You Need To Do

### Add Route to Navigation Stack

You need to add the `LoadCalculations` route to your navigation stack. Find your navigation configuration file (typically `navigation/AppNavigator.tsx` or similar) and add:

```tsx
import LoadCalculationsScreen from '../screens/Project/LoadCalculations';

// In your Stack.Navigator:
<Stack.Screen
  name="LoadCalculations"
  component={LoadCalculationsScreen}
  options={{
    headerShown: false, // We use LargeHeader instead
    title: "Load Calculations"
  }}
/>
```

### Example Navigation Stack Integration

```tsx
// Example: navigation/ProjectNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ElectricalScreen from '../screens/Project/electrical/ElectricalScreen';
import LoadCalculationsScreen from '../screens/Project/LoadCalculations';

const Stack = createStackNavigator();

export default function ProjectNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Electrical"
        component={ElectricalScreen}
      />
      <Stack.Screen
        name="LoadCalculations"
        component={LoadCalculationsScreen}
      />
      {/* ... other screens */}
    </Stack.Navigator>
  );
}
```

### TypeScript Navigation Types (Optional but Recommended)

If you're using TypeScript navigation types, add to your navigation type definitions:

```tsx
// types/navigation.ts or similar
export type ProjectStackParamList = {
  Electrical: undefined;
  LoadCalculations: {
    panelType?: string;
    projectId?: string;
    companyId?: string;
    houseId?: number;
  };
  // ... other screens
};
```

## Testing the Integration

1. **Navigate to Electrical Screen** with Main Panel A section
2. **Expand Main Panel A** section
3. **Click "Load Calcs"** (lightning bolt icon) in the top right
4. **Verify:**
   - Screen navigates to Load Calculations
   - Header shows "Main Panel A" (from panelType param)
   - ProjectId displays if available
   - Back button (flame icon in header) returns to previous screen
   - All sections are collapsible
   - Numeric keypad opens for all inputs
   - Dynamic table add/remove works

## Navigation Flow

```
Electrical Screen
  └─> Main Panel (A) section
      └─> "Load Calcs" button (lightning bolt)
          └─> Load Calculations Screen
              └─> Back button (flame icon in header)
                  └─> Returns to Electrical Screen
```

## Files Modified

1. **Front/skyfire_mobileapp_dev/src/screens/Project/electrical/sections/MainPanelA.tsx**
   - Line 269-280: Enabled Load Calcs navigation

2. **Front/skyfire_mobileapp_dev/src/screens/Project/LoadCalculations/LoadCalculationsScreen.tsx**
   - Added LargeHeader component
   - Added navigation and route hooks
   - Added param handling

3. **Front/skyfire_mobileapp_dev/src/screens/Project/LoadCalculations/README.md**
   - Updated usage documentation

## Troubleshooting

### "Cannot navigate to LoadCalculations"
- Make sure you've added the route to your navigation stack
- Check the route name matches exactly: `"LoadCalculations"`

### "LargeHeader not showing"
- Verify LargeHeader import path is correct
- Check that `headerShown: false` is set in navigation options

### "Back button not working"
- Verify navigation stack is properly configured
- Check that you're using a Stack Navigator (not Tab or Drawer only)

### "ProjectId not showing in header"
- Verify you're passing `projectId` in navigation params from MainPanelA
- Check that the projectId variable is defined in the calling component

## Future Enhancements

- Add route from other panels (Sub Panel B, etc.)
- Pass pre-populated data from house/project context
- Add save functionality with API integration
- Add confirmation modal when navigating back with unsaved changes
