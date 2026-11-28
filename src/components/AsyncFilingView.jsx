'use client';

import { useState, useEffect, useRef } from 'react';

export default function AsyncFilingView({ onUpload, uploadResult, isLoading }) {
  const [jobStatus, setJobStatus] = useState(null);
  const [polling, setPolling] = useState(false);
  const [recordCount, setRecordCount] = useState(100);
  const pollTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (uploadResult && uploadResult.jobId) {
      setJobStatus({
        jobId: uploadResult.jobId,
        status: 'queued',
        progress: 0
      });
      startPolling(uploadResult.jobId);
    }
  }, [uploadResult]);

  const startPolling = (jobId) => {
    setPolling(true);
    pollJobStatus(jobId);
  };

  const pollJobStatus = async (jobId) => {
    if (!isMountedRef.current) return;

    try {
      const response = await fetch(`/api/async/status?jobId=${encodeURIComponent(jobId)}`);
      const data = await response.json();

      if (!isMountedRef.current) return;

      if (data.success && data.job) {
        setJobStatus(data.job);

        if (data.job.status === 'queued' || data.job.status === 'processing') {
          pollTimerRef.current = setTimeout(() => pollJobStatus(jobId), 1000);
        } else {
          setPolling(false);
        }
      } else {
        console.error('Polling failed:', data);
        setPolling(false);
      }
    } catch (error) {
      console.error('Polling error:', error);
      if (isMountedRef.current) {
        setPolling(false);
      }
    }
  };

  const handleUpload = async (data) => {
    console.log('AsyncFilingView handleUpload called with:', data);
    setJobStatus(null);
    await onUpload(data);
  };

  const getProgressColor = () => {
    if (!jobStatus) return 'bg-gray-200';
    if (jobStatus.status === 'completed') return 'bg-green-500';
    if (jobStatus.status === 'failed') return 'bg-red-500';
    return 'bg-indigo-500';
  };

  const getStatusIcon = () => {
    if (!jobStatus) return '📤';
    switch (jobStatus.status) {
      case 'queued': return '⏳';
      case 'processing': return '⚙️';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '📤';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-xl">🚀</span>
          <div>
            <h4 className="font-semibold text-green-800">Asynchronous Processing Mode</h4>
            <p className="text-sm text-green-700 mt-1">
              This demonstrates the modern approach where uploads return immediately 
              with a job ID. Processing happens in the background with real-time status updates.
            </p>
          </div>
        </div>
      </div>

      {!jobStatus ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Upload GST Filing (Async)</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Number of Records
            </label>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-slate-900 bg-white"
              value={recordCount}
              onChange={(e) => setRecordCount(parseInt(e.target.value, 10))}
              id="async-record-count"
            >
              <option value="50">50 records</option>
              <option value="100">100 records</option>
              <option value="200">200 records</option>
              <option value="500">500 records</option>
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
                file: `async_filing_${Date.now()}.json`,
                rows: mockRows,
                fileId: `file_${Date.now()}`
              });
            }}
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 font-medium"
          >
            {isLoading ? '⏳ Uploading...' : '📤 Upload for Async Processing'}
          </button>

          <p className="text-xs text-slate-700 text-center mt-4">
            Upload returns immediately with job ID. Processing happens in background.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {getStatusIcon()} Job Status
            </h3>
            <span className="text-sm text-gray-900">
              ID: {(jobStatus.jobId || jobStatus.id)?.slice(0, 16)}...
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-900">Status:</span>
                <span className={`ml-2 font-medium ${
                  jobStatus.status === 'completed' ? 'text-green-600' :
                  jobStatus.status === 'failed' ? 'text-red-600' :
                  'text-indigo-600'
                }`}>
                  {jobStatus.status?.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-gray-900">Progress:</span>
                <span className="ml-2 font-medium">{jobStatus.progress || 0}%</span>
              </div>
              <div>
                <span className="text-gray-900">Total Records:</span>
                <span className="ml-2 font-medium">{jobStatus.totalRows || 0}</span>
              </div>
              <div>
                <span className="text-gray-900">Processed:</span>
                <span className="ml-2 font-medium">{jobStatus.processedRows || 0}</span>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${jobStatus.progress || 0}%` }}
              />
            </div>

            {polling && (
              <div className="flex items-center gap-2 text-sm text-gray-900">
                <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent" />
                <span>Processing in background...</span>
              </div>
            )}

            {jobStatus.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">✅ Processing Complete!</p>
                <p className="text-sm text-green-600 mt-1">
                  Successfully processed {jobStatus.processedRows} records
                </p>
                {jobStatus.results && jobStatus.results.length > 0 ? (
                  <div className="mt-3 text-sm">
                    <p className="font-medium text-green-800">Sample Results:</p>
                    <ul className="list-disc list-inside mt-1 text-green-700">
                      {jobStatus.results.slice(0, 3).map((result, idx) => (
                        <li key={idx}>Row {result.row}: {result.gstin} - {result.status}</li>
                      ))}
                      {jobStatus.results.length > 3 && <li>... and {jobStatus.results.length - 3} more</li>}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-green-600">
                    <p>Processing completed successfully. Results are available in the system.</p>
                  </div>
                )}
              </div>
            )}

            {jobStatus.status === 'failed' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">❌ Processing Failed</p>
                <p className="text-sm text-red-600 mt-1">
                  {jobStatus.error || 'Unknown error occurred'}
                </p>
              </div>
            )}

            {!polling && (
              <button
                onClick={() => {
                  setJobStatus(null);
                  onUpload(null);
                }}
                className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Upload Another File
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
