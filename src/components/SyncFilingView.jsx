'use client';

import { useState } from 'react';

export default function SyncFilingView({ onUpload, uploadResult, isLoading }) {
  const [recordCount, setRecordCount] = useState(100);

  const handleUpload = async (data) => {
    await onUpload(data);
  };

  // Display upload result
  if (uploadResult) {
    const isError = uploadResult.error || !uploadResult.success;
    
    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${
          isError ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{isError ? '❌' : '✅'}</span>
            <h3 className={`font-semibold ${isError ? 'text-red-800' : 'text-green-800'}`}>
              {isError ? 'Upload Failed' : 'Upload Successful'}
            </h3>
          </div>
          
          {isError ? (
            <div className="text-red-700">
              <p className="font-medium">Error: {uploadResult.error || 'Processing failed'}</p>
              {uploadResult.status === 504 && (
                <p className="text-sm mt-2">
                  ⚠️ This demonstrates the timeout issue with synchronous processing 
                  under load. The request exceeded Vercel's 10-second execution limit.
                </p>
              )}
              <p className="text-sm mt-2">
                ⏱️ Processing time: {uploadResult.duration || 'N/A'}ms
              </p>
            </div>
          ) : (
            <div className="text-green-700">
              <p>Successfully processed {uploadResult.processed || 0} records</p>
              <p className="text-sm mt-2">
                ⏱️ Processing time: {uploadResult.duration || 'N/A'}ms
              </p>
              {uploadResult.results && uploadResult.results.length > 0 && (
                <div className="mt-3 text-sm">
                  <p className="font-medium">Sample Results:</p>
                  <ul className="list-disc list-inside mt-1">
                    {uploadResult.results.slice(0, 3).map((result, idx) => (
                      <li key={idx}>Row {result.row}: {result.gstin} - {result.status}</li>
                    ))}
                    {uploadResult.results.length > 3 && <li>... and {uploadResult.results.length - 3} more</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            onUpload(null); // Reset
          }}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Upload Another File
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-xl">⚠️</span>
          <div>
            <h4 className="font-semibold text-yellow-800">Synchronous Processing Mode</h4>
            <p className="text-sm text-yellow-700 mt-1">
              This demonstrates the legacy approach where processing blocks the response. 
              Large files will timeout due to Vercel's 10-second execution limit.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Upload GST Filing (Sync)</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Number of Records
          </label>
          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={recordCount}
            onChange={(e) => setRecordCount(parseInt(e.target.value, 10))}
            id="sync-record-count"
          >
            <option value="50">50 records (5s processing)</option>
            <option value="100">100 records (10s processing) - Will Timeout</option>
            <option value="150">150 records (15s processing) - Will Timeout</option>
          </select>
        </div>

        <button
          onClick={() => {
            const mockRows = Array.from({ length: recordCount }, (_, i) => ({
              gstin: `27AABCU9603R1Z${(i % 10).toString()}`,
              amount: Math.floor(Math.random() * 100000),
              description: `Transaction ${i + 1}`,
              invoiceDate: new Date().toISOString()
            }));
            
            handleUpload({
              file: `sync_filing_${Date.now()}.json`,
              rows: mockRows,
              fileId: `file_${Date.now()}`
            });
          }}
          disabled={isLoading}
          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 font-medium"
        >
          {isLoading ? '⏳ Processing (This will timeout)...' : '📤 Upload for Sync Processing'}
        </button>

        <p className="text-xs text-gray-900 text-center mt-4">
          Note: Selecting 100+ records will demonstrate the 504 Gateway Timeout
        </p>
      </div>
    </div>
  );
}
