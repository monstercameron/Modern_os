# Metro OS Theming Engine Guide

## Overview
The Metro OS theming engine provides a flexible, extensible system for customizing the appearance of the entire desktop environment. It uses React Context for state management and CSS custom properties for dynamic styling.

## Quick Start

### Using the Theme Context

```jsx
import { useTheme } from './ThemeContext';

function MyComponent() {
  const { theme, toggleLightDark, isLight } = useTheme();
  
  return (
    <div style={{ backgroundColor: theme.background, color: theme.text }}>
      <button onClick={toggleLightDark}>
        Toggle to {isLight ? 'Dark' : 'Light'} Mode
      </button>
    </div>
  );
}
```

### Using Theme Utility Functions

```jsx
import { themeVar, themedBg, themedText, themedBorder } from './ThemeContext';

// Method 1: Using CSS variable strings
<div style={{ backgroundColor: themeVar('surface') }}>
  Content
</div>

// Method 2: Using helper functions
<div style={themedBg('surface')}>
  <p style={themedText()}>Text content</p>
</div>

// Method 3: Combining styles
<div style={{ ...themedBg('surface'), ...themedBorder(), borderWidth: '1px' }}>
  Content
</div>
```

## Theme Structure

Each theme consists of 5 core colors:

```javascript
{
  accent: '#0078d4',      // Primary brand color, buttons, highlights
  background: '#1a1a1a',  // Main desktop background
  surface: '#2d2d30',     // Windows, panels, cards
  text: '#e0e0e0',        // Primary text color
  border: '#3e3e42',      // Borders, dividers, outlines
}
```

## Built-in Themes

### Light Theme
- Optimized for daytime use
- High contrast for readability
- Professional appearance

### Dark Theme (Default)
- Reduced eye strain
- Better for low-light environments
- Modern aesthetic

## Theme Context API

### State Properties
- `currentTheme` - String: 'light', 'dark', or 'custom'
- `theme` - Object: Current theme color values
- `isLight` - Boolean: True if light mode is active
- `isDark` - Boolean: True if dark mode is active
- `isCustom` - Boolean: True if custom theme is active
- `themes` - Object: Access to all theme definitions

### Methods

#### `setTheme(themeName)`
Switch to a predefined theme.
```jsx
const { setTheme } = useTheme();
setTheme('light');
```

#### `toggleLightDark()`
Toggle between light and dark modes.
```jsx
const { toggleLightDark } = useTheme();
toggleLightDark();
```

#### `updateCustomTheme(updates)`
Create or update a custom theme by providing partial theme object.
```jsx
const { updateCustomTheme } = useTheme();
updateCustomTheme({ accent: '#ff5733', border: '#333' });
```

#### `applyPreset(preset)`
Apply either a theme name (string) or custom theme object.
```jsx
const { applyPreset } = useTheme();
applyPreset('dark'); // or
applyPreset({ accent: '#ff5733', background: '#000' });
```

#### `resetTheme()`
Reset to the default dark theme.
```jsx
const { resetTheme } = useTheme();
resetTheme();
```

#### `getColor(key)`
Get a specific color from the current theme.
```jsx
const { getColor } = useTheme();
const accentColor = getColor('accent');
```

## Utility Functions

### `themeVar(property)`
Returns CSS variable string for use in inline styles.
```jsx
themeVar('accent') // returns 'var(--theme-accent)'
```

### `themedBg(property = 'surface')`
Returns background color style object.
```jsx
<div style={themedBg('background')}>Content</div>
```

### `themedText(property = 'text')`
Returns text color style object.
```jsx
<p style={themedText()}>Text content</p>
```

### `themedBorder(property = 'border')`
Returns border color style object.
```jsx
<div style={{ ...themedBorder(), borderWidth: '2px' }}>Content</div>
```

## Creating Custom Themes

### In Settings App
1. Open Settings
2. Go to Personalization
3. Use color pickers to adjust individual colors
4. Or click a preset button

### Programmatically
```jsx
import { useTheme } from './ThemeContext';

function CustomThemeButton() {
  const { updateCustomTheme } = useTheme();
  
  const applyPurpleTheme = () => {
    updateCustomTheme({
      accent: '#7c3aed',
      background: '#1a103d',
      surface: '#2d1b69',
      text: '#f3f4f6',
      border: '#6b46c1'
    });
  };
  
  return <button onClick={applyPurpleTheme}>Apply Purple Theme</button>;
}
```

### Adding Permanent Presets

Edit `ThemeContext.jsx` to add new themes:

```jsx
export const themes = {
  light: { /* ... */ },
  dark: { /* ... */ },
  yourTheme: {
    accent: '#color1',
    background: '#color2',
    surface: '#color3',
    text: '#color4',
    border: '#color5'
  }
};
```

## Best Practices

1. **Use theme variables in components**: Always use `themeVar()` or theme object properties instead of hardcoded colors
2. **Test in both modes**: Ensure your components look good in both light and dark themes
3. **Consistent contrast**: Maintain sufficient contrast ratios for accessibility
4. **Avoid hardcoded colors**: Let the theme system handle all colors
5. **Use helper functions**: They make code cleaner and more maintainable

## Examples

### Themed Button Component
```jsx
import { useTheme, themedBg, themedText } from './ThemeContext';

function ThemedButton({ children, onClick }) {
  const { theme } = useTheme();
  
  return (
    <button
      onClick={onClick}
      style={{
        ...themedBg('accent'),
        ...themedText('surface'),
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
}
```

### Themed Card Component
```jsx
import { themedBg, themedText, themedBorder } from './ThemeContext';

function Card({ title, children }) {
  return (
    <div style={{
      ...themedBg('surface'),
      ...themedBorder(),
      borderWidth: '1px',
      borderStyle: 'solid',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <h3 style={themedText()}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}
```

## Troubleshooting

### Theme not updating
- Ensure component is wrapped with `<ThemeProvider>`
- Check that you're using `useTheme()` hook
- Verify CSS custom properties are being used

### Colors look wrong
- Check browser console for theme errors
- Verify color values are valid hex codes
- Test in both light and dark modes

### Custom theme not persisting
- Custom themes reset on page reload (add localStorage if needed)
- Use `updateCustomTheme()` not `setTheme()` for custom colors

## Future Enhancements

Potential additions to the theming system:
- LocalStorage persistence
- Theme import/export
- Animation transitions between themes
- High contrast mode
- Color blindness accommodations
- Per-window themes
