// components/FieldDropdown.tsx
import React from 'react';

interface FieldDropdownProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
}

export default function FieldDropdown({
  id,
  label,
  value,
  onChange,
  options,
  disabled = false
}: FieldDropdownProps) {
  return (

      
      <div className="relative flex-grow">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}:
      </label>
        <select
          id={id}
          className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 bg-white rounded-md shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    appearance-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          disabled={disabled}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 text-gray-700">
          <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

  );
}