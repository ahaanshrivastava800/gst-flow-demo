import { NextRequest, NextResponse } from 'next/server';

// Deliberately blocking function to simulate timeout
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Simulate processing individual GST rows with delays
async function processGSTRows(rows, delayPerRow = 100) {
  const results = [];
  for (let i = 0; i < rows.length; i++) {
    // Simulate validation and processing time
    await sleep(delayPerRow);
    
    // Simulate occasional slower processing
    if (i % 10 === 0) {
      await sleep(delayPerRow * 2);
    }
    
    results.push({
      row: i + 1,
      gstin: rows[i].gstin,
      status: 'processed',
      timestamp: new Date().toISOString()
    });
  }
  return results;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { rows, fileId } = body;

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: 'Invalid payload: rows array required' },
        { status: 400 }
      );
    }

    // Validate GSTIN format
    const invalidRows = rows.filter(row => {
      const gstin = row.gstin;
      return !gstin || typeof gstin !== 'string' || gstin.length !== 15;
    });

    if (invalidRows.length > 0) {
      return NextResponse.json(
        { error: 'Invalid GSTIN format in some rows', invalidRows },
        { status: 400 }
      );
    }

    // Deliberately blocking processing - this will timeout on Vercel with large payloads
    // Using 100ms delay per row means 100 rows = 10 seconds (Vercel's default timeout)
    const results = await processGSTRows(rows, 100);

    return NextResponse.json({
      success: true,
      fileId,
      processed: results.length,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sync upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error during sync processing' },
      { status: 500 }
    );
  }
}

// This route is configured with maxDuration in vercel.json to force timeouts
