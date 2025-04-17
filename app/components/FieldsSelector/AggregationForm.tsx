// AggregationForm.tsx
import React, { useEffect, useState } from 'react';
import IndexSelector from '@/app/components/FieldsSelector/IndexSelector';
import FieldDropdown from '@/app/components/FieldsSelector/FieldDropdown';
import IntervalSelector from '@/app/components/FieldsSelector/IntervalSelector';
import FilterValueSelector from '@/app/components/FieldsSelector/FilterValueSelector';
import DateRangePicker from '@/app/components/FieldsSelector/DateRangePicker';
import "react-datepicker/dist/react-datepicker.css";
import { calculateOptimalInterval } from '@/app/components/FieldsSelector/intervalUtils';
import { useFormState } from '@/app/contexts/FormStateContext';

interface AggregationFormProps {
  indices: string[];
  fields: {
    dateFields: string[];
    termFields: string[];
    numericFields: string[];
  };
  formState: {
    selectedIndex: string;
    term: string;
    interval: string;
    numericField: string;
    timestamp: string;
    startDate: string;
    endDate: string;
    filterField: string;
    filterValue: string;
  };
  setters: {
    setSelectedIndex: (value: string) => void;
    setTerm: (value: string) => void;
    setInterval: (value: string) => void;
    setNumericField: (value: string) => void;
    setTimestamp: (value: string) => void;
    setStartDate: (date: string) => void;
    setEndDate: (date: string) => void;
    setFilterField: (value: string) => void;
    setFilterValue: (value: string) => void;
  };
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export default function AggregationForm({
  indices,
  fields,
  formState,
  setters,
  onSubmit,
  loading
}: AggregationFormProps) {
  const [isCompact, setIsCompact] = useState(true);

  const { resetState } = useFormState();

  const isFormValid =
    formState.selectedIndex && 
    formState.term && 
    formState.interval && 
    formState.numericField && 
    formState.timestamp && 
    formState.startDate && 
    formState.endDate &&
    formState.filterField &&
    formState.filterValue;

  // Consolidated function to resolve interval value
  const resolveInterval = () => {
    if (formState.interval === 'auto' && formState.startDate && formState.endDate) {
      return calculateOptimalInterval(formState.startDate, formState.endDate);
    }
    return formState.interval;
  };

  // Modified submit handler that uses the consolidated function
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the effective interval using the consolidated function
    const effectiveInterval = resolveInterval();
    
    // Call the original submit handler with the resolved interval
    const syntheticEvent = {
      ...e,
      resolvedInterval: effectiveInterval
    };
    onSubmit(syntheticEvent as any);
  };

  // Format date for display in compact view
  const formatDate = (date: string | null) => {
    if (!date) return '';

    // Convert string to Date object assuming the string contains UTC date
    const dateObj = new Date(date);
    // Adjust for timezone offset
    const utcDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);


