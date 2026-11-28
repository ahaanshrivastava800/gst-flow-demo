import { NextResponse } from 'next/server';
import { getRedisClient, getDemoJobFallback } from '../../../../src/lib/redis';

export const dynamic = 'force-dynamic';

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

    const redis = getRedisClient();

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
              const jobData = redis
                ? await redis.get(`job:${jobId}`)
                : getDemoJobFallback(jobId);

              if (!jobData) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Job not found' })}\n\n`));
                break;
              }

              const job = typeof jobData === 'string' ? JSON.parse(jobData) : jobData;

              // Only send if status changed
              if (JSON.stringify(job) !== JSON.stringify(lastStatus)) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(job)}\n\n`));
                lastStatus = job;

                if (job.status === 'completed' || job.status === 'failed') {
                  break;
                }
              }

              await new Promise(resolve => setTimeout(resolve, 1000));
              iterations++;
            }

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
    const jobData = redis
      ? await redis.get(`job:${jobId}`)
      : getDemoJobFallback(jobId);

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
