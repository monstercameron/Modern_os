/**
 * Event Bus - Pub/Sub System
 * 
 * Enables decoupled communication between apps and components.
 * Apps can publish events and subscribe to events from other apps.
 * 
 * Usage:
 *   import { subscribe, publish } from './utils/eventBus';
 * 
 *   // Subscribe to an event
 *   const unsubscribe = subscribe('media.play', (data) => {
 *     console.log('Music playing:', data);
 *   });
 * 
 *   // Publish an event
 *   publish('media.play', { track: 'Summer Vibes', artist: 'Artist Name' });
 * 
 *   // Cleanup (important in useEffect!)
 *   unsubscribe();
 */

import { debug, info } from './errorHandler.js';

// Event subscribers storage
// Structure: { 'topic': [callback1, callback2, ...] }
const subscribers = new Map();

// Event history for debugging (last 50 events)
const eventHistory = [];
const MAX_HISTORY = 50;

/**
 * Subscribe to an event topic
 * 
 * @param {string} topic - Event topic (e.g., 'media.play', 'window.focus')
 * @param {Function} callback - Function to call when event is published
 * @returns {Function} Unsubscribe function
 */
export function subscribe(topic, callback) {
  if (typeof topic !== 'string' || !topic) {
    throw new Error('Event topic must be a non-empty string');
  }
  
  if (typeof callback !== 'function') {
    throw new Error('Event callback must be a function');
  }

  // Get or create subscribers array for this topic
  if (!subscribers.has(topic)) {
    subscribers.set(topic, []);
  }

  const topicSubscribers = subscribers.get(topic);
  topicSubscribers.push(callback);

  debug(`Subscribed to '${topic}' (${topicSubscribers.length} total)`, 'EventBus');

  // Return unsubscribe function
  return () => {
    const index = topicSubscribers.indexOf(callback);
    if (index > -1) {
      topicSubscribers.splice(index, 1);
      debug(`Unsubscribed from '${topic}' (${topicSubscribers.length} remaining)`, 'EventBus');
    }
    
    // Clean up empty topic arrays
    if (topicSubscribers.length === 0) {
      subscribers.delete(topic);
    }
  };
}

/**
 * Publish an event to all subscribers
 * 
 * @param {string} topic - Event topic
 * @param {*} data - Event data (any type)
 */
