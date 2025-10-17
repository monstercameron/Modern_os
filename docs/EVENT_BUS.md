# Event Bus (Pub/Sub System)

## Overview

The Event Bus provides a decoupled pub/sub communication system for Metro OS. Apps and components can publish events and subscribe to events without direct dependencies on each other.

## Core Concepts

### Publisher
A component that emits events when something happens.

### Subscriber
A component that listens for events and reacts to them.

### Topic
A string identifier for an event type (e.g., 'media.play', 'window.focus').

### Decoupling
Publishers and subscribers don't need to know about each other.

## Basic Usage

### Subscribe to Events

```javascript
import { subscribe } from './utils/eventBus';

function MyComponent() {
  useEffect(() => {
    // Subscribe to an event
    const unsubscribe = subscribe('media.play', (data) => {
      console.log('Music started:', data.track);
    });
    
    // Cleanup on unmount (IMPORTANT!)
    return () => unsubscribe();
  }, []);
}
```

### Publish Events

```javascript
import { publish } from './utils/eventBus';

function MusicPlayer() {
  const handlePlay = () => {
    // Publish an event
    publish('media.play', {
      track: 'Summer Vibes',
      artist: 'Artist Name',
      duration: 180
    });
  };
}
```

## Standard Topics

### Media Events

```javascript
import { TOPICS } from './utils/eventBus';

// Play/Pause/Stop
publish(TOPICS.MEDIA_PLAY, { track, artist, album, duration });
publish(TOPICS.MEDIA_PAUSE, { position });
publish(TOPICS.MEDIA_STOP);

// Navigation
publish(TOPICS.MEDIA_NEXT, { track });
publish(TOPICS.MEDIA_PREV, { track });

// Seek/Volume
publish(TOPICS.MEDIA_SEEK, { position }); // position in seconds
publish(TOPICS.MEDIA_VOLUME, { level }); // 0-100
```

### Notification Events

```javascript
// New notification
publish(TOPICS.NOTIFICATION_NEW, {
  id: '123',
  app: 'Email',
  title: 'New message',
  message: 'From: john@example.com',
  icon: '📧',
  timestamp: Date.now()
});

// Mark as read
publish(TOPICS.NOTIFICATION_READ, { id: '123' });

// Clear single notification
publish(TOPICS.NOTIFICATION_CLEAR, { id: '123' });

// Clear all notifications
publish(TOPICS.NOTIFICATION_CLEAR_ALL);
```

### Window Events

```javascript
// Window lifecycle
publish(TOPICS.WINDOW_OPEN, { windowId, appId });
publish(TOPICS.WINDOW_CLOSE, { windowId });
publish(TOPICS.WINDOW_FOCUS, { windowId });

// Window actions
publish(TOPICS.WINDOW_MINIMIZE, { windowId });
publish(TOPICS.WINDOW_MAXIMIZE, { windowId });
publish(TOPICS.WINDOW_RESTORE, { windowId });
publish(TOPICS.WINDOW_SNAP, { windowId, zone });
```

### App Events

```javascript
// App lifecycle
publish(TOPICS.APP_LAUNCH, { appId, windowId });
publish(TOPICS.APP_CLOSE, { appId, windowId });
publish(TOPICS.APP_ERROR, { appId, error });
```

### System Events

```javascript
// Theme changes
publish(TOPICS.SYSTEM_THEME_CHANGE, { theme: 'dark' });

// Settings changes
publish(TOPICS.SYSTEM_SETTINGS_CHANGE, { key, value });

// Battery status
publish(TOPICS.SYSTEM_LOW_BATTERY, { level: 15 });
```

### User Events

```javascript
// User activity
publish(TOPICS.USER_IDLE, { idleTime: 300 }); // seconds
publish(TOPICS.USER_ACTIVE);
```

## Advanced Usage

### Subscribe to Multiple Topics

