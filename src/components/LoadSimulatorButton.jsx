'use client';

import { useState } from 'react';

export default function LoadSimulatorButton({ mode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [config, setConfig] = useState({
    concurrentRequests: 50,
    rowsPerRequest: 100
  });

  const runLoadTest = async () => {
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/simulate/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          target: mode // 'sync' or 'async'
        })
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Load test error:', error);
      setResults({ error: 'Failed to run load test' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        Load Simulator 
        <span className={`ml-2 text-sm font-normal px-2 py-1 rounded ${
          mode === 'sync' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {mode === 'sync' ? '❌ Testing Sync' : '✅ Testing Async'}
        </span>
      </h3>
      
      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Concurrent Requests: {config.concurrentRequests}
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={config.concurrentRequests}
            onChange={(e) => setConfig({ ...config, concurrentRequests: parseInt(e.target.value) })}
            className="w-full"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-gray-900">
            <span>1</span>
            <span>100</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Rows per Request: {config.rowsPerRequest}
          </label>
          <input
            type="range"
            min="10"
            max="200"
            value={config.rowsPerRequest}
            onChange={(e) => setConfig({ ...config, rowsPerRequest: parseInt(e.target.value) })}
            className="w-full"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-gray-900">
            <span>10</span>
            <span>200</span>
          </div>
        </div>
      </div>

      <button
        onClick={runLoadTest}
        disabled={isLoading}
        className={`w-full py-3 rounded-lg font-medium transition-colors ${
          mode === 'sync' 
            ? 'bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-400'
            : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
        }`}
      >
        {isLoading ? '⏳ Running Load Test...' : `🚀 Run ${mode.toUpperCase()} Load Test`}
      </button>

      {results && results.summary && (
        <div className="mt-6 space-y-4">
          <h4 className="font-semibold text-slate-900">Load Test Results</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{results.summary.totalRequests}</div>
              <div className="text-sm text-blue-800">Total Requests</div>
            </div>
            
            <div className={`p-3 rounded-lg ${mode === 'sync' ? 'bg-green-50' : 'bg-indigo-50'}`}>
              <div className={`text-2xl font-bold ${mode === 'sync' ? 'text-green-600' : 'text-indigo-600'}`}>
                {results.summary.successful}
              </div>
              <div className="text-sm text-slate-800">Successful (200)</div>
            </div>
            
            {mode === 'async' && (
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{results.summary.queued}</div>
                <div className="text-sm text-purple-800">Queued (202)</div>
              </div>
            )}
            
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{results.summary.timeouts}</div>
              <div className="text-sm text-red-800">Timeouts (504)</div>
            </div>
            
            <div className="bg-slate-100 p-3 rounded-lg">
              <div className="text-2xl font-bold text-slate-800">{results.summary.errors}</div>
              <div className="text-sm text-slate-800">Errors</div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">{results.summary.avgDuration}ms</div>
              <div className="text-sm text-yellow-800">Avg Duration</div>
            </div>
          </div>

          <div className="text-sm text-slate-700">
            <p><strong>Duration Range:</strong> {results.summary.minDuration}ms - {results.summary.maxDuration}ms</p>
            <p><strong>Target:</strong> {results.summary.target} endpoint</p>
            <p><strong>Rows per Request:</strong> {results.summary.rowsPerRequest}</p>
          </div>

          {mode === 'sync' && results.summary.timeouts > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                ⚠️ {results.summary.timeouts} requests timed out due to Vercel's 10-second execution limit. 
                This demonstrates the limitation of synchronous processing under load.
              </p>
            </div>
          )}

          {mode === 'async' && results.summary.queued > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                ✅ {results.summary.queued} requests were immediately queued (202 Accepted) and will be processed asynchronously. 
                This demonstrates the scalability of the async architecture.
              </p>
            </div>
          )}
        </div>
      )}

      {results && results.error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800">{results.error}</p>
        </div>
      )}
    </div>
  );
}
