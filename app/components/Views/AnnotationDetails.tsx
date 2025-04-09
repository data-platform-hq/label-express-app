// components/AnnotationDetails.tsx
'use client';

import { useState, useEffect } from 'react';
import { AnnotationStatus } from '@/app/components/types';
import { 
  annotationTypeOptions, 
  indicatorOptions, 
  recommendationOptions,
  OptionType
} from '@/app/components/Annotations/annotationOptions';

interface AnnotationDetailsProps {
  selectedAnnotation?: any | null;
  user?: any;
  onApproval?: (id: string, updates?: any) => void;
  sidebarOpen: boolean;
}

export default function AnnotationDetails({ 
  selectedAnnotation,
  user,
  onApproval,
  sidebarOpen 
}: AnnotationDetailsProps) {

  console.log('AnnotationDetails', { user});
  
  const isAdmin = user?.role === "admin";
  
  // State for editable fields (for admins)
  const [editableType, setEditableType] = useState<string>('');
  const [editableIndicator, setEditableIndicator] = useState<string>('');
  const [editableRecommendation, setEditableRecommendation] = useState<string>('');
  
  // Update local state when selected annotation changes
  useEffect(() => {
    if (selectedAnnotation) {
      setEditableType(selectedAnnotation.annotationType || '');
      setEditableIndicator(selectedAnnotation.indicator || '');
      setEditableRecommendation(selectedAnnotation.recommendation || '');
    }
  }, [selectedAnnotation]);
  
  if (!selectedAnnotation) return null;
  
  // Only show details when sidebar is open
  if (!sidebarOpen) {
    return null;
  }
  
  // Handle approval with current editable values
  const handleApprove = () => {
    if (onApproval && selectedAnnotation.id) {
      const updates = {
        annotationType: editableType,
        indicator: editableIndicator,
        recommendation: editableRecommendation,
        status: 'approved',
        updatedBy: {email: user?.email, name: user?.name, role: user?.role, id: user?.id},
        updatedAt: new Date().toISOString()
      };
      onApproval(selectedAnnotation.id, updates);
    }
  };
  
  // Handle rejection with current editable values
  const handleReject = () => {
    if (onApproval && selectedAnnotation.id) {
      const updates = {
        annotationType: editableType,
        indicator: editableIndicator,
        recommendation: editableRecommendation,
        status: 'rejected',
        updatedBy: {email: user?.email, name: user?.name, role: user?.role, id: user?.id},
        updatedAt: new Date().toISOString()
      };
      onApproval(selectedAnnotation.id, updates);
    }
  };

  return ( 
    <div className="p-2 bg-white shadow-sm border-t border-gray-200">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {/* Type field */}
        <div className="whitespace-nowrap">
          <span className="text-gray-700">Type:</span>{' '}
          {isAdmin ? (
            <select
              value={editableType}
              onChange={(e) => setEditableType(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500 ml-1"
            >
              <option value="">Select</option>
              {annotationTypeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          ) : (
            <span className="font-semibold">
              {getOptionLabel(annotationTypeOptions, selectedAnnotation.annotationType) || 'N/A'}
            </span>
          )}
        </div>
        
        {/* Indicator field */}
        <div className="whitespace-nowrap">
          <span className="text-gray-700">Indicator:</span>{' '}
          {isAdmin ? (
            <select
              value={editableIndicator}
              onChange={(e) => setEditableIndicator(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500 ml-1"
            >
              <option value="">Select</option>
              {indicatorOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          ) : (
            <span className="font-semibold">
              {getOptionLabel(indicatorOptions, selectedAnnotation.indicator) || 'N/A'}
            </span>
          )}
        </div>
        
        {/* Recommendation field */}
        <div className="whitespace-nowrap">
          <span className="text-gray-700">Recommendation:</span>{' '}
          {isAdmin ? (
            <select
              value={editableRecommendation}
              onChange={(e) => setEditableRecommendation(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500 ml-1"
            >
              <option value="">Select</option>
              {recommendationOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          ) : (
            <span className="font-semibold">
              {getOptionLabel(recommendationOptions, selectedAnnotation.recommendation) || 'N/A'}
            </span>
          )}
        </div>
        
        {/* Status badge */}
        <div className="whitespace-nowrap">
          <span className="text-gray-700">Status:</span>{' '}
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(selectedAnnotation.status)}`}>
            {selectedAnnotation.status || 'Unknown'}
          </span>
        </div>
        
        {/* Approval buttons for admins - only show for 'created' status */}
        {isAdmin && selectedAnnotation.status === 'created' && (
          <div className="ml-auto flex space-x-2">
            <button 
              className="px-2 py-0.5 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
              onClick={handleApprove}
            >
              Approve
            </button>
            <button 
              className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
              onClick={handleReject}
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get status color
function getStatusColor(status: AnnotationStatus | string): string {
  switch (status as AnnotationStatus) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'created':
      return 'bg-yellow-100 text-yellow-800';
    case 'deleted':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Helper function to get label for a value from options
function getOptionLabel(options: OptionType[], value: string): string {
  const option = options.find(opt => opt.value === value);
  return option ? option.label : value;
}