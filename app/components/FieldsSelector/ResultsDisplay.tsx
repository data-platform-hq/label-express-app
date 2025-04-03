// components/ResultsDisplay.tsx
import React from 'react';
import AggregationResults from '@/app/components/Views/AggregationResults';
import { useFormState } from '@/app/contexts/FormStateContext';

// Define the ResultsDisplayProps interface
interface ResultsDisplayProps {
  results: any;
  error: string | null;
  params: {
    index: string;
    term: string;
    interval: string;
    numericField: string;
    timestamp: string;
    filterField: string;
    filterValue: string;
  };
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onZoomHistory: () => void;
}

export default function ResultsDisplay({
  results,
  error,
  params,
  onDateRangeChange,
  onZoomHistory
}: ResultsDisplayProps) {

  const { startDate, endDate } = useFormState();

  const hasResults = results && results.processed && results.processed.length > 0;

  return (
    <div className="w-full h-full flex flex-col">
      {hasResults ? (
        <div className="w-full h-full">
          <AggregationResults
            results={results.processed}
            params={params}
            onDateRangeChange={onDateRangeChange}
            onZoomHistory={onZoomHistory}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden w-full">
          {/* Empty state message */}
          <div className="p-8 text-center">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No aggregation results available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search parameters or date range.
            </p>
          </div>
          
          {/* View controls - always visible */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between">
            <div>
              <button
                onClick={onZoomHistory}
                className="px-3 py-1 text-xs rounded flex items-center bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                Show Full History
              </button>
            </div>
          </div>
          
        </div>
      )}

      {error ? (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : null}
    </div>
  );
}