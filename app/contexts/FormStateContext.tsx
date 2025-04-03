// app/contexts/FormStateContext.tsx

"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useFieldSelectorState } from '@/app/hooks/useFieldSelectorState';

// Define the type for the context value
interface FormStateContextType {
  // State values
  selectedIndex: string;
  term: string;
  interval: string;
  numericField: string;
  timestamp: string;
  startDate: string | "";
  endDate: string | "";
  filterField: string;
  filterValue: string;
  
  // Setters
  setSelectedIndex: (value: string) => void;
  setTerm: (value: string) => void;
  setInterval: (value: string) => void;
  setNumericField: (value: string) => void;
  setTimestamp: (value: string) => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  setFilterField: (value: string) => void;
  setFilterValue: (value: string) => void;
  resetState: () => void;
}

// Create the context with a default value of null
const FormStateContext = createContext<FormStateContextType | null>(null);

// Provider component
interface FormStateProviderProps {
  children: ReactNode;
}

export function FormStateProvider({ children }: FormStateProviderProps) {
  // Use your existing hook to manage the form state
  const formState = useFieldSelectorState();
  
  return (
    <FormStateContext.Provider value={formState}>
      {children}
    </FormStateContext.Provider>
  );
}

// Custom hook to use the form state
export function useFormState() {
  const context = useContext(FormStateContext);
  if (context === null) {
    throw new Error('useFormState must be used within a FormStateProvider');
  }
  return context;
}