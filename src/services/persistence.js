/**
 * Persistence Service
 *
 * The only module that touches localStorage. One namespaced, versioned blob so
 * desktop state cannot drift across two competing keys the way tile sizes and
 * settings previously did.
 */

const NAMESPACE = 'modernos';
const VERSION = 1;

const memoryFallback = new Map();

function storage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    // Touch it — private-mode browsers throw on access rather than on read.
    localStorage.getItem(`${NAMESPACE}:probe`);
    return localStorage;
  } catch {
    return null;
  }
}

const keyFor = (slice) => `${NAMESPACE}:v${VERSION}:${slice}`;

/** Read a slice, falling back to `fallback` when absent or unparseable. */
export function read(slice, fallback = null) {
  const store = storage();
  if (!store) return memoryFallback.has(slice) ? memoryFallback.get(slice) : fallback;
  try {
    const raw = store.getItem(keyFor(slice));
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Write a slice. Silently degrades to memory when storage is unavailable. */
export function write(slice, value) {
  memoryFallback.set(slice, value);
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(keyFor(slice), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(slice) {
  memoryFallback.delete(slice);
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(keyFor(slice));
  } catch {
    /* nothing to do */
  }
}

/**
 * Fold the pre-kernel storage keys into the namespaced schema, once.
 * Old keys are left in place so a rollback still finds them.
 */
export function migrateLegacyKeys() {
  const store = storage();
  if (!store) return;
  if (read('migrated', false)) return;

  try {
    const legacyTiles = store.getItem('tileSizes');
    if (legacyTiles && read('tileSizes', null) === null) {
      write('tileSizes', JSON.parse(legacyTiles));
    }
  } catch {
    /* a corrupt legacy value is not worth failing boot over */
  }

  try {
    const legacySettings = store.getItem('metro_os_settings');
    if (legacySettings && read('settings', null) === null) {
      write('settings', JSON.parse(legacySettings));
    }
  } catch {
    /* same */
  }

  write('migrated', true);
}

export default { read, write, remove, migrateLegacyKeys };
