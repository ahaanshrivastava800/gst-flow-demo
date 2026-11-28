import { NextResponse } from 'next/server';
import { getRedisClient } from '../../../../src/lib/redis';

// Generate unique job ID (encodes creation time and row count for stateless demo fallback)
function generateJobId(totalRows) {
  return `job_${Date.now()}_${totalRows}_${Math.random().toString(36).slice(2, 11)}`;
}

// Tier-1 validation
function validateGSTPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid payload structure' };
  }

  if (!payload.rows || !Array.isArray(payload.rows)) {
    return { valid: false, error: 'rows array is required' };
  }

  if (payload.rows.length === 0) {
    return { valid: false, error: 'rows array cannot be empty' };
  }

  // Validate GSTIN format in rows (check first 5 rows for quick validation)
  for (let i = 0; i < Math.min(payload.rows.length, 5); i++) {
    const row = payload.rows[i];
    if (!row || !row.gstin || typeof row.gstin !== 'string' || row.gstin.length !== 15) {
      return { valid: false, error: `Invalid GSTIN format in row ${i + 1}` };
    }
  }

  return { valid: true };
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Tier-1 validation before reading payload properties
    const validation = validateGSTPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { rows, fileId, metadata } = body;
    console.log('Async upload received:', { rows: rows.length, fileId });

    const jobId = generateJobId(rows.length);

    const jobData = {
      id: jobId,
      fileId: fileId || `file_${Date.now()}`,
      status: 'queued',
      totalRows: rows.length,
      processedRows: 0,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: metadata || {},
      results: [],
      error: null
    };

    const redis = getRedisClient();

    if (!redis) {
      console.log('Redis not configured, using demo mode');
      global.demoJobs = global.demoJobs || {};
      global.demoJobs[jobId] = jobData;

      // Simulate background processing for local/single-instance mode
      setTimeout(async () => {
        for (let i = 0; i < rows.length; i++) {
          if (global.demoJobs[jobId]) {
            global.demoJobs[jobId].processedRows = i + 1;
            global.demoJobs[jobId].progress = Math.round(((i + 1) / rows.length) * 100);
            global.demoJobs[jobId].status = 'processing';
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (global.demoJobs[jobId]) {
          global.demoJobs[jobId].status = 'completed';
          global.demoJobs[jobId].progress = 100;
          global.demoJobs[jobId].processedRows = rows.length;
          global.demoJobs[jobId].results = rows.map((row, i) => ({
            row: i + 1,
            gstin: row.gstin,
            status: 'processed',
            timestamp: new Date().toISOString()
          }));
        }
      }, 100);
    } else {
      // Store job in Redis with 24 hour expiration
      await redis.set(`job:${jobId}`, JSON.stringify(jobData), { ex: 86400 });

      // Add to queue
      await redis.lpush('gst:queue', jobId);

      // Trigger background processing without blocking the 202 response
      const baseUrl = request.nextUrl?.origin
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

      fetch(`${baseUrl}/api/async/process-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      }).catch(err => console.error('Failed to trigger background job:', err));
    }

    return NextResponse.json({
      success: true,
      jobId,
      status: 'queued',
      message: 'GST filing queued for processing',
      estimatedTime: `${Math.ceil(rows.length / 10)} seconds`
    }, { status: 202 });

  } catch (error) {
    console.error('Async upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error during async upload' },
      { status: 500 }
    );
  }
}
