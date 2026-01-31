# Custom Branded Keyboard Component

A comprehensive React Native custom keyboard component that replicates full hardware keyboard functionality while incorporating your app's branding and visual identity.

## Features

### ✅ Complete Functionality
- **Full QWERTY layout** with proper key positioning and sizing
- **Multi-case support**: lowercase, uppercase, caps lock toggle
- **Number row** (1-9, 0) with symbol alternatives (shift + number)
- **Symbol/punctuation keys** with shift variations
- **Space bar** with proper width and positioning
- **Backspace** with hold-to-repeat functionality
- **Enter/Return key** with context-aware labels ("Send", "Done", "Search", etc.)
- **Shift key** with visual state indicators (normal, active, caps lock)
- **Key press feedback**: haptic feedback, visual press states
- **Auto-capitalization** after periods and sentence starts

### 🎨 Branded Design
- **Your app's gradient backgrounds** for keyboard container
- **Brand color palette** consistently applied
- **Visual hierarchy** matching your design system
- **Smooth animations** for key presses and state changes
- **Modern UI elements** with subtle effects

### 📱 Platform Optimized
- **iOS & Android** native feel and performance
- **Responsive design** adapting to different screen sizes
- **Accessibility support** with proper labels and hints
- **Memory optimized** for smooth performance

## Usage

### Basic Implementation

```tsx
import CustomKeyboard from './src/components/CustomKeyboard';

function MyScreen() {
  const [text, setText] = useState('');

  return (
    <View>
      <CustomKeyboard
        onTextChange={setText}
        returnKeyType="done"
        autoCapitalize="sentences"
        enableHapticFeedback={true}
        theme="dark"
        visible={true}
      />
    </View>
  );
}
```

### Using with Custom TextInput

```tsx
import { CustomTextInput } from './src/components/CustomKeyboard/CustomTextInput';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View>
      <CustomTextInput
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        useCustomKeyboard={true}
        keyboardType="email-address"
        theme="dark"
      />

      <CustomTextInput
        label="Password"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        useCustomKeyboard={true}
        secureTextEntry={true}
        theme="dark"
      />
    </View>
  );
}
```

## Props

### CustomKeyboard Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onKeyPress` | `(key: string) => void` | - | Called when a key is pressed |
| `onTextChange` | `(text: string) => void` | - | Called when text changes |
| `onBackspace` | `() => void` | - | Called when backspace is pressed |
| `onEnter` | `() => void` | - | Called when enter is pressed |
| `returnKeyType` | `'done' \| 'send' \| 'search' \| 'next' \| 'go'` | `'done'` | Enter key label |
| `autoCapitalize` | `'none' \| 'sentences' \| 'words' \| 'characters'` | `'sentences'` | Auto-capitalization behavior |
| `enableHapticFeedback` | `boolean` | `true` | Enable haptic feedback on key press |
| `showSuggestions` | `boolean` | `false` | Show suggestion bar above keyboard |
| `theme` | `'dark' \| 'light'` | `'dark'` | Keyboard theme |
| `visible` | `boolean` | `true` | Keyboard visibility |

### CustomTextInput Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Input label |
| `placeholder` | `string` | `''` | Placeholder text |
| `value` | `string` | `''` | Input value |
| `onChangeText` | `(text: string) => void` | - | Text change callback |
| `useCustomKeyboard` | `boolean` | `false` | Use custom keyboard instead of system |
| `secureTextEntry` | `boolean` | `false` | Hide text for passwords |
| `multiline` | `boolean` | `false` | Allow multiple lines |
| `maxLength` | `number` | - | Maximum character length |
| `errorText` | `string` | - | Error message to display |
| `theme` | `'dark' \| 'light'` | `'dark'` | Component theme |

## File Structure

```
src/components/CustomKeyboard/
├── index.tsx                 # Main keyboard component
├── KeyboardKey.tsx          # Individual key component
├── KeyboardLayout.ts        # QWERTY and symbol layouts
├── KeyboardTheme.ts         # Theme configuration
├── KeyboardManager.ts       # Text management and utilities
├── CustomTextInput.tsx      # Enhanced TextInput with custom keyboard
├── types.ts                 # TypeScript type definitions
└── README.md               # This documentation
```

## Keyboard Layouts

