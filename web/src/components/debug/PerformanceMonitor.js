import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import styles from './PerformanceMonitor.module.css';

/**
 * PerformanceMonitor - Real-time performance metrics overlay
 *
 * Tracks:
 * - Image load times and sizes
 * - Memory usage (heap size)
 * - FPS (frames per second)
 * - Network requests
 * - DOM node count
 * - Total bandwidth consumed
 *
 * Usage:
 * <PerformanceMonitor projectUuid={projectUuid} enabled={true} />
 */
const PerformanceMonitor = ({ projectUuid, enabled = false }) => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memoryUsed: 0,
    memoryLimit: 0,
    domNodes: 0,
    imageCount: 0,
    totalImageSize: 0,
    avgImageSize: 0,
    largestImage: null,
    loadTime: 0,
    networkRequests: 0,
    activeImages: []
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const imageObserverRef = useRef(null);
  const networkObserverRef = useRef(null);

  // FPS Calculation
  useEffect(() => {
    if (!enabled) return;

    let frameId;
    const calculateFPS = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      const delta = currentTime - lastTimeRef.current;

      if (delta >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / delta);
        setMetrics(prev => ({ ...prev, fps }));
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      frameId = requestAnimationFrame(calculateFPS);
    };

    frameId = requestAnimationFrame(calculateFPS);
    return () => cancelAnimationFrame(frameId);
  }, [enabled]);

  // Memory & DOM Monitoring
  useEffect(() => {
    if (!enabled) return;

    const updateSystemMetrics = () => {
      // Memory API (Chrome only)
      if (performance.memory) {
        const memoryUsed = Math.round(performance.memory.usedJSHeapSize / 1048576); // MB
        const memoryLimit = Math.round(performance.memory.jsHeapSizeLimit / 1048576); // MB
        setMetrics(prev => ({ ...prev, memoryUsed, memoryLimit }));
      }

      // DOM node count
      const domNodes = document.getElementsByTagName('*').length;
      setMetrics(prev => ({ ...prev, domNodes }));
    };

    const interval = setInterval(updateSystemMetrics, 1000);
    updateSystemMetrics(); // Initial call
    return () => clearInterval(interval);
  }, [enabled]);

  // Image Performance Tracking
  useEffect(() => {
    if (!enabled) return;

    const trackedImages = new Map();
    let totalSize = 0;
    let largestImage = null;
    let largestSize = 0;

    // Intercept image loads via PerformanceObserver
    const imageObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        if (entry.initiatorType === 'img' || entry.initiatorType === 'image') {
          const size = entry.transferSize || entry.encodedBodySize || 0;
          const loadTime = entry.responseEnd - entry.requestStart;

          if (!trackedImages.has(entry.name)) {
            trackedImages.set(entry.name, {
              url: entry.name,
              size,
              loadTime: Math.round(loadTime),
              timestamp: Date.now()
            });

            totalSize += size;

            if (size > largestSize) {
              largestSize = size;
              largestImage = {
                url: entry.name.split('/').pop(),
                size: formatBytes(size),
                loadTime: Math.round(loadTime)
              };
            }
          }
        }
      });

      // Update metrics
      const avgSize = trackedImages.size > 0 ? totalSize / trackedImages.size : 0;
      setMetrics(prev => ({
        ...prev,
        imageCount: trackedImages.size,
        totalImageSize: totalSize,
        avgImageSize: avgSize,
        largestImage,
        activeImages: Array.from(trackedImages.values()).slice(-10) // Last 10
      }));
    });

    try {
      imageObserver.observe({
        entryTypes: ['resource'],
        buffered: true // Get historical entries too
      });
      imageObserverRef.current = imageObserver;
    } catch (err) {
      console.warn('PerformanceObserver not supported:', err);
    }

    return () => {
      if (imageObserverRef.current) {
        imageObserverRef.current.disconnect();
      }
    };
  }, [enabled, projectUuid]);

  // Network Request Tracking
  useEffect(() => {
    if (!enabled) return;

    const networkObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const networkCount = entries.filter(e =>
        e.initiatorType === 'fetch' || e.initiatorType === 'xmlhttprequest'
      ).length;

      setMetrics(prev => ({ ...prev, networkRequests: prev.networkRequests + networkCount }));
    });

    try {
      networkObserver.observe({ entryTypes: ['resource'] });
      networkObserverRef.current = networkObserver;
    } catch (err) {
      console.warn('Network observer failed:', err);
    }

    return () => {
      if (networkObserverRef.current) {
        networkObserverRef.current.disconnect();
      }
    };
  }, [enabled]);

  // Export Performance Report
  const exportReport = useCallback(() => {
    const report = {
      projectUuid,
      timestamp: new Date().toISOString(),
      metrics: {
        ...metrics,
        activeImages: metrics.activeImages.map(img => ({
          url: img.url,
          size: formatBytes(img.size),
          loadTime: `${img.loadTime}ms`
        }))
      },
      browser: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${projectUuid}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics, projectUuid]);

  // Copy to Clipboard
  const copyMetrics = useCallback(() => {
    const text = `
Performance Metrics (Project: ${projectUuid})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FPS: ${metrics.fps}
Memory: ${metrics.memoryUsed} MB / ${metrics.memoryLimit} MB (${Math.round((metrics.memoryUsed / metrics.memoryLimit) * 100)}%)
DOM Nodes: ${metrics.domNodes}
Images Loaded: ${metrics.imageCount}
Total Bandwidth: ${formatBytes(metrics.totalImageSize)}
Avg Image Size: ${formatBytes(metrics.avgImageSize)}
${metrics.largestImage ? `Largest Image: ${metrics.largestImage.url} (${metrics.largestImage.size}, ${metrics.largestImage.loadTime}ms)` : ''}
Network Requests: ${metrics.networkRequests}
    `.trim();

    navigator.clipboard.writeText(text);
    toast.success('Metrics copied to clipboard!', {
      position: 'top-center',
      autoClose: 2000,
    });
  }, [metrics, projectUuid]);

  if (!enabled) return null;

  return (
    <div className={`${styles.monitor} ${isExpanded ? styles.expanded : ''}`}>
      {/* Compact Header */}
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.title}>
          ⚡ Performance Monitor
          <span className={styles.projectBadge}>{projectUuid.slice(0, 8)}</span>
        </div>
        <div className={styles.quickStats}>
          <span className={`${styles.stat} ${metrics.fps < 30 ? styles.warning : metrics.fps < 50 ? styles.caution : ''}`}>
            {metrics.fps} FPS
          </span>
          <span className={`${styles.stat} ${metrics.memoryUsed > 500 ? styles.warning : ''}`}>
            {metrics.memoryUsed} MB
          </span>
          <span className={styles.stat}>
            {metrics.imageCount} imgs
          </span>
        </div>
        <button className={styles.expandBtn}>
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className={styles.details}>
          {/* System Metrics */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>System</h4>
            <div className={styles.metric}>
              <span className={styles.label}>FPS:</span>
              <span className={`${styles.value} ${metrics.fps < 30 ? styles.critical : metrics.fps < 50 ? styles.warning : styles.good}`}>
                {metrics.fps}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.label}>Memory:</span>
              <span className={styles.value}>
                {metrics.memoryUsed} MB / {metrics.memoryLimit} MB
                <div className={styles.progressBar}>
                  <div
                    className={`${styles.progressFill} ${metrics.memoryUsed / metrics.memoryLimit > 0.8 ? styles.critical : ''}`}
                    style={{ width: `${(metrics.memoryUsed / metrics.memoryLimit) * 100}%` }}
                  />
                </div>
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.label}>DOM Nodes:</span>
              <span className={styles.value}>{metrics.domNodes}</span>
            </div>
          </div>

          {/* Image Metrics */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Images</h4>
            <div className={styles.metric}>
              <span className={styles.label}>Total Count:</span>
              <span className={styles.value}>{metrics.imageCount}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.label}>Total Size:</span>
              <span className={`${styles.value} ${metrics.totalImageSize > 50 * 1048576 ? styles.warning : ''}`}>
                {formatBytes(metrics.totalImageSize)}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.label}>Avg Size:</span>
              <span className={`${styles.value} ${metrics.avgImageSize > 2 * 1048576 ? styles.warning : ''}`}>
                {formatBytes(metrics.avgImageSize)}
              </span>
            </div>
            {metrics.largestImage && (
              <div className={styles.metric}>
                <span className={styles.label}>Largest:</span>
                <span className={`${styles.value} ${styles.small}`}>
                  {metrics.largestImage.url}
                  <br />
                  <span className={styles.highlight}>{metrics.largestImage.size}</span>
                  {' '}
                  ({metrics.largestImage.loadTime}ms)
                </span>
              </div>
            )}
          </div>

          {/* Network Metrics */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Network</h4>
            <div className={styles.metric}>
              <span className={styles.label}>Requests:</span>
              <span className={styles.value}>{metrics.networkRequests}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.label}>Bandwidth:</span>
              <span className={styles.value}>{formatBytes(metrics.totalImageSize)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button className={styles.actionBtn} onClick={copyMetrics}>
              📋 Copy Metrics
            </button>
            <button className={styles.actionBtn} onClick={exportReport}>
              💾 Export JSON
            </button>
          </div>

          {/* Recent Images */}
          {metrics.activeImages.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Recent Images (Last 10)</h4>
              <div className={styles.imageList}>
                {metrics.activeImages.slice().reverse().map((img, idx) => (
                  <div key={idx} className={styles.imageItem}>
                    <span className={styles.imageName} title={img.url}>
                      {img.url.split('/').pop().slice(0, 30)}...
                    </span>
                    <span className={`${styles.imageSize} ${img.size > 2 * 1048576 ? styles.warning : ''}`}>
                      {formatBytes(img.size)}
                    </span>
                    <span className={styles.imageTime}>
                      {img.loadTime}ms
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper: Format bytes to human-readable
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default PerformanceMonitor;
