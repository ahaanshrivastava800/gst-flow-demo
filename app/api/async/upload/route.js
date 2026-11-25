import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Generate unique job ID
function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  // Validate GSTIN format in rows
  for (let i = 0; i < Math.min(payload.rows.length, 5); i++) { // Check first 5 rows for quick validation
    const row = payload.rows[i];
    if (!row.gstin || typeof row.gstin !== 'string' || row.gstin.length !== 15) {
      return { valid: false, error: `Invalid GSTIN format in row ${i + 1}` };
    }
  }

  return { valid: true };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { rows, fileId, metadata } = body;

    console.log('Async upload received:', { rows: rows.length, fileId });

    // Tier-1 validation
    const validation = validateGSTPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate job ID
    const jobId = generateJobId();
    console.log('Generated job ID:', jobId);

    // Store job data in Redis
    const jobData = {
      id: jobId,
      fileId: fileId || `file_${Date.now()}`,
      status: 'queued',
      totalRows: rows.length,
      processedRows: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: metadata || {},
      results: [],
      error: null
    };

    // Check if Redis is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.log('Redis not configured, using demo mode');
      // For demo purposes, store in memory and simulate processing
      global.demoJobs = global.demoJobs || {};
      global.demoJobs[jobId] = jobData;
      
      // Simulate background processing
      setTimeout(async () => {
        console.log('Starting demo processing for job:', jobId);
        const results = [];
        for (let i = 0; i < rows.length; i++) {
          if (global.demoJobs[jobId]) {
            global.demoJobs[jobId].processedRows = i + 1;
            global.demoJobs[jobId].progress = Math.round(((i + 1) / rows.length) * 100);
            global.demoJobs[jobId].status = 'processing';
            
            if ((i + 1) % 10 === 0) {
              console.log(`Job ${jobId} progress: ${i + 1}/${rows.length}`);
            }
          }
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing
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
          console.log('Job completed:', jobId);
        }
      }, 100);
    } else {
      // Store job in Redis with 24 hour expiration
      await redis.set(`job:${jobId}`, JSON.stringify(jobData), { ex: 86400 });
      
      // Add to queue
      await redis.lpush('gst:queue', jobId);

      // Trigger background processing without waiting
      // Using fetch to trigger the background worker
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      
      // Fire and forget - don't await this
      fetch(`${baseUrl}/api/async/process-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      }).catch(err => console.error('Failed to trigger background job:', err));
    }

    // Return immediately with 202 Accepted
    console.log('Returning 202 with job ID:', jobId);
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
