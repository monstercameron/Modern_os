# 🎨 Metro OS Theming System

A comprehensive, easy-to-use theming engine for the Metro OS desktop environment.

## ✨ Features

- **🌓 Light/Dark Mode** - One-click toggle between light and dark themes
- **🎨 Custom Themes** - Create and apply custom color schemes
- **🚀 Easy to Use** - Simple API with helpful utility functions
- **📦 Extensible** - Add new themes and presets easily
- **⚡ Real-time Updates** - Changes apply instantly across the entire desktop
- **🎯 Type-safe** - Proper error handling and validation
- **♿ Accessible** - Designed with contrast and readability in mind

## 🚀 Quick Start

### 1. Use the Theme Context

```jsx
import { useTheme } from './ThemeContext';

function MyComponent() {
  const { theme, toggleLightDark } = useTheme();
  
  return (
    <div style={{ backgroundColor: theme.background, color: theme.text }}>
      <button onClick={toggleLightDark}>Toggle Theme</button>
    </div>
  );
}
```

### 2. Use Helper Functions

```jsx
import { themedBg, themedText, themedBorder } from './ThemeContext';

function Card() {
  return (
    <div style={{
      ...themedBg('surface'),
      ...themedBorder(),
      padding: '16px',
      borderRadius: '8px'
    }}>
      <p style={themedText()}>Content</p>
    </div>
  );
}
```

### 3. Use CSS Variables

```jsx
<div style={{ 
  backgroundColor: 'var(--theme-surface)',
  color: 'var(--theme-text)' 
}}>
  Content
</div>
```

## 🎨 Theme Structure

Each theme has 5 core colors:

| Property | Purpose | Example |
|----------|---------|---------|
| `accent` | Primary brand color, buttons, highlights | `#0078d4` |
| `background` | Main desktop background | `#1a1a1a` |
| `surface` | Windows, panels, cards | `#2d2d30` |
| `text` | Primary text color | `#e0e0e0` |
| `border` | Borders, dividers, outlines | `#3e3e42` |

## 📚 API Reference

### Hook: `useTheme()`

Returns an object with:

```typescript
{
  // State
  currentTheme: 'light' | 'dark' | 'custom',
  theme: ThemeObject,
  isLight: boolean,
  isDark: boolean,
  isCustom: boolean,
  
  // Methods
  setTheme: (name: string) => void,
  toggleLightDark: () => void,
  updateCustomTheme: (updates: Partial<Theme>) => void,
  applyPreset: (preset: string | ThemeObject) => void,
  resetTheme: () => void,
  getColor: (key: string) => string,
  
  // All theme definitions
  themes: { light: Theme, dark: Theme }
}
```

### Utilities

```jsx
// Get CSS variable string
themeVar('accent') // 'var(--theme-accent)'

// Get style objects
themedBg('surface') // { backgroundColor: 'var(--theme-surface)' }
themedText() // { color: 'var(--theme-text)' }
themedBorder() // { borderColor: 'var(--theme-border)' }
```

## 🎯 Built-in Presets

- **Light** - Clean and professional
- **Dark** - Default dark theme (reduced eye strain)
- **Midnight Blue** - Deep blue tones
- **Purple Haze** - Rich purple aesthetic
- **Forest Green** - Natural green theme
- **Sunset Orange** - Warm orange palette

## 📖 Examples

See `src/ThemeExamples.jsx` for complete working examples including:
- Themed buttons
- Themed cards
- Theme indicators
- Input fields
- Navigation bars
- Complete showcase

## 📝 Documentation

For comprehensive documentation, see [THEMING_GUIDE.md](./THEMING_GUIDE.md)

## 🎓 Best Practices

1. ✅ **DO** use theme variables or helper functions
2. ✅ **DO** test components in both light and dark modes
3. ✅ **DO** maintain proper contrast ratios
4. ❌ **DON'T** hardcode colors in components
5. ❌ **DON'T** use inline colors without theme variables

## 🔧 Extending the System

### Add a New Theme

Edit `src/ThemeContext.jsx`:

```jsx
export const themes = {
  light: { /* ... */ },
  dark: { /* ... */ },
  yourTheme: {
    accent: '#ff5733',
    background: '#1a1a1a',
    surface: '#2d2d30',
    text: '#e0e0e0',
    border: '#3e3e42'
  }
};
```

### Add a New Preset

Edit `src/apps/SettingsApp.jsx` presets array:

```jsx
{
  name: "My Theme",
  colors: {
    accent: '#color1',
    background: '#color2',
    surface: '#color3',
    text: '#color4',
    border: '#color5'
  },
  description: "Theme description"
}
```

## 🐛 Troubleshooting

**Theme not updating?**
- Ensure component is inside `<ThemeProvider>`
- Use `useTheme()` hook
- Check browser console for errors

**Colors look wrong?**
- Verify color values are valid hex codes
- Test in both themes
- Check contrast ratios

## 🚀 Future Enhancements

- [ ] LocalStorage persistence
- [ ] Theme import/export (JSON)
- [ ] Smooth transitions between themes
- [ ] High contrast accessibility mode
- [ ] Color blindness accommodations
- [ ] Per-window theme overrides
- [ ] Theme preview before applying

## 📄 License

Part of the Metro OS project.
