// components/AnnotationDetails.tsx
'use client';

import { AnnotationStatus } from '@/app/components/types';

interface AnnotationDetailsProps {
  selectedAnnotation?: any | null;
  userRole?: string;
  onApprovalComplete?: () => void;
}

export default function AnnotationDetails({ 
  selectedAnnotation,
  userRole,
  onApprovalComplete
}: AnnotationDetailsProps) {
  
  const isApprover = userRole === "admin";
  
  if (!selectedAnnotation) return null;
  
  // Function to handle approval actions
  const handleApproval = async (annotationId: string, action: Extract<AnnotationStatus, 'approved' | 'rejected'>) => {
    try {
      const response = await fetch(`/api/annotations/${annotationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: action }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Success:', data);
      
      // Call the callback if provided
      if (onApprovalComplete) {
        onApprovalComplete();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return ( 
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md ">
        {/* All details in a single row with flex layout */}
        <div className="whitespace-nowrap">
          <span className="text-gray-700">Indicator:</span>{' '}
          <span className="font-semibold">{selectedAnnotation.indicator || 'N/A'}</span>
        </div>
        
        <div className="whitespace-nowrap">
          <span className="text-gray-700">Type:</span>{' '}
          <span className="font-semibold">{selectedAnnotation.annotationType || 'N/A'}</span>
        </div>

        <div className="whitespace-nowrap">
          <span className="text-gray-700">Recommendation:</span>{' '}
          <span className="font-semibold">{selectedAnnotation.recommendation || 'N/A'}</span>
        </div>
        
        {/* Status badge */}
        <div className="whitespace-nowrap">
          <span className="text-gray-700">Status:</span>{' '}
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(selectedAnnotation.status)}`}>
            {selectedAnnotation.status || 'Unknown'}
          </span>
        </div>
        
        {/* Approval actions for approvers - pushed to the right */}
        {isApprover && selectedAnnotation.status === 'created' && (
          <div className="ml-auto flex space-x-2">
            <button 
              className="px-2 py-0.5 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
              onClick={() => handleApproval(selectedAnnotation.id, 'approved')}
            >
              Approve
            </button>
            <button 
              className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
              onClick={() => handleApproval(selectedAnnotation.id, 'rejected')}
            >
              Reject
            </button>
          </div>
        )}
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