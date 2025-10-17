# App Manifest System Guide

## Overview
The manifest system provides a standardized way to define app permissions, features, and capabilities. Each app has a manifest that controls its behavior and resource access.

## Manifest Structure

```javascript
{
  id: "app-id",
  title: "App Title",
  permissions: {
    network: boolean,      // Can make network requests
    storage: boolean,      // Can access local storage
    location: boolean,     // Can access location data
    camera: boolean,       // Can access camera
    microphone: boolean,   // Can access microphone
  },
  features: {
    notifications: boolean,  // Can show notifications
    background: boolean,     // Can run in background
    multiWindow: boolean,    // Supports multiple windows
  },
  capabilities: {
    maxInstances: number,    // Max number of windows allowed
    singleInstance: boolean, // Only one window allowed
  },
}
```

## Usage Examples

### Check if app has permission
```javascript
import { hasPermission } from './config/manifests.js';

if (hasPermission('camera', 'camera')) {
  // Access camera
}
```

### Check if app is single instance
```javascript
import { isSingleInstance } from './config/manifests.js';

if (isSingleInstance('settings')) {
  // Settings can only have one window
}
```

### Get max instances
```javascript
import { getMaxInstances } from './config/manifests.js';

const max = getMaxInstances('browser'); // Returns 5
```

### Request permission
```javascript
import { requestPermission } from './config/manifests.js';

const granted = await requestPermission('camera', 'camera');
if (granted) {
  // Permission granted
}
```

## Multi-Window Behavior

The window manager now automatically enforces manifest rules:

### Single Instance Apps
- Settings, Music, Calendar, Messages, etc.
- Only one window can be open at a time
- Opening again will focus the existing window
- If minimized, it will be restored

### Multi-Window Apps
- Browser (max 5), Terminal (max 10), Text (max 20), etc.
- Multiple windows can be open simultaneously
- Respects maxInstances limit
- Each window gets an instance counter

## App Categories

### Single Instance
- Settings, Music, Voice, Photos, Camera, Podcast, Activity, Disk, Weather, Calendar, Messages, Tasks, Chat, Contacts, Clock, News

### Multi-Window (Limited)
- Browser (5), Terminal (10), Text (20), Video (3), Files (5), Email (3), Notes (10), Calculator (5), PDF (10), Maps (3), Video Call (5), Code (10), Database (5), Drawing (5), Presentation (3), Recorder (3)

## Testing

Try opening multiple instances of apps:
1. Click Terminal multiple times - should open multiple windows ✓
2. Click Settings multiple times - should focus existing window ✓
3. Open 6 Browsers - 6th should fail with warning ✓

## Future Enhancements
- Permission request UI dialogs
- Runtime permission checks in apps
- Manifest validation on app registration
- Permission analytics/auditing
