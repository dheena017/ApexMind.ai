/**
 * ApexMind Studio - Client-Side Media Cache Engine
 *
 * Utilizes the browser's CacheStorage API + local ObjectURLs (blob:) to eliminate
 * network latency, prevent buffering stutter, and enable silky-smooth 60fps scrubbing
 * and transition previews for AI-generated and stock videos.
 */

const CACHE_NAME = 'apexmind-media-cache-v1';
const MAX_MEMORY_BLOBS = 40; // Max blob URLs kept in memory simultaneously

interface MemoryCacheEntry {
  blobUrl: string;
  size: number;
  lastAccessed: number;
}

class MediaCacheService {
  private memoryCache = new Map<string, MemoryCacheEntry>();
  private pendingFetches = new Map<string, Promise<string>>();
  private isCacheStorageSupported = typeof window !== 'undefined' && 'caches' in window;

  /**
   * Resolves a media URL to a local zero-latency blob URL if cached,
   * or fetches & stores it in CacheStorage in the background.
   */
  public async getCachedMediaUrl(remoteUrl: string): Promise<string> {
    if (!remoteUrl || typeof remoteUrl !== 'string') return '';
    
    // Already a local blob or data URL
    if (remoteUrl.startsWith('blob:') || remoteUrl.startsWith('data:')) {
      return remoteUrl;
    }

    // 1. Check in-memory active Blob URL (fastest: 0ms synchronous)
    const mem = this.memoryCache.get(remoteUrl);
    if (mem) {
      mem.lastAccessed = Date.now();
      return mem.blobUrl;
    }

    // 2. Check if this exact URL is already being fetched to prevent duplicate network requests
    if (this.pendingFetches.has(remoteUrl)) {
      return this.pendingFetches.get(remoteUrl)!;
    }

    // 3. Initiate cached fetch
    const fetchPromise = this.resolveAndCache(remoteUrl);
    this.pendingFetches.set(remoteUrl, fetchPromise);

    try {
      const result = await fetchPromise;
      return result;
    } finally {
      this.pendingFetches.delete(remoteUrl);
    }
  }

  /**
   * Internal worker: searches CacheStorage, or fetches via CORS and caches
   */
  private async resolveAndCache(remoteUrl: string): Promise<string> {
    if (!this.isCacheStorageSupported) {
      return remoteUrl;
    }

    try {
      const cache = await caches.open(CACHE_NAME);

      // Check CacheStorage
      const cachedResponse = await cache.match(remoteUrl);
      if (cachedResponse && cachedResponse.ok) {
        const blob = await cachedResponse.blob();
        return this.storeInBlobMemory(remoteUrl, blob);
      }

      // Fetch from network with CORS
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const response = await fetch(remoteUrl, {
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return remoteUrl;
      }

      // Clone response before saving to CacheStorage (body can only be read once)
      const responseToCache = response.clone();
      cache.put(remoteUrl, responseToCache).catch((err) => {
        console.warn('[MediaCache] Cache put error (non-fatal):', err);
      });

      const blob = await response.blob();
      const blobUrl = this.storeInBlobMemory(remoteUrl, blob);

      // Notify workspace of newly cached asset
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('workspace:media-cached', {
            detail: { url: remoteUrl, blobUrl, size: blob.size },
          })
        );
      }

      return blobUrl;
    } catch (err) {
      // Graceful fallback to original network URL if CORS or offline
      return remoteUrl;
    }
  }

  /**
   * Stores a blob in memory, manages LRU eviction, and returns the ObjectURL
   */
  private storeInBlobMemory(url: string, blob: Blob): string {
    // If existing, return it
    const existing = this.memoryCache.get(url);
    if (existing) {
      existing.lastAccessed = Date.now();
      return existing.blobUrl;
    }

    // Evict oldest if memory cache exceeds limit
    if (this.memoryCache.size >= MAX_MEMORY_BLOBS) {
      this.evictOldestMemoryBlob();
    }

    const blobUrl = URL.createObjectURL(blob);
    this.memoryCache.set(url, {
      blobUrl,
      size: blob.size,
      lastAccessed: Date.now(),
    });

    return blobUrl;
  }

  /**
   * Evicts the least recently used in-memory blob URL to prevent RAM leaks
   */
  private evictOldestMemoryBlob() {
    let oldestUrl: string | null = null;
    let oldestTime = Infinity;

    for (const [url, entry] of this.memoryCache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestUrl = url;
      }
    }

    if (oldestUrl) {
      const entry = this.memoryCache.get(oldestUrl);
      if (entry) {
        try {
          URL.revokeObjectURL(entry.blobUrl);
        } catch {}
        this.memoryCache.delete(oldestUrl);
      }
    }
  }

  /**
   * Proactively pre-fetches and caches multiple media URLs in the background
   * during browser idle periods.
   */
  public preloadMedia(urls: (string | undefined | null)[]): void {
    if (!this.isCacheStorageSupported || !Array.isArray(urls)) return;

    const validUrls = Array.from(
      new Set(
        urls.filter(
          (u): u is string =>
            Boolean(u) &&
            typeof u === 'string' &&
            u.startsWith('http') &&
            !this.memoryCache.has(u)
        )
      )
    );

    if (validUrls.length === 0) return;

    // Use requestIdleCallback if supported, else light setTimeout
    const schedule = typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? (cb: () => void) => (window as any).requestIdleCallback(cb, { timeout: 3000 })
      : (cb: () => void) => setTimeout(cb, 100);

    schedule(async () => {
      // Process sequentially with gentle delay to avoid saturating user's connection
      for (const url of validUrls) {
        try {
          await this.getCachedMediaUrl(url);
          // 40ms pause between downloads
          await new Promise((r) => setTimeout(r, 40));
        } catch {}
      }
    });
  }

  /**
   * Checks whether a URL is currently available in the cache without initiating a fetch
   */
  public async isCached(url: string): Promise<boolean> {
    if (!url) return false;
    if (this.memoryCache.has(url)) return true;
    if (!this.isCacheStorageSupported) return false;

    try {
      const cache = await caches.open(CACHE_NAME);
      const match = await cache.match(url);
      return Boolean(match);
    } catch {
      return false;
    }
  }

  /**
   * Clears all in-memory and persistent CacheStorage video assets
   */
  public async clearCache(): Promise<void> {
    // Revoke all memory object URLs
    for (const entry of this.memoryCache.values()) {
      try {
        URL.revokeObjectURL(entry.blobUrl);
      } catch {}
    }
    this.memoryCache.clear();
    this.pendingFetches.clear();

    // Delete CacheStorage bucket
    if (this.isCacheStorageSupported) {
      try {
        await caches.delete(CACHE_NAME);
      } catch {}
    }
  }
}

export const mediaCacheService = new MediaCacheService();
export default mediaCacheService;