```javascript
import { subscribeMultiple } from './utils/eventBus';

useEffect(() => {
  const unsubscribe = subscribeMultiple(
    ['media.play', 'media.pause', 'media.stop'],
    (data) => {
      console.log('Media state changed:', data);
    }
  );
  
  return () => unsubscribe();
}, []);
```

### Filtered Subscription

```javascript
import { subscribeFiltered } from './utils/eventBus';

useEffect(() => {
  // Only receive notifications from Email app
  const unsubscribe = subscribeFiltered(
    'notification.new',
    (data) => data.app === 'Email',
    (data) => {
      console.log('New email:', data);
    }
  );
  
  return () => unsubscribe();
}, []);
```

### Subscribe Once

```javascript
import { subscribeOnce } from './utils/eventBus';

useEffect(() => {
  // Only handle first event, then auto-unsubscribe
  const unsubscribe = subscribeOnce('app.launch', (data) => {
    console.log('First app launched:', data);
  });
  
  return () => unsubscribe();
}, []);
```

### Delayed Publish

```javascript
import { publishDelayed } from './utils/eventBus';

function showNotification() {
  // Publish after 2 seconds
  const cancel = publishDelayed(
    'notification.new',
    { title: 'Delayed notification' },
    2000
  );
  
  // Optionally cancel
  // cancel();
}
```

## React Integration Patterns

### Custom Hook

```javascript
import { useEffect } from 'react';
import { subscribe } from './utils/eventBus';

function useEventBus(topic, callback) {
  useEffect(() => {
    const unsubscribe = subscribe(topic, callback);
    return () => unsubscribe();
  }, [topic, callback]);
}

// Usage
function MyComponent() {
  useEventBus('media.play', (data) => {
    console.log('Playing:', data.track);
  });
}
```

### State Synchronization

```javascript
import { useState, useEffect } from 'react';
import { subscribe, publish } from './utils/eventBus';

function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    const unsubPlay = subscribe('media.play', () => setIsPlaying(true));
    const unsubPause = subscribe('media.pause', () => setIsPlaying(false));
    
    return () => {
      unsubPlay();
      unsubPause();
    };
  }, []);
  
  const togglePlay = () => {
    if (isPlaying) {
      publish('media.pause');
    } else {
      publish('media.play', { track: currentTrack });
    }
  };
}
```

### Cross-Component Communication

```javascript
// Component A: Publisher
function PlayButton() {
  return (
    <button onClick={() => publish('media.play', { track: 'Song 1' })}>
      Play
    </button>
  );
}

// Component B: Subscriber (anywhere in app)
function NowPlaying() {
  const [currentTrack, setCurrentTrack] = useState(null);
  
  useEffect(() => {
    return subscribe('media.play', (data) => {
      setCurrentTrack(data.track);
    });
  }, []);
  
  return <div>Now playing: {currentTrack}</div>;
}
```

## Real-World Examples

### Music App Publishing Events

```javascript
// MusicApp.jsx
import { publish, TOPICS } from './utils/eventBus';

function MusicApp() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const play = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    
    publish(TOPICS.MEDIA_PLAY, {
      track: track.name,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      artwork: track.artwork
    });
  };
  
  const pause = () => {
    setIsPlaying(false);
    
    publish(TOPICS.MEDIA_PAUSE, {
      position: audioRef.current.currentTime
    });
  };
  
  const next = () => {
    const nextTrack = playlist[currentIndex + 1];
    play(nextTrack);
    
    publish(TOPICS.MEDIA_NEXT, {
      track: nextTrack.name
    });
  };
}
```

### Notification Center Subscribing