    return utcDate.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-sm shadow-lg overflow-hidden">
      {isCompact ? (
        // Compact view - minimal height with summary
        <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200">
            <h2 className="text-gray-900 text-base font-medium">Query Parameters</h2>
            <div className="hidden md:flex text-sm text-gray-500 space-x-4 flex-1 ml-4 overflow-hidden">
              {formState.selectedIndex && (
                <div className="flex items-center">
                  <span className="font-medium mr-1">Index:</span>
                  <span className="truncate">{formState.selectedIndex}</span>
                </div>
              )}
              {formState.term && (
                <div className="flex items-center">
                  <span className="font-medium mr-1">Category:</span>
                  <span className="truncate">{formState.term}</span>
                </div>
              )}
              {formState.numericField && (
                <div className="flex items-center">
                  <span className="font-medium mr-1">Value:</span>
                  <span className="truncate">{formState.numericField}</span>
                </div>
              )}
              {formState.filterField && formState.filterValue && (
                <div className="flex items-center">
                  <span className="font-medium mr-1">Filter:</span>
                  <span className="truncate">{formState.filterField}={formState.filterValue}</span>
                </div>
              )}
              {formState.startDate && formState.endDate && (
                <div className="flex items-center">
                  <span className="font-medium mr-1">Date:</span>
                  <span className="truncate">{formatDate(formState.startDate)} - {formatDate(formState.endDate)}</span>
                </div>
              )}
            </div>
          <div className="flex items-center">
            {/* Collapse button */}
            <button 
              onClick={() => setIsCompact(false)}
              className="text-gray-600 hover:bg-gray-100 rounded p-1 mr-2"
              aria-label="Expand form"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Submit button with loading state */}
            <button
              type="submit"
              disabled={!isFormValid || loading}
              onClick={handleSubmit}
              className={`flex items-center justify-center py-1 px-4 rounded-md text-sm font-medium
                ${!isFormValid || loading 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
            >
              {loading ? (
                <>
                  Processing
                </>
              ) : " Run Query "}
            </button>
          </div>
        </div>
      ) : (
        // Expanded view - full form
        <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200">
          <h2 className="text-gray-900 text-base font-medium">Query Parameters</h2>
          <div className="flex items-center">
            {/* Expand button */}
            <button 
              onClick={() => setIsCompact(true)}
              className="text-gray-600 hover:bg-gray-100 rounded p-1 mr-2"
              aria-label="Collapse form"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            {/* Submit button with loading state */}
            <button
              type="submit"
              disabled={!isFormValid || loading}
              onClick={handleSubmit}
              className={`flex items-center justify-center py-1 px-4 rounded-md text-sm font-medium
                ${!isFormValid || loading 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
            >
              {loading ? (
                <>
                  Processing
                </>
              ) : "Run Query"}
            </button>
          </div>
      </div>
      )}

      {!isCompact && (
        <form onSubmit={handleSubmit} className="px-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-2 gap-y-2">
                  <IndexSelector 
                    indices={indices} 
                    selectedIndex={formState.selectedIndex} 
                    onChange={setters.setSelectedIndex} 
                  />
                  <FieldDropdown
                    id="timestamp"
                    label="Date"
                    value={formState.timestamp}
                    onChange={setters.setTimestamp}
                    options={fields.dateFields}
                    disabled={!formState.selectedIndex}
                  />
                  <FieldDropdown
                    id="term"
                    label="Category"
                    value={formState.term}
                    onChange={setters.setTerm}
                    options={fields.termFields}
                    disabled={!formState.selectedIndex}
                  />
                   <FieldDropdown
                    id="numericField"
                    label="Value"
                    value={formState.numericField}
                    onChange={setters.setNumericField}
                    options={fields.numericFields}
                    disabled={!formState.selectedIndex}
                  />
                 <IntervalSelector
                    value={formState.interval}
                    onChange={setters.setInterval}
                    disabled={!formState.selectedIndex}
                    useAutoInterval={true}
                  />
                  <FieldDropdown
                    id="filterField"
                    label="Filter"
                    value={formState.filterField}
                    onChange={setters.setFilterField}
                    options={fields.termFields}
                    disabled={!formState.selectedIndex}
                  />
                  <FilterValueSelector
                    indexName={formState.selectedIndex}
                    filterField={formState.filterField}
                    value={formState.filterValue}
                    onChange={setters.setFilterValue}
                    startDate={formState.startDate}
                    endDate={formState.endDate}
                    disabled={!formState.selectedIndex || !formState.filterField}
                    placeholder="Type to search"
                    minSearchLength={4} // Add minimum search length
                  />
                  <DateRangePicker
                    startDate={formState.startDate}
                    endDate={formState.endDate}
                    onStartDateChange={setters.setStartDate}
                    onEndDateChange={setters.setEndDate}
                  />
                  {/* Reset saved state button */}
                  <button
                    type="button"
                    onClick={resetState}
                    className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded hover:bg-gray-100"
                  >
                    Reset Saved Settings
                  </button>
          </div>
        </form>
      )}
    </div>
  );
}