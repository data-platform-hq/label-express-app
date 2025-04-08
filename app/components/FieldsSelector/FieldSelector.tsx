// components/FieldSelector.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFormState } from '@/app/contexts/FormStateContext';
import { useFieldsLoader } from '@/app/hooks/useFieldsLoader';
import { useAggregationData } from '@/app/hooks/useAggregationData';
import AggregationForm from '@/app/components/FieldsSelector/AggregationForm';
import ResultsDisplay from '@/app/components/FieldsSelector/ResultsDisplay';

interface FieldSelectorProps {
  indices: string[];
}

export default function FieldSelector({ indices }: FieldSelectorProps) {
  // Use the form state context
  const {
    selectedIndex, 
    term,
    interval,
    numericField,
    timestamp,
    startDate, setStartDate,
    endDate, setEndDate,
    filterField,
    filterValue
  } = useFormState();

  // Load fields based on selected index
  const fields = useFieldsLoader(selectedIndex);

  // Handle data fetching and results
  const {
    results,
    loading,
    error,
    submitCurrentForm,
    onZoomHistory,
    resolveInterval
  } = useAggregationData();

  // Keep track of previous valid results and params
  const [previousValidResults, setPreviousValidResults] = useState<any>(null);
  const [previousValidParams, setPreviousValidParams] = useState<any>(null);
  
  // Track whether dates were explicitly changed (not on initial render)
  const datesJustUpdated = useRef(false);
  
  // Track previous date values to detect actual changes
  const prevStartDate = useRef(startDate);
  const prevEndDate = useRef(endDate);
  
  // Effect to submit form when dates change
  useEffect(() => {
    // Only submit if dates were explicitly changed and are different from previous values
    if (datesJustUpdated.current) {
      datesJustUpdated.current = false;
      
      // Check if dates actually changed (to avoid unnecessary submissions)
      const startDateChanged = prevStartDate.current !== startDate;
      const endDateChanged = prevEndDate.current !== endDate;
      
      if (startDateChanged || endDateChanged) {
        submitCurrentForm();
      }
    }
    
    // Update previous values for next comparison
    prevStartDate.current = startDate;
    prevEndDate.current = endDate;
  }, [startDate, endDate, submitCurrentForm]);
  
  // Effect to store previous valid results when we have successful data
  useEffect(() => {
    if (results && results.processed && results.processed.length > 0 && !error) {
      setPreviousValidResults(results);
      setPreviousValidParams({
        index: selectedIndex,
        term,
        interval: resolveInterval(),
        numericField,
        timestamp,
        filterField,
        filterValue
      });
    }
  }, [results, error, selectedIndex, term, interval, numericField, timestamp, filterField, filterValue, resolveInterval]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent | any) => {
    // Check if e is an event with preventDefault
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }  
    submitCurrentForm();
  }, [startDate, endDate, submitCurrentForm]);
      
  // Handle date range changes from chart interactions
  const handleDateRangeChange = useCallback((newStartDate: string, newEndDate: string) => {
    // Flag that we're explicitly updating dates
    datesJustUpdated.current = true;
    
    // Update the state - the useEffect will handle submission
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, [setStartDate, setEndDate]);

  // Determine if we should use fallback data
  const shouldUseFallback = error || (results && (!results.processed || results.processed.length === 0)) && previousValidResults !== null;
  
  // Determine which results to display
  const displayResults = shouldUseFallback ? previousValidResults : results;
  
  // Determine which params to use
  const displayParams = shouldUseFallback && previousValidParams ? previousValidParams : {
    index: selectedIndex,
    term,
    interval: resolveInterval(),
    numericField,
    timestamp,
    filterField,
    filterValue
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Results Section */}
      <div className="flex-grow w-full">
        <ResultsDisplay
          results={displayResults}
          error={error}
          params={displayParams}
          onDateRangeChange={handleDateRangeChange}
          onZoomHistory={onZoomHistory}
          usingFallbackData={shouldUseFallback}
        />
      </div>  
      {/* Configuration Form */}
      <div className="bg-white shadow-lg border border-gray-200 w-full">
        <AggregationForm
          indices={indices}
          fields={fields}
          formState={{
            selectedIndex,
            term,
            interval,
            numericField,
            timestamp,
            startDate,
            endDate,
            filterField,
            filterValue
          }}
          setters={useFormState()}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
}