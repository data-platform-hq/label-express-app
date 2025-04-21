// hooks/useAggregationData.ts
import { useState, useCallback } from 'react';
import { fetchAggregationData, fetchIndexStats } from '@/app/utils/actions';
import { calculateOptimalInterval } from '@/app/components/FieldsSelector/intervalUtils';
import { useFormState } from '@/app/contexts/FormStateContext';

export function useAggregationData() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get form state from context
  const { 
    selectedIndex, 
    term, 
    interval, 
    numericField, 
    timestamp, 
    startDate, 
    endDate, 
    filterField, 
    filterValue,
    setStartDate,
    setEndDate,
    setInterval,
  } = useFormState();

  // Consolidated function to resolve interval value
  const resolveInterval = useCallback((
    intervalValue: string = interval, 
    startDateValue: string = startDate, 
    endDateValue: string = endDate
  ) => {
    if (intervalValue === 'auto' && startDateValue && endDateValue) {
      return calculateOptimalInterval(startDateValue, endDateValue);
    }
    return intervalValue;
  }, [interval, startDate, endDate]);

  // Fetch data using current form state values
  const fetchData = useCallback(async () => {
    if (!selectedIndex || !term || !interval || !numericField || 
        !timestamp || !startDate || !endDate || 
        !filterField || !filterValue) {
      return;
    }

    setLoading(true);
    setError(null);

    try {

      
      // Use the resolved interval
      const effectiveInterval = resolveInterval();

      const data = await fetchAggregationData(
        selectedIndex,
        term,
        effectiveInterval,
        numericField,
        timestamp,
        startDate,
        endDate,
        filterField,
        filterValue
      );

      if ("error" in data) {
        setError(data.error as string);
        setResults(null);
      } else {
        setResults(data);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [selectedIndex, term, interval, numericField, timestamp, startDate, endDate, filterField, filterValue, resolveInterval]);

  // Simplified ZoomHistory function that uses context values and setters
  const onZoomHistory = useCallback(async () => {
    if (!selectedIndex || !timestamp) {
      return null;
    }
    setLoading(true);
    setError(null); 

    try {
      const stats = await fetchIndexStats(selectedIndex, timestamp, filterField, filterValue);
      
      if (stats && stats.minDate && stats.maxDate) {
        const minDate = stats.minDate;
        const maxDate = stats.maxDate;

        // Update the dates using context setters
        setStartDate(minDate);
        setEndDate(maxDate);

        // Set the interval to auto
        setInterval("auto");

        // Use the consolidated function to resolve interval
        const effectiveInterval = resolveInterval(interval, minDate, maxDate);

        const data = await fetchAggregationData(
          selectedIndex,
          term,
          effectiveInterval,
          numericField,
          timestamp,
          minDate,
          maxDate,
          filterField,
          filterValue
        );

        if ("error" in data) {
          setError(data.error as string);
          setResults(null);
        } else {
          setResults(data);
        }
        
        return stats;
      } else {
        setError("Failed to fetch index stats");
        return null;
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedIndex, term, interval, numericField, timestamp, filterField, filterValue, setStartDate, setEndDate, resolveInterval]);

  // Alias for fetchData
  const submitCurrentForm = fetchData;

  return {
    results,
    loading,
    error,
    fetchData,
    onZoomHistory,
    resolveInterval,
    submitCurrentForm
  };
}