```javascript
// NotificationCenter.jsx
import { subscribe, TOPICS } from './utils/eventBus';

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    // Subscribe to new notifications
    const unsubNew = subscribe(TOPICS.NOTIFICATION_NEW, (data) => {
      setNotifications(prev => [data, ...prev]);
      
      // Show system notification
      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: data.icon
        });
      }
    });
    
    // Subscribe to clear events
    const unsubClear = subscribe(TOPICS.NOTIFICATION_CLEAR, (data) => {
      setNotifications(prev => prev.filter(n => n.id !== data.id));
    });
    
    const unsubClearAll = subscribe(TOPICS.NOTIFICATION_CLEAR_ALL, () => {
      setNotifications([]);
    });
    
    return () => {
      unsubNew();
      unsubClear();
      unsubClearAll();
    };
  }, []);
}
```

### Window Manager Integration

```javascript
// useWindowManager.js
import { publish, TOPICS } from './utils/eventBus';

export function useWindowManager() {
  const openWindow = (app) => {
    const windowId = createWindow(app);
    
    publish(TOPICS.WINDOW_OPEN, {
      windowId,
      appId: app.id,
      title: app.title
    });
    
    publish(TOPICS.APP_LAUNCH, {
      appId: app.id,
      windowId
    });
  };
  
  const closeWindow = (windowId) => {
    const window = getWindow(windowId);
    
    publish(TOPICS.WINDOW_CLOSE, {
      windowId,
      appId: window.appId
    });
    
    destroyWindow(windowId);
  };
  
  const focusWindow = (windowId) => {
    setActiveWindow(windowId);
    
    publish(TOPICS.WINDOW_FOCUS, {
      windowId
    });
  };
}
```

### Media Controls Widget

```javascript
// MediaControls.jsx
import { subscribe, publish, TOPICS } from './utils/eventBus';

function MediaControls() {
  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    const unsubPlay = subscribe(TOPICS.MEDIA_PLAY, (data) => {
      setTrack(data);
      setIsPlaying(true);
    });
    
    const unsubPause = subscribe(TOPICS.MEDIA_PAUSE, () => {
      setIsPlaying(false);
    });
    
    return () => {
      unsubPlay();
      unsubPause();
    };
  }, []);
  
  if (!track) return null;
  
  return (
    <div className="media-controls">
      <img src={track.artwork} alt="Album art" />
      <div>
        <div>{track.track}</div>
        <div>{track.artist}</div>
      </div>
      <button onClick={() => publish(TOPICS.MEDIA_PREV)}>⏮️</button>
      <button onClick={() => publish(isPlaying ? TOPICS.MEDIA_PAUSE : TOPICS.MEDIA_PLAY)}>
        {isPlaying ? '⏸️' : '▶️'}
      </button>
      <button onClick={() => publish(TOPICS.MEDIA_NEXT)}>⏭️</button>
    </div>
  );
}
```

## Debugging

### View Active Topics

```javascript
import { getTopics, getSubscriberCount } from './utils/eventBus';

// Get all active topics
const topics = getTopics();
console.log('Active topics:', topics);

// Check subscriber count
const count = getSubscriberCount('media.play');
console.log('media.play has', count, 'subscribers');
```

### Event History

```javascript
import { getEventHistory } from './utils/eventBus';

// Get last 10 events
const recent = getEventHistory(10);
console.table(recent);

// Output:
// [
//   { topic: 'media.play', data: {...}, timestamp: 1697500800000, subscriberCount: 3 },
//   { topic: 'window.focus', data: {...}, timestamp: 1697500801000, subscriberCount: 1 },
//   ...
// ]
```

### Debug Panel Component