### QWERTY Mode
- **Row 1**: Numbers (1-0) with symbol alternatives (!@#$%^&*())
- **Row 2**: QWERTY (qwertyuiop)
- **Row 3**: ASDF (asdfghjkl)
- **Row 4**: Shift + ZXCV (zxcvbnm) + Backspace
- **Row 5**: Symbol + Comma + Space + Period + Enter

### Symbol Mode
- **Row 1**: Numbers (1234567890)
- **Row 2**: Symbols (-/:;()$&@)
- **Row 3**: Punctuation (.,?!'"+*)
- **Row 4**: More symbols (#+=/\<>{}%^) + Backspace
- **Row 5**: ABC + Comma + Space + Period + Enter

## Themes

### Dark Theme (Default)
- **Background**: Your app's blue gradient
- **Keys**: Dark grey with orange highlights
- **Text**: White
- **Active states**: Orange gradient

### Light Theme
- **Background**: Light grey gradient
- **Keys**: White with orange highlights
- **Text**: Dark grey
- **Active states**: Orange gradient

## Advanced Features

### Text Management
- **Undo/Redo**: Built-in text history management
- **Word selection**: Double-tap to select words
- **Auto-capitalization**: Smart capitalization rules
- **Text validation**: Email, phone, URL validation

### Performance Optimizations
- **Efficient re-rendering**: Minimal updates to unchanged keys
- **Memory management**: Optimized for smooth 60fps performance
- **Platform-specific**: iOS haptics, Android vibration
- **Responsive sizing**: Adapts to screen dimensions

### Accessibility
- **Screen reader support**: Proper accessibility labels
- **Voice over**: Full compatibility with assistive technologies
- **High contrast**: Supports accessibility contrast requirements
- **Large text**: Scales with system font size settings

## Integration Examples

### Replace Login Screen Keyboard

```tsx
// In your login screen
<CustomTextInput
  label="Email"
  value={email}
  onChangeText={setEmail}
  useCustomKeyboard={true}
  returnKeyType="next"
  autoCapitalize="none"
  keyboardType="email-address"
/>

<CustomTextInput
  label="Password"
  value={password}
  onChangeText={setPassword}
  useCustomKeyboard={true}
  returnKeyType="done"
  secureTextEntry={true}
/>
```

### Project Information Form

```tsx
// Replace existing TextInput components
<CustomTextInput
  label="Customer First Name*"
  placeholder="First Name…"
  value={values.firstName}
  onChangeText={handleChange("firstName")}
  useCustomKeyboard={true}
  autoCapitalize="words"
  returnKeyType="next"
/>
```

## Performance Considerations

- **60fps animations**: All animations optimized for smooth performance
- **Memory efficient**: Minimal memory footprint
- **Battery optimized**: Efficient touch handling and rendering
- **Network friendly**: No external dependencies for core functionality

## Browser/WebView Support

The keyboard is designed for React Native mobile apps. For web versions, it gracefully falls back to native browser keyboards while maintaining the same API.

## Customization

### Adding New Layouts
Extend `KeyboardLayout.ts` to add new layouts (e.g., DVORAK, international keyboards).

### Custom Key Actions
Modify `KeyboardKey.tsx` to add custom key behaviors or special function keys.

### Theme Customization
Update `KeyboardTheme.ts` to add new color schemes or visual styles.

## Troubleshooting

### Common Issues

1. **Keyboard not showing**: Ensure `visible={true}` and `useCustomKeyboard={true}`
2. **Performance issues**: Check for unnecessary re-renders in parent components
3. **Layout issues**: Verify screen width calculations and responsive scaling
4. **Theme not applying**: Confirm theme prop is passed to all components

### Debug Mode

Enable debug logging by setting `__DEV__` flag:

```tsx
<CustomKeyboard
  {...props}
  // Add debug logging in development
  onKeyPress={(key) => {
    if (__DEV__) console.log('Key pressed:', key);
    handleKeyPress(key);
  }}
/>
```

## Contributing

When adding new features:

1. **Follow TypeScript patterns** established in `types.ts`
2. **Maintain brand consistency** with existing theme system
3. **Add accessibility support** for new interactive elements
4. **Test on both platforms** (iOS and Android)
5. **Update documentation** with new props and features

## License

This component is part of your Skyfire Solar mobile application and follows your project's licensing terms.