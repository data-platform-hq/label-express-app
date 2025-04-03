// components/BrushModeSelector.tsx
import React from 'react';
import { BrushMode } from '@/app/components/types';

interface BrushModeSelectorProps {
  brushMode: BrushMode;
  setBrushMode: (mode: BrushMode) => void;
  onZoomHistory: () => void;
}

export default function BrushModeSelector({ brushMode, setBrushMode, onZoomHistory}: BrushModeSelectorProps) {
  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-50 border-t border-gray-200">
      <span className="text-sm font-medium text-gray-700">Selection Mode:</span>
      <div className="flex space-x-1">
        <button
          onClick={() => setBrushMode('disabled')}
          className={`px-3 py-1 text-xs rounded ${
            brushMode === 'disabled' 
              ? 'bg-gray-700 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Disabled
        </button>
        <button
          onClick={() => setBrushMode('annotation')}
          className={`px-3 py-1 text-xs rounded ${
            brushMode === 'annotation' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Create Annotation
        </button>
        <button
          onClick={() => setBrushMode('zoom')}
          className={`px-3 py-1 text-xs rounded ${
            brushMode === 'zoom' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Zoom Pointer
        </button>

      {/* Zoom Out Button */}
      {onZoomHistory && (
          <button
            onClick={onZoomHistory}
            className="px-3 py-1 text-xs rounded flex items-center bg-blue-100 text-blue-700 hover:bg-blue-200"
          >
            Zhow Full History
          </button>
        )}



      </div>
    </div>
  );
}