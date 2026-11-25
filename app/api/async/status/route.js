import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    const format = searchParams.get('format') || 'json'; // 'json' or 'sse'

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      );
    }

    // Check if Redis is configured
    const isRedisConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

    // Handle Server-Sent Events
    if (format === 'sse') {
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let lastStatus = null;
            let iterations = 0;
            const maxIterations = 60; // 60 seconds max
            
            while (iterations < maxIterations) {
              let jobData;
              
              if (isRedisConfigured) {
                jobData = await redis.get(`job:${jobId}`);
              } else {
                // Demo mode
                jobData = global.demoJobs ? global.demoJobs[jobId] : null;
              }
              
              if (!jobData) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Job not found' })}\n\n`));
                break;
              }
              
              const job = typeof jobData === 'string' ? JSON.parse(jobData) : jobData;
              
              // Only send if status changed
              if (JSON.stringify(job) !== JSON.stringify(lastStatus)) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(job)}\n\n`));
                lastStatus = job;
                
                // Stop if job is complete
                if (job.status === 'completed' || job.status === 'failed') {
                  break;
                }
              }
              
              // Wait 1 second before next check
              await new Promise(resolve => setTimeout(resolve, 1000));
              iterations++;
            }
            
            // Send final close event
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'close' })}\n\n`));
            controller.close();
          } catch (error) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle regular JSON response
    let jobData;
    
    if (isRedisConfigured) {
      jobData = await redis.get(`job:${jobId}`);
    } else {
      // Demo mode
      jobData = global.demoJobs ? global.demoJobs[jobId] : null;
    }
    
    if (!jobData) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const job = typeof jobData === 'string' ? JSON.parse(jobData) : jobData;

    return NextResponse.json({
      success: true,
      job
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error during status check' },
      { status: 500 }
    );
  }
}
