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
  usingFallbackData?: boolean; 
}

export default function ResultsDisplay({
  results,
  error,
  params,
  onDateRangeChange,
  onZoomHistory,
  usingFallbackData = false,
}: ResultsDisplayProps) {

  const hasResults = results && results.processed && results.processed.length > 0;

  // TODO: combine error with usingFallbackData and make it as a toast

  return (
    <div className="w-full h-full flex flex-col">
      {/* Fallback data notification */}
      {usingFallbackData && hasResults && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">No data available for the current query.</span> Showing previous results instead.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
                {usingFallbackData && hasResults && (
                  <span className="ml-1">Showing previous results instead.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}