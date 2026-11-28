import { NextRequest, NextResponse } from 'next/server';

// Generate mock GST data
function generateMockGSTRows(count) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      gstin: `27AABCU9603R1Z${(i % 10).toString()}`,
      amount: Math.floor(Math.random() * 100000),
      description: `Transaction ${i + 1}`,
      invoiceDate: new Date().toISOString()
    });
  }
  return rows;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      concurrentRequests = 50, 
      target = 'async', // 'sync' or 'async'
      rowsPerRequest = 100 
    } = body;

    if (concurrentRequests < 1 || concurrentRequests > 100) {
      return NextResponse.json(
        { error: 'concurrentRequests must be between 1 and 100' },
        { status: 400 }
      );
    }

    const baseUrl = request.nextUrl?.origin
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const targetUrl = target === 'sync' 
      ? `${baseUrl}/api/sync/upload`
      : `${baseUrl}/api/async/upload`;

    console.log(`Starting load test: ${concurrentRequests} requests to ${targetUrl}`);

    // Generate all requests
    const requests = Array.from({ length: concurrentRequests }, async (_, index) => {
      const mockData = {
        rows: generateMockGSTRows(rowsPerRequest),
        fileId: `load_test_${Date.now()}_${index}`,
        metadata: {
          source: 'load_simulator',
          testRun: Date.now(),
          requestIndex: index
        }
      };

      try {
        const startTime = Date.now();
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockData)
        });
        const endTime = Date.now();
        
        const responseData = await response.json().catch(() => ({}));
        
        return {
          index,
          status: response.status,
          success: response.ok,
          duration: endTime - startTime,
          data: responseData,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          index,
          status: 0,
          success: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Network error',
          timestamp: new Date().toISOString()
        };
      }
    });

    // Execute all requests concurrently
    const results = await Promise.allSettled(requests);

    // Analyze results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const queued = results.filter(r => r.status === 'fulfilled' && r.value.status === 202).length;
    const timeouts = results.filter(r => r.status === 'fulfilled' && r.value.status === 504).length;
    const errors = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
    
    const fulfilledResults = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    const avgDuration = fulfilledResults.length > 0
      ? Math.round(fulfilledResults.reduce((sum, r) => sum + r.duration, 0) / fulfilledResults.length)
      : 0;

    const minDuration = fulfilledResults.length > 0
      ? Math.min(...fulfilledResults.map(r => r.duration))
      : 0;

    const maxDuration = fulfilledResults.length > 0
      ? Math.max(...fulfilledResults.map(r => r.duration))
      : 0;

    return NextResponse.json({
      success: true,
      summary: {
        totalRequests: concurrentRequests,
        successful,
        queued,
        timeouts,
        errors,
        avgDuration,
        minDuration,
        maxDuration,
        target,
        rowsPerRequest
      },
      results: fulfilledResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Load simulation error:', error);
    return NextResponse.json(
      { error: 'Internal server error during load simulation' },
      { status: 500 }
    );
  }
}
