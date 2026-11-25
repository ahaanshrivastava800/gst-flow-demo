'use client';

import { useState } from 'react';

export default function FileUpload({ onUpload, isLoading }) {
  const [dragActive, setDragActive] = useState(false);
  const [fileCount, setFileCount] = useState(100);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = (file) => {
    // Simulate reading file and generating mock data
    const reader = new FileReader();
    reader.onload = (e) => {
      const mockRows = generateMockGSTRows(fileCount);
      onUpload({
        file: file.name,
        rows: mockRows,
        fileId: `file_${Date.now()}`
      });
    };
    reader.readAsText(file);
  };

  const generateMockGSTRows = (count) => {
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
  };

  const handleDemoUpload = () => {
    const mockRows = generateMockGSTRows(fileCount);
    onUpload({
      file: `demo_gst_filing_${Date.now()}.json`,
      rows: mockRows,
      fileId: `file_${Date.now()}`
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Upload GST Filing Data</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Records (for demo): {fileCount}
        </label>
        <input
          type="range"
          min="10"
          max="500"
          value={fileCount}
          onChange={(e) => setFileCount(parseInt(e.target.value))}
          className="w-full"
          disabled={isLoading}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>10</span>
          <span>500</span>
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleChange}
          accept=".json,.csv"
          disabled={isLoading}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer"
        >
          <div className="text-4xl mb-2">📁</div>
          <p className="text-gray-600">
            Drag and drop your GST filing file here, or click to browse
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Supports JSON and CSV formats
          </p>
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleDemoUpload}
          disabled={isLoading}
          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
        >
          {isLoading ? 'Processing...' : 'Upload Demo Data'}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        Demo data will be automatically generated for testing
      </p>
    </div>
  );
}
