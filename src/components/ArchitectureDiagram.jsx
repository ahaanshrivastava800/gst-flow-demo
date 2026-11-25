'use client';

export default function ArchitectureDiagram() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Architecture Comparison</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sync Architecture */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <span>❌</span> Legacy Sync Architecture
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600">1</div>
              <span className="text-gray-900">Client uploads file</span>
            </div>
            <div className="ml-4 border-l-2 border-red-200 h-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600">2</div>
              <span className="text-gray-900">Server processes synchronously</span>
            </div>
            <div className="ml-4 border-l-2 border-red-200 h-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600">3</div>
              <span className="text-gray-900">⚠️ Connection blocks until complete</span>
            </div>
            <div className="ml-4 border-l-2 border-red-200 h-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600">4</div>
              <span className="text-gray-900">🚫 Times out after 10s (Vercel limit)</span>
            </div>
          </div>

          <div className="mt-4 bg-red-50 p-3 rounded text-sm">
            <p className="font-medium text-red-800">Limitations:</p>
            <ul className="text-red-700 text-xs mt-1 space-y-1">
              <li>• Requests timeout under load</li>
              <li>• Poor user experience (blocking)</li>
              <li>• No scalability for large files</li>
              <li>• Server resources wasted waiting</li>
            </ul>
          </div>
        </div>

        {/* Async Architecture */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            <span>✅</span> Modern Async Architecture
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">1</div>
              <span className="text-gray-900">Client uploads file</span>
            </div>
            <div className="ml-4 border-l-2 border-green-200 h-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">2</div>
              <span className="text-gray-900">Server validates & queues job</span>
            </div>
            <div className="ml-4 border-l-2 border-green-200 h-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">3</div>
              <span className="text-gray-900">✅ Returns 202 + job ID immediately</span>
            </div>
            <div className="ml-4 border-l-2 border-green-200 h-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">4</div>
              <span className="text-gray-900">Background worker processes job</span>
            </div>
            <div className="ml-4 border-l-2 border-green-200 h-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">5</div>
              <span className="text-gray-900">Client polls status for updates</span>
            </div>
          </div>

          <div className="mt-4 bg-green-50 p-3 rounded text-sm">
            <p className="font-medium text-green-800">Benefits:</p>
            <ul className="text-green-700 text-xs mt-1 space-y-1">
              <li>• No timeout issues</li>
              <li>• Instant user feedback</li>
              <li>• Scales to large files</li>
              <li>• Efficient resource usage</li>
              <li>• Real-time progress tracking</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Technology Stack</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="font-medium text-blue-700">Frontend</p>
            <p className="text-blue-600">Next.js 14 + React</p>
          </div>
          <div>
            <p className="font-medium text-blue-700">Queue</p>
            <p className="text-blue-600">Upstash Redis</p>
          </div>
          <div>
            <p className="font-medium text-blue-700">Deployment</p>
            <p className="text-blue-600">Vercel Serverless</p>
          </div>
          <div>
            <p className="font-medium text-blue-700">Updates</p>
            <p className="text-blue-600">Polling + SSE</p>
          </div>
        </div>
      </div>
    </div>
  );
}
