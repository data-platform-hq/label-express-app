// components/AnnotationDetails.tsx
'use client';

import { AnnotationStatus } from '@/app/components/types';

interface AnnotationDetailsProps {
  selectedAnnotation?: any | null;
  userRole?: string;
  onApproval?: (id: string, status: AnnotationStatus) => void;
  sidebarOpen: boolean;
}

export default function AnnotationDetails({ 
  selectedAnnotation,
  userRole,
  onApproval,
  sidebarOpen 
}: AnnotationDetailsProps) {
  
  const isApprover = userRole === "admin";
  
  if (!selectedAnnotation) return null;
  
  // Only show details when sidebar is closed or explicitly handle both states
  if (!sidebarOpen) {
    // You could return a more compact version when sidebar is open
    // or return null if you don't want to show anything when sidebar is open
    return null;
  }

  return ( 
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md p-2 bg-white shadow-sm">
      {/* All details in a single row with flex layout */}
      <div className="whitespace-nowrap">
        <span className="text-gray-700">Type:</span>{' '}
        <span className="font-semibold">{selectedAnnotation.annotationType || 'N/A'}</span>
      </div>
      
      <div className="whitespace-nowrap">
        <span className="text-gray-700">Indicator:</span>{' '}
        <span className="font-semibold">{selectedAnnotation.indicator || 'N/A'}</span>
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
            onClick={() => onApproval && onApproval(selectedAnnotation.id, 'approved')}
          >
            Approve
          </button>
          <button 
            className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
            onClick={() => onApproval && onApproval(selectedAnnotation.id, 'rejected')}
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