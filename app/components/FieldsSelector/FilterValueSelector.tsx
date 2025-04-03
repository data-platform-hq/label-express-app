// app/components/FieldsSelector/FilterValueSelector.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFilterValuesLoader } from '@/app/hooks/useFilterValuesLoader';

interface FilterValueSelectorProps {
  indexName: string;
  filterField: string;
  value: string;
  onChange: (value: string) => void;
  startDate: string | "";
  endDate: string | "";
  disabled?: boolean;
  placeholder?: string;
  minSearchLength?: number;
}

export default function FilterValueSelector({
  indexName,
  filterField,
  value,
  onChange,
  startDate,
  endDate,
  disabled = false,
  placeholder = "Type to search",
  minSearchLength = 2
}: FilterValueSelectorProps) {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Determine if we should search based on the minimum length
  const shouldSearch = searchTerm.length >= minSearchLength || searchTerm === value;
  
  // Use the existing hook to load filter values, but only when search term meets minimum length
  const filterValues = useFilterValuesLoader(
    indexName,
    filterField,
    startDate,
    endDate,
    shouldSearch ? searchTerm : ''
  );
  
  // Filter the values based on search term for local filtering
  const filteredOptions = filterValues.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Update searchTerm when value prop changes
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);
  
  // Set loading state when fetching new values
  useEffect(() => {
    if (!filterField || !indexName || !shouldSearch) return;
    
    setIsLoading(true);
    // Small delay to prevent flickering for fast responses
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [filterField, indexName, searchTerm, startDate, endDate, shouldSearch]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length >= minSearchLength) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
    
    if (!value) {
      onChange('');
    }
  };
  
  // Handle option selection
  const handleSelect = useCallback((selectedValue: string) => {
    setSearchTerm(selectedValue);
    onChange(selectedValue);
    setIsOpen(false);
    inputRef.current?.blur();
  }, [onChange]);
  
  // Handle clear button click
  const handleClear = useCallback(() => {
    setSearchTerm('');
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;
    
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && filteredOptions.length > 0) {
      handleSelect(filteredOptions[0]);
      e.preventDefault();
    }
  }, [isOpen, handleSelect, filteredOptions]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div ref={containerRef} className="relative">
      <label htmlFor="filter-value" className="block text-sm font-medium text-gray-700 mb-1">
        Filter value
      </label>
      <div className="relative">
        <input
          id="filter-value"
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => shouldSearch && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={filterField 
            ? `${placeholder}${isLoading ? '...' : ''} (min ${minSearchLength} chars)` 
            : "Select a filter field first"}
          className="w-full pl-3 py-2 text-sm border border-gray-300 bg-white rounded-md shadow-sm 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   disabled:bg-gray-50 disabled:text-gray-500"
          disabled={disabled || !filterField || !indexName}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={isOpen ? "filter-value-listbox" : undefined}
          role="combobox"
        />
        
        {isLoading ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none" aria-hidden="true">
            <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : searchTerm ? (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            aria-label="Clear selection"
            type="button"
          >
            <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>
      
      {/* Show message when typing but below minimum length */}
      {searchTerm && searchTerm.length < minSearchLength && searchTerm !== value && (
        <p className="text-xs text-gray-500 mt-1" role="status">
          Please enter at least {minSearchLength} characters to search
        </p>
      )}
      
      {/* Dropdown positioned with fixed positioning to avoid overflow issues */}
      {isOpen && filteredOptions.length > 0 && (
        <ul 
          id="filter-value-listbox"
          className="fixed bg-white shadow-lg max-h-60 rounded-md py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto z-50"
          style={{
            width: containerRef.current ? containerRef.current.offsetWidth : 'auto',
            top: containerRef.current ? 
              containerRef.current.getBoundingClientRect().bottom + window.scrollY + 4 : 0,
            left: containerRef.current ? 
              containerRef.current.getBoundingClientRect().left + window.scrollX : 0,
          }}
          role="listbox"
        >
          {filteredOptions.map((option) => (
            <li
              key={option}
              className="cursor-pointer hover:bg-gray-100 px-3 py-2"
              onMouseDown={() => handleSelect(option)}
              role="option"
              aria-selected={option === value}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
      
      {/* Show no results message only if we're actually searching */}
      {isOpen && shouldSearch && searchTerm && filteredOptions.length === 0 && !isLoading && (
        <p className="text-xs text-gray-500 mt-1" role="status">
          No matching options found
        </p>
      )}
    </div>
  );
}