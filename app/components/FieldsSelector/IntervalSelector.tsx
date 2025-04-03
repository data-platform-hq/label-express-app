// components/IntervalSelector.tsx
import React from 'react';
import { getIntervalOptions } from '@/app/components/FieldsSelector/intervalUtils';

interface IntervalSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  useAutoInterval?: boolean;
}

export default function IntervalSelector({ 
  value, 
  onChange, 
  disabled = false,
  useAutoInterval = true,
}: IntervalSelectorProps) {
  const intervalOptions = getIntervalOptions();
  
  // Compact version for single line layout
  return (
    <div>
      <div className="flex justify-between items-center">
        <label htmlFor="interval" className="block text-sm font-medium text-gray-700 mb-1">
          Time Interval
        </label>
        {useAutoInterval && (
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={value === 'auto'}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange('auto');
                } else {
                  onChange('1d'); // Default when turning off auto
                }
              }}
              disabled={disabled}
            />
            <div className="relative w-7 h-4 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-disabled:bg-gray-300">
              <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-3 w-3 transition-all ${value === 'auto' ? 'translate-x-3' : ''}`}></div>
            </div>
            <span className="ml-1 text-xs text-gray-600">Auto</span>
          </label>
        )}
      </div> 
      {value === 'auto' ? (
        // When auto is selected, show a button to turn it off
        <button
          type="button"
          onClick={() => onChange('1d')}
          className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 bg-white rounded-md shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    appearance-none"
          disabled={disabled}
        >
          Auto
        </button>
      ) : (
        // When manual interval is selected, show the dropdown
        <div className="relative">
          <select
            id="interval"
            className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 bg-white rounded-md shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    appearance-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required
            disabled={disabled}
          >
            {intervalOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}