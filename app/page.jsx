'use client';

import { useState } from 'react';
import LoginMock from '../src/components/LoginMock';
import SyncFilingView from '../src/components/SyncFilingView';
import AsyncFilingView from '../src/components/AsyncFilingView';
import LoadSimulatorButton from '../src/components/LoadSimulatorButton';
import ArchitectureDiagram from '../src/components/ArchitectureDiagram';
import { apiClient } from '../src/api/client';

export default function Home() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('sync'); // 'sync' or 'async'
  const [isLoading, setIsLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleModeToggle = (newMode) => {
    console.log('Switching mode from', mode, 'to', newMode);
    setMode(newMode);
    setUploadResult(null);
  };

  const handleUpload = async (data) => {
    console.log('Main handleUpload called with mode:', mode, 'and data:', data);
    if (!data) {
      setUploadResult(null);
      return;
    }

    setIsLoading(true);
    setUploadResult(null);

    try {
      let result;
      if (mode === 'sync') {
        console.log('Calling sync upload');
        result = await apiClient.syncUpload(data);
      } else {
        console.log('Calling async upload');
        result = await apiClient.asyncUpload(data);
      }
      
      console.log('Upload result:', result);
      setUploadResult(result);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        error: error.message || 'Upload failed',
        success: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUploadResult(null);
    setMode('sync');
  };

  if (!user) {
    return <LoginMock onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏛️</div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">GST Flow Demo</h1>
                <p className="text-sm text-slate-700">Async vs Sync Processing Comparison</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-800">
                <span className="font-medium">User:</span> {user.user}
              </div>
              <button
                onClick={handleLogout}
                className="bg-slate-200 text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mode Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleModeToggle('sync')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                mode === 'sync'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}
            >
              ❌ Legacy Sync
            </button>
            <button
              onClick={() => handleModeToggle('async')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                mode === 'async'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
              }`}
            >
              ✅ Modern Async
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-sm font-medium">
              Current Mode: <span className={mode === 'sync' ? 'text-red-600' : 'text-green-600'}>
                {mode === 'sync' ? '❌ Legacy Sync' : '✅ Modern Async'}
              </span>
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {mode === 'sync' ? (
              <SyncFilingView
                onUpload={handleUpload}
                uploadResult={uploadResult}
                isLoading={isLoading}
              />
            ) : (
              <AsyncFilingView
                onUpload={handleUpload}
                uploadResult={uploadResult}
                isLoading={isLoading}
              />
            )}

            <LoadSimulatorButton mode={mode} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ArchitectureDiagram />
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Guide</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">1.</span>
                  <p className="text-slate-800">Choose between Sync (Legacy) or Async (Modern) processing mode</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">2.</span>
                  <p className="text-slate-800">Upload GST filing data with specified record count</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">3.</span>
                  <p className="text-slate-800">Observe the processing behavior and response times</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">4.</span>
                  <p className="text-slate-800">Use Load Simulator to test system under concurrent load</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">💡 Key Insight</h3>
              <p className="text-sm text-slate-800">
                The async architecture returns immediately with a job ID, preventing timeouts 
                and enabling processing of large datasets without blocking user interactions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-slate-700">
            <p>GST Flow Demo - Demonstrating modern async processing patterns for tax filing systems</p>
            <p className="mt-1">Built with Next.js, Upstash Redis, and Vercel Serverless Functions</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