export function publish(topic, data = null) {
  if (typeof topic !== 'string' || !topic) {
    throw new Error('Event topic must be a non-empty string');
  }

  const topicSubscribers = subscribers.get(topic);
  const subscriberCount = topicSubscribers ? topicSubscribers.length : 0;

  debug(`Publishing '${topic}' to ${subscriberCount} subscribers`, 'EventBus', data);

  // Add to history
  eventHistory.push({
    topic,
    data,
    timestamp: Date.now(),
    subscriberCount
  });
  
  // Keep history size manageable
  if (eventHistory.length > MAX_HISTORY) {
    eventHistory.shift();
  }

  // Call all subscribers
  if (topicSubscribers && topicSubscribers.length > 0) {
    topicSubscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for '${topic}':`, error);
      }
    });
  }
}

/**
 * Unsubscribe all callbacks for a topic
 * 
 * @param {string} topic - Event topic to clear
 */
export function unsubscribeAll(topic) {
  if (subscribers.has(topic)) {
    const count = subscribers.get(topic).length;
    subscribers.delete(topic);
    info(`Cleared all ${count} subscribers from '${topic}'`, 'EventBus');
  }
}

/**
 * Get list of all active topics
 * 
 * @returns {Array<string>} Array of topic names
 */
export function getTopics() {
  return Array.from(subscribers.keys());
}

/**
 * Get subscriber count for a topic
 * 
 * @param {string} topic - Event topic
 * @returns {number} Number of subscribers
 */
export function getSubscriberCount(topic) {
  const topicSubscribers = subscribers.get(topic);
  return topicSubscribers ? topicSubscribers.length : 0;
}

/**
 * Get event history (for debugging)
 * 
 * @param {number} limit - Max number of events to return
 * @returns {Array} Recent events
 */
export function getEventHistory(limit = 50) {
  return eventHistory.slice(-limit);
}

/**
 * Clear all subscribers (useful for testing)
 */
export function clearAllSubscribers() {
  const topicCount = subscribers.size;
  subscribers.clear();
  info(`Cleared all subscribers from ${topicCount} topics`, 'EventBus');
}

/**
 * Subscribe to multiple topics with the same callback
 * 
 * @param {Array<string>} topics - Array of topic names
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function that removes all subscriptions
 */
export function subscribeMultiple(topics, callback) {
  const unsubscribers = topics.map(topic => subscribe(topic, callback));
  
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
}

/**
 * Subscribe with a filter function
 * Only calls callback if filter returns true
 * 
 * @param {string} topic - Event topic
 * @param {Function} filter - Filter function (data) => boolean
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function subscribeFiltered(topic, filter, callback) {
  return subscribe(topic, (data) => {
    if (filter(data)) {
      callback(data);
    }
  });
}

/**
 * Subscribe once - automatically unsubscribes after first event
 * 
 * @param {string} topic - Event topic
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function subscribeOnce(topic, callback) {
  let unsubscribe;
  
  unsubscribe = subscribe(topic, (data) => {
    callback(data);
    unsubscribe();
  });
  
  return unsubscribe;
}

/**
 * Publish with delay
 * 
 * @param {string} topic - Event topic
 * @param {*} data - Event data
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Cancel function
 */
export function publishDelayed(topic, data, delay) {
  const timeoutId = setTimeout(() => {
    publish(topic, data);
  }, delay);
  
  return () => clearTimeout(timeoutId);
}

// Standard event topics (documentation)
export const TOPICS = {
  // Media events
  MEDIA_PLAY: 'media.play',
  MEDIA_PAUSE: 'media.pause',
  MEDIA_STOP: 'media.stop',
  MEDIA_NEXT: 'media.next',
  MEDIA_PREV: 'media.prev',
  MEDIA_SEEK: 'media.seek',
  MEDIA_VOLUME: 'media.volume',
  
  // Notification events
  NOTIFICATION_NEW: 'notification.new',
  NOTIFICATION_READ: 'notification.read',
  NOTIFICATION_CLEAR: 'notification.clear',
  NOTIFICATION_CLEAR_ALL: 'notification.clearAll',
  
  // Window events
  WINDOW_OPEN: 'window.open',
  WINDOW_CLOSE: 'window.close',
  WINDOW_FOCUS: 'window.focus',
  WINDOW_MINIMIZE: 'window.minimize',
  WINDOW_MAXIMIZE: 'window.maximize',
  WINDOW_RESTORE: 'window.restore',
  WINDOW_SNAP: 'window.snap',
  
  // Taskbar events
  TASKBAR_WINDOW_CLICK: 'taskbar.window.click',
  TASKBAR_WINDOW_ACTION: 'taskbar.window.action',
  
  // App events
  APP_LAUNCH: 'app.launch',
  APP_CLOSE: 'app.close',
  APP_ERROR: 'app.error',
  
  // System events
  SYSTEM_THEME_CHANGE: 'system.theme.change',
  SYSTEM_SETTINGS_CHANGE: 'system.settings.change',
  SYSTEM_LOW_BATTERY: 'system.battery.low',
  
  // User events
  USER_IDLE: 'user.idle',
  USER_ACTIVE: 'user.active',
};

// Export default
export default {
  subscribe,
  publish,
  unsubscribeAll,
  subscribeMultiple,
  subscribeFiltered,
  subscribeOnce,
  publishDelayed,
  getTopics,
  getSubscriberCount,
  getEventHistory,
  clearAllSubscribers,
  TOPICS,
};