```javascript
function EventBusDebugPanel() {
  const [topics, setTopics] = useState([]);
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTopics(getTopics().map(topic => ({
        topic,
        count: getSubscriberCount(topic)
      })));
      setHistory(getEventHistory(20));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <h3>Active Topics</h3>
      <ul>
        {topics.map(t => (
          <li key={t.topic}>{t.topic} ({t.count} subscribers)</li>
        ))}
      </ul>
      
      <h3>Recent Events</h3>
      <ul>
        {history.map((e, i) => (
          <li key={i}>{e.topic} - {new Date(e.timestamp).toLocaleTimeString()}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Best Practices

### ✅ DO

1. **Always unsubscribe in cleanup:**
   ```javascript
   useEffect(() => {
     const unsub = subscribe('topic', callback);
     return () => unsub(); // ✅ Good
   }, []);
   ```

2. **Use constants for topics:**
   ```javascript
   import { TOPICS } from './utils/eventBus';
   publish(TOPICS.MEDIA_PLAY, data); // ✅ Typo-safe
   ```

3. **Keep event data serializable:**
   ```javascript
   publish('topic', { id: 1, name: 'Test' }); // ✅ Plain objects
   ```

4. **Document your events:**
   ```javascript
   /**
    * Fires when track finishes playing
    * @event media.ended
    * @property {string} track - Track name
    * @property {number} duration - Total duration
    */
   publish('media.ended', { track, duration });
   ```

### ❌ DON'T

1. **Don't forget to unsubscribe:**
   ```javascript
   useEffect(() => {
     subscribe('topic', callback);
     // ❌ Memory leak!
   }, []);
   ```

2. **Don't use magic strings:**
   ```javascript
   publish('mdeia.play', data); // ❌ Typo - will silently fail
   ```

3. **Don't pass non-serializable data:**
   ```javascript
   publish('topic', { func: () => {} }); // ❌ Functions won't work
   publish('topic', { elem: document.body }); // ❌ DOM nodes
   ```

4. **Don't create dependencies:**
   ```javascript
   // ❌ Don't do this - defeats the purpose
   import MusicApp from './MusicApp';
   publish('media.play', { musicApp: new MusicApp() });
   ```

## Performance Considerations

### Subscriber Count
- Each topic can have unlimited subscribers
- No performance impact up to ~100 subscribers per topic
- Consider consolidating if you have 1000+ subscribers

### Event Frequency
- Event bus handles 1000+ events/second easily
- No throttling needed for typical UI interactions
- Consider debouncing high-frequency events (scroll, mouse move)

### Memory Usage
- Stores last 50 events in history (~5KB)
- Each subscriber: ~100 bytes
- Total overhead: < 50KB for typical apps

## Testing

### Mock Event Bus

```javascript
import { clearAllSubscribers } from './utils/eventBus';

beforeEach(() => {
  clearAllSubscribers();
});

test('component responds to events', () => {
  render(<MyComponent />);
  
  publish('test.event', { value: 42 });
  
  expect(screen.getByText('42')).toBeInTheDocument();
});
```

### Test Events Published

```javascript
test('button publishes event', () => {
  const handler = jest.fn();
  const unsub = subscribe('button.click', handler);
  
  render(<MyButton />);
  fireEvent.click(screen.getByRole('button'));
  
  expect(handler).toHaveBeenCalledWith({ count: 1 });
  
  unsub();
});
```

## Migration Guide

### Before (Direct Coupling)

```javascript
// MusicApp.jsx
import { NotificationCenter } from './NotificationCenter';

function MusicApp({ notificationCenter }) {
  const play = () => {
    // ❌ Tightly coupled
    notificationCenter.show('Now playing: Song 1');
  };
}
```

### After (Event Bus)

```javascript
// MusicApp.jsx
import { publish } from './utils/eventBus';

function MusicApp() {
  const play = () => {
    // ✅ Decoupled
    publish('media.play', { track: 'Song 1' });
  };
}

// NotificationCenter.jsx
import { subscribe } from './utils/eventBus';

function NotificationCenter() {
  useEffect(() => {
    return subscribe('media.play', (data) => {
      show(`Now playing: ${data.track}`);
    });
  }, []);
}
```

## Related Documentation

- [ERROR_HANDLING.md](./ERROR_HANDLING.md) - Error logging
- [SPRING_ANIMATIONS.md](./SPRING_ANIMATIONS.md) - Animation system
- [SETTINGS_IMPLEMENTATION.md](./SETTINGS_IMPLEMENTATION.md) - Settings system
