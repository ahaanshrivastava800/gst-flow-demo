import { NextResponse } from 'next/server';
import { getRedisClient } from '../../../../src/lib/redis';

// Simulate processing delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Process individual GST row
async function processRow(row, index) {
  await sleep(100); // 100ms per row

  // Simulate occasional complex validation
  if (index % 10 === 0) {
    await sleep(200);
  }

  return {
    row: index + 1,
    gstin: row.gstin,
    status: 'processed',
    timestamp: new Date().toISOString()
  };
}

// Update job progress in Redis
async function updateJobProgress(redis, jobId, updates) {
  const currentJob = await redis.get(`job:${jobId}`);
  if (!currentJob) return null;

  const jobData = typeof currentJob === 'string' ? JSON.parse(currentJob) : currentJob;
  const updatedJob = { ...jobData, ...updates, updatedAt: new Date().toISOString() };

  await redis.set(`job:${jobId}`, JSON.stringify(updatedJob), { ex: 86400 });
  return updatedJob;
}

export async function POST(request) {
  let jobId;
  const redis = getRedisClient();

  try {
    if (!redis) {
      return NextResponse.json(
        { error: 'Redis is not configured; background worker unavailable in demo mode' },
        { status: 503 }
      );
    }

    const body = await request.json();
    jobId = body?.jobId;

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      );
    }

    // Get job data from Redis
    const jobData = await redis.get(`job:${jobId}`);
    if (!jobData) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const job = typeof jobData === 'string' ? JSON.parse(jobData) : jobData;

    // Check if job is already processed
    if (job.status === 'completed' || job.status === 'failed') {
      return NextResponse.json({
        success: true,
        message: 'Job already processed',
        job
      });
    }

    // Update status to processing
    await updateJobProgress(redis, jobId, { status: 'processing' });

    const totalRows = job.totalRows || 100;
    const results = [];

    // Process rows incrementally
    for (let i = 0; i < totalRows; i++) {
      const mockRow = {
        gstin: `27AABCU9603R1Z${(i % 10).toString()}`,
        amount: Math.floor(Math.random() * 100000),
        description: `Transaction ${i + 1}`
      };

      const result = await processRow(mockRow, i);
      results.push(result);

      // Update progress every 10 rows
      if ((i + 1) % 10 === 0) {
        await updateJobProgress(redis, jobId, {
          processedRows: i + 1,
          status: 'processing',
          progress: Math.round(((i + 1) / totalRows) * 100)
        });
      }
    }

    // Mark job as completed
    const finalJob = await updateJobProgress(redis, jobId, {
      status: 'completed',
      processedRows: totalRows,
      progress: 100,
      results,
      completedAt: new Date().toISOString()
    });

    // Remove from queue
    await redis.lrem('gst:queue', 0, jobId);

    return NextResponse.json({
      success: true,
      message: 'Job completed successfully',
      job: finalJob
    });

  } catch (error) {
    console.error('Process job error:', error);

    if (redis && jobId) {
      try {
        await updateJobProgress(redis, jobId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (updateError) {
        console.error('Failed to update job status:', updateError);
      }
    }

    return NextResponse.json(
      { error: 'Internal server error during job processing' },
      { status: 500 }
    );
  }
}
