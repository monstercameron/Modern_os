import { useSyncExternalStore } from 'react';
import { subscribeFeeds, getFeedSnapshot } from './feeds.js';

const EMPTY = Object.freeze({ data: null, revision: 0, effect: 'none' });

/**
 * The live feed entry for one tile.
 *
 * Reads through useSyncExternalStore, so a tile re-renders when its own feed
 * moves and stays still when another one does. Tiles without a feed get a
 * frozen empty entry and never re-render at all.
 *
 * @param {string} appId
 * @returns {{data: object|null, revision: number, effect: string}}
 */
export function useTileFeed(appId) {
  return useSyncExternalStore(
    subscribeFeeds,
    () => getFeedSnapshot()[appId] || EMPTY,
    () => EMPTY,
  );
}

export default useTileFeed;
