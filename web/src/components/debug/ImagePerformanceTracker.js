/**
 * ImagePerformanceTracker - Detailed image performance logging
 *
 * Tracks and logs:
 * - Individual image load times
 * - Image file sizes
 * - Cumulative bandwidth
 * - Load failures
 * - Browser cache hits vs network fetches
 */

class ImagePerformanceTracker {
  constructor() {
    this.images = new Map();
    this.totalBytes = 0;
    this.totalLoadTime = 0;
    this.failedLoads = [];
    this.startTime = Date.now();
  }

  /**
   * Track image load start
   */
  trackLoadStart(url) {
    this.images.set(url, {
      url,
      startTime: performance.now(),
      endTime: null,
      size: 0,
      cached: false,
      failed: false
    });
  }

  /**
   * Track image load complete
   */
  trackLoadComplete(url, size = 0, cached = false) {
    const img = this.images.get(url);
    if (!img) return;

    img.endTime = performance.now();
    img.size = size;
    img.cached = cached;
    img.loadTime = img.endTime - img.startTime;

    this.totalBytes += size;
    this.totalLoadTime += img.loadTime;

    // Log to console (grouped by project)
    console.group(`📸 Image Loaded: ${this.getFileName(url)}`);
    console.log('URL:', url);
    console.log('Size:', this.formatBytes(size));
    console.log('Load Time:', `${Math.round(img.loadTime)}ms`);
    console.log('Cached:', cached ? 'YES ✅' : 'NO (Network fetch)');
    if (size > 2 * 1024 * 1024) {
      console.warn('⚠️  Large image detected (>2MB)');
    }
    if (img.loadTime > 1000) {
      console.warn('⚠️  Slow load time (>1s)');
    }
    console.groupEnd();

    this.images.set(url, img);
  }

  /**
   * Track image load failure
   */
  trackLoadFailed(url, error) {
    const img = this.images.get(url);
    if (img) {
      img.failed = true;
      img.error = error;
    }

    this.failedLoads.push({ url, error, timestamp: Date.now() });

    console.error(`❌ Image Load Failed: ${this.getFileName(url)}`, error);
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const images = Array.from(this.images.values()).filter(img => !img.failed);
    const successful = images.length;
    const failed = this.failedLoads.length;
    const avgSize = successful > 0 ? this.totalBytes / successful : 0;
    const avgLoadTime = successful > 0 ? this.totalLoadTime / successful : 0;
    const largestImage = images.reduce((max, img) =>
      img.size > max.size ? img : max,
      { size: 0, url: '' }
    );
    const slowestImage = images.reduce((max, img) =>
      img.loadTime > max.loadTime ? img : max,
      { loadTime: 0, url: '' }
    );
    const cachedCount = images.filter(img => img.cached).length;
    const cacheHitRate = successful > 0 ? (cachedCount / successful) * 100 : 0;
    const totalTime = Date.now() - this.startTime;

    return {
      successful,
      failed,
      totalBytes: this.totalBytes,
      avgSize,
      avgLoadTime,
      largestImage,
      slowestImage,
      cachedCount,
      cacheHitRate,
      totalTime
    };
  }

  /**
   * Print detailed summary to console
   */
  printSummary() {
    const summary = this.getSummary();

    console.group('📊 IMAGE PERFORMANCE SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Images Loaded: ${summary.successful}`);
    console.log(`Failed Loads: ${summary.failed}`);
    console.log(`Total Bandwidth: ${this.formatBytes(summary.totalBytes)}`);
    console.log(`Avg Image Size: ${this.formatBytes(summary.avgSize)}`);
    console.log(`Avg Load Time: ${Math.round(summary.avgLoadTime)}ms`);
    console.log(`Cache Hit Rate: ${Math.round(summary.cacheHitRate)}%`);
    console.log(`Total Tracking Time: ${Math.round(summary.totalTime / 1000)}s`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (summary.largestImage.size > 0) {
      console.log(`🔴 Largest Image: ${this.getFileName(summary.largestImage.url)} (${this.formatBytes(summary.largestImage.size)})`);
    }

    if (summary.slowestImage.loadTime > 0) {
      console.log(`⏱️  Slowest Image: ${this.getFileName(summary.slowestImage.url)} (${Math.round(summary.slowestImage.loadTime)}ms)`);
    }

    if (summary.totalBytes > 50 * 1024 * 1024) {
      console.warn('⚠️  HIGH BANDWIDTH USAGE: >50MB total');
    }

    if (summary.avgSize > 2 * 1024 * 1024) {
      console.warn('⚠️  LARGE AVERAGE IMAGE SIZE: >2MB');
    }

    if (summary.avgLoadTime > 500) {
      console.warn('⚠️  SLOW AVERAGE LOAD TIME: >500ms');
    }

    if (this.failedLoads.length > 0) {
      console.group('❌ Failed Loads:');
      this.failedLoads.forEach(fail => {
        console.error(`- ${this.getFileName(fail.url)}: ${fail.error}`);
      });
      console.groupEnd();
    }

    console.groupEnd();

    return summary;
  }

  /**
   * Export summary as JSON
   */
  exportJSON() {
    const summary = this.getSummary();
    const images = Array.from(this.images.values()).map(img => ({
      url: img.url,
      size: img.size,
      sizeFormatted: this.formatBytes(img.size),
      loadTime: Math.round(img.loadTime),
      cached: img.cached,
      failed: img.failed
    }));

    return {
      summary: {
        ...summary,
        totalBytesFormatted: this.formatBytes(summary.totalBytes),
        avgSizeFormatted: this.formatBytes(summary.avgSize),
        avgLoadTimeFormatted: `${Math.round(summary.avgLoadTime)}ms`,
        largestImageFormatted: `${this.getFileName(summary.largestImage.url)} (${this.formatBytes(summary.largestImage.size)})`,
        slowestImageFormatted: `${this.getFileName(summary.slowestImage.url)} (${Math.round(summary.slowestImage.loadTime)}ms)`
      },
      images,
      failedLoads: this.failedLoads,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset tracker
   */
  reset() {
    this.images.clear();
    this.totalBytes = 0;
    this.totalLoadTime = 0;
    this.failedLoads = [];
    this.startTime = Date.now();
    console.log('🔄 Image Performance Tracker Reset');
  }

  /**
   * Helper: Get filename from URL
   */
  getFileName(url) {
    try {
      return url.split('/').pop().split('?')[0];
    } catch {
      return url;
    }
  }

  /**
   * Helper: Format bytes to human-readable
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

// Global singleton instance
const globalTracker = new ImagePerformanceTracker();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.imagePerformanceTracker = globalTracker;
}

export default globalTracker;
