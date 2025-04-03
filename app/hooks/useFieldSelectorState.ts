// hooks/useFieldSelectorState.ts
import { useState, useEffect, useCallback } from 'react';

interface FieldSelectorState {
  selectedIndex: string;
  term: string;
  interval: string;
  numericField: string;
  timestamp: string;
  startDate: string ;
  endDate: string;
  filterField: string;
  filterValue: string;
}

const defaultState: FieldSelectorState = {
  selectedIndex: "",
  term: "",
  interval: "1d",
  numericField: "",
  timestamp: "",
  startDate: "",
  endDate: "",
  filterField: "",
  filterValue: ""
};

export function useFieldSelectorState() {
  const [selectedIndex, setSelectedIndex] = useState<string>(defaultState.selectedIndex);
  const [term, setTerm] = useState(defaultState.term);
  const [interval, setInterval] = useState(defaultState.interval);
  const [numericField, setNumericField] = useState(defaultState.numericField);
  const [timestamp, setTimestamp] = useState(defaultState.timestamp);
  const [startDate, setStartDate] = useState(defaultState.startDate);
  const [endDate, setEndDate] = useState(defaultState.endDate);
  const [filterField, setFilterField] = useState(defaultState.filterField);
  const [filterValue, setFilterValue] = useState(defaultState.filterValue);
  
  // Reset state to defaults
  const resetState = useCallback(() => {
    setSelectedIndex(defaultState.selectedIndex);
    setTerm(defaultState.term);
    setInterval(defaultState.interval);
    setNumericField(defaultState.numericField);
    setTimestamp(defaultState.timestamp);
    setStartDate("");
    setEndDate("");
    setFilterField(defaultState.filterField);
    setFilterValue(defaultState.filterValue);
    
    // Also clear localStorage
    localStorage.removeItem('fieldSelectorState');
  }, []);
  
  // Load saved state from localStorage on component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedState = localStorage.getItem('fieldSelectorState');
    if (savedState) {
      try {
        const parsedState: FieldSelectorState = JSON.parse(savedState);
        
        setSelectedIndex(parsedState.selectedIndex || defaultState.selectedIndex);
        setTerm(parsedState.term || defaultState.term);
        setInterval(parsedState.interval || defaultState.interval);
        setNumericField(parsedState.numericField || defaultState.numericField);
        setTimestamp(parsedState.timestamp || defaultState.timestamp);
        setFilterField(parsedState.filterField || defaultState.filterField);
        setFilterValue(parsedState.filterValue || defaultState.filterValue);
        
        if (parsedState.startDate) {
          setStartDate(parsedState.startDate);
        }
        
        if (parsedState.endDate) {
          setEndDate(parsedState.endDate);
        }
        
      } catch (e) {
        console.error("Failed to parse saved state:", e);
        // On error, reset to defaults
        resetState();
      }
    }
  }, [resetState]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!selectedIndex) return;
    
    const stateToSave: FieldSelectorState = {
      selectedIndex,
      term,
      interval,
      numericField,
      timestamp,
      startDate,
      endDate,
      filterField,
      filterValue
    };
    
    localStorage.setItem('fieldSelectorState', JSON.stringify(stateToSave));
  }, [selectedIndex, term, interval, numericField, timestamp, startDate, endDate, filterField, filterValue]);

  return {
    selectedIndex, setSelectedIndex,
    term, setTerm,
    interval, setInterval,
    numericField, setNumericField,
    timestamp, setTimestamp,
    startDate, setStartDate,
    endDate, setEndDate,
    filterField, setFilterField,
    filterValue, setFilterValue,
    resetState // Export the reset function
  };
}