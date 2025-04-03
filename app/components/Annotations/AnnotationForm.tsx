// components/AnnotationForm.tsx
import React, { useState } from 'react';
import { 
  annotationTypeOptions, 
  indicatorOptions, 
  recommendationOptions 
} from '@/app/components/Annotations/annotationOptions';

interface AnnotationFormProps {
  startDate: string | "";
  endDate: string | "";
  onSubmit: (annotationData: {
    annotationType: string;
    indicator: string;
    recommendation: string;
    description: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function AnnotationForm({
  startDate,
  endDate,
  onSubmit,
  onCancel
}: AnnotationFormProps) {
  // State for form fields
  const [annotationType, setAnnotationType] = useState('');
  const [indicator, setIndicator] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annotationType) {
      setError('Annotation type is required');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        annotationType,
        indicator,
        recommendation,
        description
      });
    } catch (err) {
      setError('Failed to save annotation. Please try again.');
      setIsSubmitting(false);
    }
  };

    // Create a reusable dropdown component
    const DropdownSelect = ({ 
      id, 
      label, 
      value, 
      onChange, 
      options, 
      required = false 
    }: {
      id: string;
      label: string;
      value: string;
      onChange: (value: string) => void;
      options: { value: string; label: string }[];
      required?: boolean;
    }) => (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            id={id}
            className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 bg-white rounded-md shadow-sm 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      appearance-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={isSubmitting}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-2 bg-red-50 text-red-700 border border-red-200 rounded text-sm">
          {error}
        </div>
      )}
      
      {/* Annotation Type Dropdown */}
      <DropdownSelect
        id="annotationType"
        label="Annotation Type"
        value={annotationType}
        onChange={setAnnotationType}
        options={annotationTypeOptions}
        required={true}
      />
      
      {/* Annotation Indicator Dropdown */}
      <DropdownSelect
        id="indicator"
        label="Annotation Indicator"
        value={indicator}
        onChange={setIndicator}
        options={indicatorOptions}
      />
      
      {/* Annotation Recommendation Dropdown */}
      <DropdownSelect
        id="recommendation"
        label="Annotation Recommendation"
        value={recommendation}
        onChange={setRecommendation}
        options={recommendationOptions}
      />
      
      {/* Description/Comment Text Area */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Comment/Description
        </label>
        <textarea
          id="description"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add additional details about this annotation"
          rows={3}
          disabled={isSubmitting}
        />
      </div>
       
      {/* Form Buttons */}
      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!annotationType || isSubmitting}
          className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
            annotationType && !isSubmitting
              ? 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500' 
              : 'bg-green-300 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            'Create Annotation'
          )}
        </button>
      </div>
    </form>
  );
}