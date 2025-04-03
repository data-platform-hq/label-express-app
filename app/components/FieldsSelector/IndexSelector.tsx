// components/IndexSelector.tsx
import React from 'react';

interface IndexSelectorProps {
  indices: string[];
  selectedIndex: string;
  onChange: (index: string) => void;
}

export default function IndexSelector({ indices, selectedIndex, onChange }: IndexSelectorProps) {
  return (
    <div>
      <label htmlFor="index-select" className="block text-sm font-medium text-gray-700 mb-1">
        Select Data Index
      </label>
      <div className="relative">
        <select
          id="index-select"
          className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 bg-white rounded-md shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    appearance-none"
          value={selectedIndex}
          onChange={(e) => onChange(e.target.value)}
          required
        >
          <option value="">Select an index</option>
          {indices.map((index) => (
            <option key={index} value={index}>
              {index}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      {indices.length === 0 && (
        <p className="mt-1 text-xs text-gray-500">
          No indices available. Please check your connection.
        </p>
      )}
    </div>
  );
}