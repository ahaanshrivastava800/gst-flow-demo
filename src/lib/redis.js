import { Redis } from '@upstash/redis';

let redisClient = null;

/**
 * Returns true if valid Upstash Redis credentials are configured.
 */
export function isRedisConfigured() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return Boolean(
    url &&
      token &&
      url !== 'https://your-redis-url.upstash.io' &&
      token !== 'your-redis-token-here'
  );
}

/**
 * Lazily initializes and returns the Upstash Redis client, or null if unconfigured.
 * Avoids module-level instantiation warnings during `next build`.
 */
export function getRedisClient() {
  if (!isRedisConfigured()) {
    return null;
  }
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisClient;
}

/**
 * Computes a deterministic simulated job state for demo mode (when Redis is not configured),
 * so status polling works reliably even across stateless serverless instances on Vercel.
 * Job ID format: job_<timestamp>_<totalRows>_<random>
 */
export function getDemoJobFallback(jobId) {
  if (global.demoJobs && global.demoJobs[jobId]) {
    return global.demoJobs[jobId];
  }

  const match = /^job_(\d+)_(\d+)_/.exec(jobId);
  if (!match) {
    return null;
  }

  const createdMs = parseInt(match[1], 10);
  const totalRows = Math.max(1, parseInt(match[2], 10));
  const elapsedMs = Math.max(0, Date.now() - createdMs);
  // Simulate ~100ms per row
  const processedRows = Math.min(totalRows, Math.floor(elapsedMs / 100));
  const progress = Math.round((processedRows / totalRows) * 100);
  const isComplete = processedRows >= totalRows;

  return {
    id: jobId,
    fileId: `demo_file_${createdMs}`,
    status: isComplete ? 'completed' : processedRows > 0 ? 'processing' : 'queued',
    totalRows,
    processedRows,
    progress,
    createdAt: new Date(createdMs).toISOString(),
    updatedAt: new Date().toISOString(),
    results: isComplete
      ? Array.from({ length: Math.min(totalRows, 10) }, (_, i) => ({
          row: i + 1,
          gstin: `27AABCU9603R1Z${(i % 10).toString()}`,
          status: 'processed',
          timestamp: new Date().toISOString(),
        }))
      : [],
    error: null,
  };
}
