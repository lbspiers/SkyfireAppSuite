# Load Calculations Screen

A reusable, collapsible screen for calculating electrical loads for solar system sizing.

## Features

- **Dark theme** with gradient background (#2E4161 to #0C1F3F)
- **Collapsible sections** for organized data entry
- **Numeric keypad** for all numeric inputs (NO dropdowns)
- **Dynamic table** for adding/removing additional breakers
- **Form validation** with error states
- **Reusable** across different contexts with configurable labels

## Structure

```
LoadCalculations/
├── LoadCalculationsScreen.tsx    # Main screen component
├── index.tsx                      # Exports for easy imports
├── README.md                      # This file
├── hooks/
│   └── useLoadCalculations.ts    # State management hook
├── sections/
│   ├── FloorAreaSection.tsx      # Floor area input section
│   ├── BreakerQuantitiesSection.tsx  # Breaker quantity inputs
│   ├── BreakerRatingsSection.tsx     # Breaker amp ratings
│   └── AdditionalBreakersSection.tsx # Dynamic load table
└── components/
    └── (future custom components)
```

## Usage

### Navigation from MainPanelA

The Load Calculations screen is connected to the lightning bolt icon in Main Panel A:

```tsx
// In MainPanelA.tsx
<TouchableOpacity
  onPress={() => navigation.navigate("LoadCalculations", {
    panelType: "Main Panel A",
    projectId,
    companyId
  })}
>
  <Text>Load Calcs</Text>
  <Image source={boltIcon} />
</TouchableOpacity>
```

### Navigation Parameters

When navigating to the screen, you can pass these parameters:

```typescript
navigation.navigate("LoadCalculations", {
  panelType: "Main Panel A",  // Used as header title
  projectId: "12345",         // Displayed in header
  companyId: "comp-123",      // For future use
  houseId: 123                // Load existing data
});
```

### Basic Usage (Direct Component)

```tsx
import LoadCalculationsScreen from "@/screens/Project/LoadCalculations";

function MyComponent() {
  return <LoadCalculationsScreen />;
}
```

### With Custom Title

```tsx
<LoadCalculationsScreen
  screenTitle="Custom Load Calculations"
/>
```

### With Existing Data

```tsx
<LoadCalculationsScreen
  houseId={123}
  onSave={(data) => console.log("Saved:", data)}
/>
```

## Sections

### 1. Floor Area Section
- **Required field**
- Pre-populates from `house.sqft` if available
- Triggers numeric keypad
- Unit: square feet

### 2. Breaker Quantities Section
- **Fields:**
  - Small Appliance Circuits
  - Bathroom Circuits
  - Laundry Circuits
- Note: "Enter breaker quantities for the following. These are typically single pole 20A breakers."
- All fields trigger numeric keypad

### 3. Breaker Amp Ratings Section
- **Fields:**
  - HVAC/Air Handler
  - Electrical Furnace
  - Electric Vehicle
- Note: "Enter the sum total of the breaker amp ratings for the following:"
- All fields trigger numeric keypad

### 4. Additional 2-Pole Breakers Section
- **Dynamic table** with columns:
  - Load Type (Name) - text input (~184px)
  - Breaker Rating (Amps) - numeric input (~100px)
  - Delete button (orange "-" icon)
- **Add Load button** to add new rows
- Starts with 3 empty rows
- Note about 2-pole breaker requirements

## Data Structure

```typescript
interface LoadCalculationsValues {
  floorArea: string;
  smallApplianceCircuits: string;
  bathroomCircuits: string;
  laundryCircuits: string;
  hvacAirHandler: string;
  electricalFurnace: string;
  electricVehicle: string;
  additionalLoads: AdditionalLoad[];
}

interface AdditionalLoad {
  id: string;
  name: string;
  amps: string;
}
```

## Styling

- **Background:** Linear gradient (#2E4161 → #0C1F3F)
- **Text:** White (#FFFFFF)
- **Font:** Lato
- **Font sizes:**
  - Headers: 24px
  - Field labels: 20px
  - Note text: 18px
  - Input text: 20px
- **Orange accent:** #FD7332 (buttons, icons, active states)
- **Input fields:** White underline border, transparent background

## Validation

- **Floor Area:** Required field
- **Additional Loads:**
  - If name is provided, amps must be provided
  - If amps is provided, name must be provided

## Notes Component Pattern

Each section with a note uses this pattern:

```tsx
<View style={styles.noteContainer}>
  <View style={styles.noteHeader}>
    <Image source={flameIcon} style={styles.flameIcon} />
    <Text style={styles.noteLabel}>Note</Text>
  </View>
  <Text style={styles.noteText}>
    Your note text here...
  </Text>
</View>
```

The flame icon is the app icon: `require("../../../../assets/Images/appIcon.png")`

## Future Enhancements

- [ ] Database integration for loading/saving data
- [ ] Auto-calculation of total load
- [ ] Export functionality
- [ ] Photo capture for each section
- [ ] Print/PDF generation
- [ ] Validation against NEC requirements
- [ ] Unit conversion (sq ft ↔ sq m)

## API Integration (TODO)

```typescript
// To implement in the future:
// - GET /api/load-calculations/:houseId
// - POST /api/load-calculations
// - PUT /api/load-calculations/:id
```

## Testing

To test this screen:
1. Navigate to the screen
2. Verify all inputs trigger numeric keypad
3. Test adding/removing dynamic loads
4. Test form validation
5. Verify collapsible sections work correctly
6. Check dark theme rendering

## Dependencies

- react-native
- react-native-linear-gradient
- Custom components:
  - CollapsibleSection
  - TextInput
  - NumericKeypad
  - Button
- Utils:
  - responsive (moderateScale, verticalScale, widthPercentageToDP)
