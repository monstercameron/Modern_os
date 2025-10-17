# Splash Screen API

The Splash Screen component provides various loading animations and styles for app initialization.

## Usage

```jsx
import { SplashScreen } from './components/SplashScreen.jsx';

<SplashScreen
  title="My App"
  icon={MyIcon}
  color="bg-blue-600"
  type="logo"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | The app title to display |
| `icon` | `React.Component` | - | The app icon component (e.g., Lucide icon) |
| `color` | `string` | `'bg-slate-700'` | Tailwind CSS background color class |
| `type` | `string` | `'logo'` | The splash screen style |

## Types

### `logo` (default)
- Animated icon and title
- Spring animation for smooth entrance

### `spinner`
- Rotating spinner with loading text
- Continuous rotation animation

### `loader`
- Icon with progress bar
- Linear progress animation

### `terminal`
- Terminal-style loading with green text
- Blinking "Initializing..." text

### `minimal`
- Simple icon with pulsing text
- Subtle opacity animation

## Examples

### Logo Splash
```jsx
<SplashScreen
  title="Calculator"
  icon={Calculator}
  type="logo"
/>
```

### Spinner Splash
```jsx
<SplashScreen
  title="Loading Data"
  icon={Database}
  type="spinner"
  color="bg-green-600"
/>
```

### Terminal Splash
```jsx
<SplashScreen
  title="Terminal App"
  icon={Terminal}
  type="terminal"
  color="bg-black"
/>
```

## Integration

The splash screen is automatically shown when opening apps and hidden after a minimum of 100ms. The type can be customized per app in the app configuration.