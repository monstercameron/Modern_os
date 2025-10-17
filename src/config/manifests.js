/**
 * App Manifest System
 * Defines permissions, features, and capabilities for each app
 */

export const APP_MANIFESTS = {
  browser: {
    id: "browser",
    title: "Browser",
    permissions: {
      network: true,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: true,
      background: true,
      multiWindow: true,
    },
    capabilities: {
      maxInstances: 5,
      singleInstance: false,
    },
  },
  
  terminal: {
    id: "terminal",
    title: "Terminal",
    permissions: {
      network: true,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: true,
      multiWindow: true,
    },
    capabilities: {
      maxInstances: 10,
      singleInstance: false,
    },
  },
  
  settings: {
    id: "settings",
    title: "Settings",
    permissions: {
      network: false,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: false,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  text: {
    id: "text",
    title: "Text",
    permissions: {
      network: false,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: true,
      multiWindow: true,
    },
    capabilities: {
      maxInstances: 20,
      singleInstance: false,
    },
  },
  
  voice: {
    id: "voice",
    title: "Voice",
    permissions: {
      network: true,
      storage: true,
      location: false,
      camera: false,
      microphone: true,
    },
    features: {
      notifications: true,
      background: true,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  music: {
    id: "music",
    title: "Music",
    permissions: {
      network: true,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: true,
      background: true,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  video: {
    id: "video",
    title: "Video",
    permissions: {
      network: true,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: false,
      multiWindow: true,
    },
    capabilities: {
      maxInstances: 3,
      singleInstance: false,
    },
  },
  
  files: {
    id: "files",
    title: "Files",
    permissions: {
      network: false,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: false,
      multiWindow: true,
    },
    capabilities: {
      maxInstances: 5,
      singleInstance: false,
    },
  },
  
  messages: {
    id: "messages",
    title: "Messages",
    permissions: {
      network: true,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: true,
      background: true,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  email: {
    id: "email",
    title: "Email",
    permissions: {
      network: true,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: true,
      background: true,
      multiWindow: true,
    },
    capabilities: {
      maxInstances: 3,
      singleInstance: false,
    },
  },
  
  calendar: {
    id: "calendar",
    title: "Calendar",
    permissions: {
      network: true,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: true,
      background: true,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  notes: {
    id: "notes",
    title: "Notes",
    permissions: {
      network: false,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: true,
      multiWindow: true,
    },
    capabilities: {
      maxInstances: 10,
      singleInstance: false,
    },
  },
  
  tasks: {
    id: "tasks",
    title: "Tasks",
    permissions: {
      network: true,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: true,
      background: true,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  calculator: {
    id: "calculator",
    title: "Calculator",
    permissions: {
      network: false,
      storage: false,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: false,
      multiWindow: true,
    },
    capabilities: {
      maxInstances: 5,
      singleInstance: false,
    },
  },
  
  pdf: {
    id: "pdf",
    title: "PDF",
    permissions: {
      network: false,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: false,
      multiWindow: true,
    },
    capabilities: {
      maxInstances: 10,
      singleInstance: false,
    },
  },
  
  photos: {
    id: "photos",
    title: "Photos",
    permissions: {
      network: true,
      storage: true,
      location: true,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: false,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  camera: {
    id: "camera",
    title: "Camera",
    permissions: {
      network: false,
      storage: true,
      location: true,
      camera: true,
      microphone: true,
    },
    features: {
      notifications: false,
      background: false,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  recorder: {
    id: "recorder",
    title: "Recorder",
    permissions: {
      network: false,
      storage: true,
      location: false,
      camera: false,
      microphone: true,
    },
    features: {
      notifications: false,
      background: true,
      multiWindow: true,
    },
    capabilities: {
      maxInstances: 3,
      singleInstance: false,
    },
  },
  
  podcast: {
    id: "podcast",
    title: "Podcast",
    permissions: {
      network: true,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: true,
      background: true,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  activity: {
    id: "activity",
    title: "Activity",
    permissions: {
      network: false,
      storage: false,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: true,
      background: true,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  taskmgr: {
    id: "taskmgr",
    title: "Task Manager",
    permissions: {
      network: false,
      storage: false,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: true,
      background: true,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  disk: {
    id: "disk",
    title: "Disk",
    permissions: {
      network: false,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: false,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  weather: {
    id: "weather",
    title: "Weather",
    permissions: {
      network: true,
      storage: false,
      location: true,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: true,
      background: true,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  maps: {
    id: "maps",
    title: "Maps",
    permissions: {
      network: true,
      storage: true,
      location: true,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: false,
      multiWindow: true,
    },
    capabilities: {
      maxInstances: 3,
      singleInstance: false,
    },
  },
  
  chat: {
    id: "chat",
    title: "Chat",
    permissions: {
      network: true,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: true,
      background: true,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  videocall: {
    id: "videocall",
    title: "Video Call",
    permissions: {
      network: true,
      storage: false,
      location: false,
      camera: true,
      microphone: true,
    },
    features: {
      notifications: true,
      background: false,
      multiWindow: true,
    },
    capabilities: {
      maxInstances: 5,
      singleInstance: false,
    },
  },
  
  contacts: {
    id: "contacts",
    title: "Contacts",
    permissions: {
      network: true,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: false,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  code: {
    id: "code",
    title: "Code",
    permissions: {
      network: true,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: true,
      multiWindow: true,
    },
    capabilities: {
      maxInstances: 10,
      singleInstance: false,
    },
  },
  
  database: {
    id: "database",
    title: "Database",
    permissions: {
      network: true,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: true,
      multiWindow: true,
    },
    capabilities: {
      maxInstances: 5,
      singleInstance: false,
    },
  },
  
  drawing: {
    id: "drawing",
    title: "Drawing",
    permissions: {
      network: false,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: false,
      multiWindow: true,
    },
    capabilities: {
      maxInstances: 5,
      singleInstance: false,
    },
  },
  
  presentation: {
    id: "presentation",
    title: "Slides",
    permissions: {
      network: true,
      storage: true,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: false,
      multiWindow: true,
    },
    capabilities: {
      maxInstances: 3,
      singleInstance: false,
    },
  },
  
  clock: {
    id: "clock",
    title: "Clock",
    permissions: {
      network: true,
      storage: false,
      location: true,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: true,
      background: true,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  news: {
    id: "news",
    title: "News",
    permissions: {
      network: true,
      storage: true,
      location: true,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: true,
      background: true,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
  
  tileconfig: {
    id: "tileconfig",
    title: "Tile Configurator",
    permissions: {
      network: false,
      storage: false,
      location: false,
      camera: false,
      microphone: false,
    },
    features: {
      notifications: false,
      background: false,
      multiWindow: false,
    },
    capabilities: {
      maxInstances: 1,
      singleInstance: true,
    },
  },
};

/**
 * Get manifest for an app
 */
export function getManifest(appId) {
  return APP_MANIFESTS[appId] || null;
}

/**
 * Check if app has a specific permission
 */
export function hasPermission(appId, permission) {
  const manifest = getManifest(appId);
  return manifest?.permissions?.[permission] || false;
}

/**
 * Check if app has a specific feature
 */
export function hasFeature(appId, feature) {
  const manifest = getManifest(appId);
  return manifest?.features?.[feature] || false;
}

/**
 * Get capability value for an app
 */
export function getCapability(appId, capability) {
  const manifest = getManifest(appId);
  return manifest?.capabilities?.[capability];
}

/**
 * Check if app is single instance
 */
export function isSingleInstance(appId) {
  return getCapability(appId, 'singleInstance') === true;
}

/**
 * Get max instances allowed for an app
 */
export function getMaxInstances(appId) {
  return getCapability(appId, 'maxInstances') || 1;
}

/**
 * Mock permission request UI
 */
export function requestPermission(appId, permission) {
  const manifest = getManifest(appId);
  if (!manifest) {
    console.warn(`No manifest found for app: ${appId}`);
    return Promise.resolve(false);
  }
  
  // Mock permission dialog
  return new Promise((resolve) => {
    const granted = manifest.permissions[permission] || false;
    if (granted) {
      console.log(`✓ ${manifest.title} granted ${permission} permission`);
    } else {
      console.warn(`✗ ${manifest.title} denied ${permission} permission`);
    }
    setTimeout(() => resolve(granted), 100);
  });
}
