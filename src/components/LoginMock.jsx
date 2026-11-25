'use client';

import { useState } from 'react';

export default function LoginMock({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    // Simulate login delay
    setTimeout(() => {
      setIsLoading(false);
      onLogin({ 
        user: 'GST User', 
        gstin: '27AABCU9603R1ZM' 
      });
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏛️</div>
          <h1 className="text-2xl font-bold text-gray-800">GST Filing Portal</h1>
          <p className="text-gray-600 mt-2">Modern Processing Demonstration</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GSTIN
            </label>
            <input
              type="text"
              defaultValue="27AABCU9603R1ZM"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your GSTIN"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              defaultValue="demo123"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter password"
            />
          </div>
          
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
          >
            {isLoading ? 'Logging in...' : 'Login to Portal'}
          </button>
        </div>
        
        <p className="text-xs text-gray-500 text-center mt-4">
          Demo credentials pre-filled for convenience
        </p>
      </div>
    </div>
  );
}
