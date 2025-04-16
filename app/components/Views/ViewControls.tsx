// components/ViewControls.tsx
import React, { useState }from 'react';
import { BrushMode } from '@/app/components/types';

interface ViewControlsProps {

  showAnnotationSidebar: boolean;
  setShowAnnotationSidebar: (show: boolean) => void;
  
  // Brush control props
  brushMode: BrushMode;
  setBrushMode: (mode: BrushMode) => void;
  onZoomHistory: () => void;

  // Add new zoom in/out handlers
  onZoomIn?: () => void;
  onZoomOut?: () => void;

  // New navigation handlers
  onNavigateLeft?: (interval: string) => void;
  onNavigateRight?: (interval: string) => void;

  // Current interval from the form state
  currentInterval?: string;
  
  // Only show brush controls in chart view
  showBrushControls?: boolean;
}

// Time interval options
const timeIntervals = [
  { value: '15m', label: '15 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '3h', label: '3 hours' },
  { value: '6h', label: '6 hours' },
  { value: '12h', label: '12 hours' },
  { value: '1d', label: '1 day' },
  { value: '7d', label: '1 week' },
];

export default function ViewControls({
  showAnnotationSidebar,
  setShowAnnotationSidebar,
  brushMode,
  setBrushMode,
  onZoomIn,
  onZoomOut,
  onZoomHistory,
  onNavigateLeft,
  onNavigateRight,
  currentInterval,
  showBrushControls = true
}: ViewControlsProps) {

  // State for the selected time interval
    const [timeInterval, setTimeInterval] = useState('15m');
    
  // Handle time interval change
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeInterval(e.target.value);
  };

  // Check if navigation should be disabled
  const isNavigationDisabled = currentInterval === 'auto';

    
  return (
    <div className="flex justify-between items-center">
      {/* Selection Mode Controls - Left Side */}
      <div className="flex space-x-2">
        { showBrushControls && (
          <>
            <button
              onClick={() => setBrushMode('disabled')}
              className={`px-3 py-1 text-xs rounded ${
                brushMode === 'disabled' 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pointer
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
            <button
              onClick={onZoomHistory}
              className="px-3 py-1 text-xs rounded flex items-center bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
              Show Full History
            </button>

            {/* Zoom In/Out Buttons */}
            {onZoomIn && (
              <button
                onClick={onZoomIn}
                className="px-3 py-1 text-xs rounded flex items-center bg-blue-100 text-blue-700 hover:bg-blue-200"
                title="Zoom in (narrow date range)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Zoom
              </button>
            )}
            {onZoomOut && (
              <button
                onClick={onZoomOut}
                className="px-3 py-1 text-xs rounded flex items-center bg-blue-100 text-blue-700 hover:bg-blue-200"
                title="Zoom out (widen date range)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Zoom
              </button>
            )}

            {/* Navigation Controls */}
            {!isNavigationDisabled &&  (
            <div className="flex items-center space-x-2 ml-2 border-l border-gray-300 pl-2">
            {/* Time Interval Dropdown */}
            <select
              value={timeInterval}
              onChange={handleIntervalChange}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
              title={isNavigationDisabled 
                ? "Navigation disabled with 'auto' interval" 
                : "Select time interval for navigation"}
              disabled={isNavigationDisabled}
            >
              {timeIntervals.map((interval) => (
                <option key={interval.value} value={interval.value}>
                  {interval.label}
                </option>
              ))}
            </select>
            
            {/* Navigate Left Button */}
            {onNavigateLeft && (
              <button
                onClick={() => onNavigateLeft(timeInterval)}
                className="px-3 py-1 text-xs rounded flex items-center bg-gray-100 text-gray-700 hover:bg-gray-200"
                title={isNavigationDisabled 
                  ? "Navigation disabled with 'auto' interval" 
                  : "Navigate left (earlier in time)"}
                disabled={isNavigationDisabled}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Previous
              </button>
            )}
            
            {/* Navigate Right Button */}
            {onNavigateRight && (
              <button
                onClick={() => onNavigateRight(timeInterval)}
                className="px-3 py-1 text-xs rounded flex items-center bg-gray-100 text-gray-700 hover:bg-gray-200"
                title={isNavigationDisabled 
                  ? "Navigation disabled with 'auto' interval" 
                  : "Navigate right (later in time)"}
                disabled={isNavigationDisabled}
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

            )}

          </>
        )}
      </div>
      
      {/* View Options - Right Side */}
     
      <div className="flex space-x-2">
          <button
            onClick={() => setShowAnnotationSidebar(!showAnnotationSidebar)}
            className={`px-3 py-1 rounded text-xs min-w-[120px] ${
              showAnnotationSidebar ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {showAnnotationSidebar ? 'Hide Annotations' : 'Show Annotations'}
          </button>

      </div>
      
    </div>
  );
} 