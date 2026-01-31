// src/utils/batchApiUtils.ts
// Utility functions for optimized batch API operations

// Performance polyfill for React Native
const performance = {
  now: () => Date.now(),
  mark: (name: string) => {},
  measure: (name: string, startMark: string, endMark: string) => {}
};

/**
 * Configuration for batch processing
 */
export interface BatchConfig {
  batchSize?: number;      // Number of items per batch (default: 10)
  maxConcurrency?: number;  // Max parallel requests (default: 5)
  retryAttempts?: number;   // Number of retry attempts (default: 2)
  retryDelay?: number;      // Delay between retries in ms (default: 1000)
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Process items in batches with concurrency control
 */
export async function processBatches<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  config: BatchConfig = {}
): Promise<R[]> {
  const {
    batchSize = 10,
    maxConcurrency = 5,
    retryAttempts = 2,
    retryDelay = 1000,
    onProgress
  } = config;

  const results: R[] = [];
  const totalItems = items.length;
  let processedCount = 0;

  // Split items into batches
  const batches: T[][] = [];
  for (let i = 0; i < totalItems; i += batchSize) {
    batches.push(items.slice(i, Math.min(i + batchSize, totalItems)));
  }

  // Process batches with concurrency control
  for (let i = 0; i < batches.length; i += maxConcurrency) {
    const concurrentBatches = batches.slice(i, i + maxConcurrency);
    
    const batchPromises = concurrentBatches.map(batch =>
      Promise.all(
        batch.map(async (item) => {
          let lastError: any;
          
          // Retry logic
          for (let attempt = 0; attempt <= retryAttempts; attempt++) {
            try {
              const result = await processor(item);
              processedCount++;
              
              if (onProgress) {
                const progress = Math.round((processedCount / totalItems) * 100);
                onProgress(progress, `Processing ${processedCount}/${totalItems}`);
              }
              
              return result;
            } catch (error) {
              lastError = error;
              
              if (attempt < retryAttempts) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
              }
            }
          }
          
          // If all retries failed, return null or throw
          console.warn('[BatchAPI] Failed after retries:', lastError);
          throw lastError;
        })
      )
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.flat());
  }

  return results;
}

/**
 * Batch multiple API requests with intelligent grouping
 */
export async function batchApiRequests<T extends { id: string }>(
  ids: string[],
  batchFetcher: (ids: string[]) => Promise<T[]>,
  config: { maxBatchSize?: number } = {}
): Promise<Map<string, T>> {
  const { maxBatchSize = 50 } = config;
  const resultMap = new Map<string, T>();

  // Split IDs into chunks
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += maxBatchSize) {
    chunks.push(ids.slice(i, i + maxBatchSize));
  }

  // Fetch each chunk
  const chunkPromises = chunks.map(chunk => batchFetcher(chunk));
  const chunkResults = await Promise.all(chunkPromises);

  // Combine results into map
  chunkResults.flat().forEach(item => {
    resultMap.set(item.id, item);
  });

  return resultMap;
}

/**
 * Request deduplication cache
 */
class RequestCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private pending = new Map<string, Promise<any>>();
  private ttl: number;

  constructor(ttlMs: number = 60000) { // Default 1 minute TTL
    this.ttl = ttlMs;
  }

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    forceRefresh = false
  ): Promise<T> {
    // Check if request is already pending
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    // Check cache
    if (!forceRefresh) {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < this.ttl) {
        return cached.data;
      }
    }

    // Make request
    const promise = fetcher().then(
      data => {
        this.cache.set(key, { data, timestamp: Date.now() });
        this.pending.delete(key);
        return data;
      },
      error => {
        this.pending.delete(key);
        throw error;
      }
    );

    this.pending.set(key, promise);
    return promise;
  }

  clear(pattern?: string) {
    if (pattern) {
      // Clear entries matching pattern
      const keys = Array.from(this.cache.keys());
      for (const key of keys) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  size() {
    return this.cache.size;
  }
}

export const apiCache = new RequestCache();

/**
 * Performance monitoring wrapper
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = performance.now();
    const startMark = `${name}_start_${Date.now()}`;
    const endMark = `${name}_end_${Date.now()}`;
    
    performance.mark(startMark);
    
    try {
      const result = await fn(...args);
      
      performance.mark(endMark);
      performance.measure(name, startMark, endMark);
      
      const duration = performance.now() - startTime;
      console.debug(`[Performance] ${name} took ${Math.round(duration)}ms`);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[Performance] ${name} failed after ${Math.round(duration)}ms:`, error);
      throw error;
    }
  }) as T;
}

/**
 * Throttle concurrent requests
 */
export class ConcurrencyLimiter {
  private queue: (() => Promise<void>)[] = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        this.running++;
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      };

      if (this.running < this.maxConcurrent) {
        task();
      } else {
        this.queue.push(task);
      }
    });
  }

  private processQueue() {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const task = this.queue.shift();
      if (task) task();
    }
  }
}

/**
 * Progressive loader for large datasets
 */
export class ProgressiveLoader<T> {
  private items: T[] = [];
  private pageSize: number;
  private currentPage = 0;

  constructor(items: T[], pageSize = 20) {
    this.items = items;
    this.pageSize = pageSize;
  }

  hasMore(): boolean {
    return this.currentPage * this.pageSize < this.items.length;
  }

  getNext(): T[] {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.currentPage++;
    return this.items.slice(start, end);
  }

  reset() {
    this.currentPage = 0;
  }

  getAll(): T[] {
    return this.items;
  }
}