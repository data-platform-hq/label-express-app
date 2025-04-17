//app/components/Views/AnnotationView.tsx

import { Annotation, AnnotationStatus } from '@/app/types/types';
import { useState } from 'react';

interface AnnotationViewProps {
  onUpdateAnnotation?: (id: string, actionType: string, update: any) => void;
  onDeleteAnnotation?: (id: string) => void;
  selectedAnnotation: Annotation | null;
}

export default function AnnotationView({
  onUpdateAnnotation,
  onDeleteAnnotation,
  selectedAnnotation,
}: AnnotationViewProps) {
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    annotationId: null as string | null
  });

  const [editModal, setEditModal] = useState({
    isOpen: false,
    annotation: null as Annotation | null
  });

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

  // Helper function to format date in a more readable way
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Custom Delete Confirmation Modal
  const DeleteConfirmationModal = () => {
    if (!deleteModal.isOpen) return null;
    
    return (
      <div className="fixed inset-0 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center mb-4">
            <div className="bg-red-100 rounded-full p-2 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Delete Annotation</h3>
          </div>
          
          <p className="text-sm text-gray-500 mb-5">
            Are you sure you want to delete this annotation?
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setDeleteModal({ isOpen: false, annotationId: null })}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (deleteModal.annotationId && onUpdateAnnotation) {
                  onUpdateAnnotation(deleteModal.annotationId, 'delete', {});
                  //onDeleteAnnotation(deleteModal.annotationId);
                  setDeleteModal({ isOpen: false, annotationId: null });
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Edit Annotation Modal
  const EditAnnotationModal = () => {
    if (!editModal.isOpen || !editModal.annotation) return null;
    
    // You can add form fields here to edit the annotation
    const [editedAnnotation, setEditedAnnotation] = useState({
      ...editModal.annotation
    });
    
    return (
      <div className="fixed inset-0 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 rounded-full p-2 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Edit Annotation</h3>
          </div>
          
          {/* Add your edit form fields here */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <input 
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={editedAnnotation.annotationType || ''}
              onChange={(e) => setEditedAnnotation({
                ...editedAnnotation,
                annotationType: e.target.value
              })}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={editedAnnotation.description || ''}
              rows={3}
              onChange={(e) => setEditedAnnotation({
                ...editedAnnotation,
                description: e.target.value
              })}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={editedAnnotation.status}
              onChange={(e) => setEditedAnnotation({
                ...editedAnnotation,
                status: e.target.value as AnnotationStatus
              })}
            >
              <option value="created">Created</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setEditModal({ isOpen: false, annotation: null })}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (editedAnnotation.id && onUpdateAnnotation) {
                  onUpdateAnnotation(editedAnnotation.id, 'update', editedAnnotation);
                  setEditModal({ isOpen: false, annotation: null });
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="text-sm text-gray-500 p-1">
      {selectedAnnotation ? (
        <div className="flex">
          {/* Left column - Annotation details in 2 rows */}
          <div className="flex-grow pr-4">
            <div>
              {/* First row */}
              <div className="flex space-x-4 mb-1">
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedAnnotation.status)}`}>
                  {selectedAnnotation.status}
                </span>
              </div>
              <div>
                <span className="font-medium">Type:</span> 
                <span className="ml-1">{selectedAnnotation.annotationType}</span>
              </div>
              <div>
                <span className="font-medium">Indicator:</span> 
                <span className="ml-1">{selectedAnnotation.indicator}</span>
              </div>
              <div>
                <span className="font-medium">Recommendation:</span> 
                <span className="ml-1">{selectedAnnotation.recommendation}</span>
              </div>                

                
               
              </div>     
              {/* Second row */}
              <div className="flex space-x-4">
              <div>
                <span className="font-medium">Range:</span>
                <span className="ml-1">{formatDate(selectedAnnotation.startDate)} - {formatDate(selectedAnnotation.endDate)}</span>
              </div>
              {selectedAnnotation.createdBy && (
                <div>
                  <span className="font-medium">Created by:</span>
                  <span className="ml-1">{selectedAnnotation.createdBy}</span>
                </div>
              )}
            </div>
            </div>
          </div>
          
          {/* Right column - Action buttons in one line */}
          <div className="flex-shrink-0 flex items-center space-x-2">
            {/* Approve Button */}
            <button
              onClick={() => {
                if (selectedAnnotation.id && onUpdateAnnotation) {
                  onUpdateAnnotation(selectedAnnotation.id, 'update', {
                    ...selectedAnnotation,
                    status: 'approved' as AnnotationStatus
                  });
                }
              }}
              disabled={selectedAnnotation.status === 'approved'}
              className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${
                selectedAnnotation.status === 'approved' 
                  ? 'bg-green-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
              }`}
              title="Approve Annotation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve
            </button>
            
            {/* Reject Button */}
            <button
              onClick={() => {
                if (selectedAnnotation.id && onUpdateAnnotation) {
                  onUpdateAnnotation(selectedAnnotation.id, 'update', {
                    ...selectedAnnotation,
                    status: 'rejected' as AnnotationStatus
                  });
                }
              }}
              disabled={selectedAnnotation.status === 'rejected'}
              className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${
                selectedAnnotation.status === 'rejected' 
                  ? 'bg-yellow-400 cursor-not-allowed' 
                  : 'bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500'
              }`}
              title="Reject Annotation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
            
            {/* Edit Button */}
            <button
              onClick={() => {
                setEditModal({
                  isOpen: true,
                  annotation: selectedAnnotation
                });
              }}
              className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Edit Annotation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            
            {/* Delete Button */}
            <button 
              onClick={() => {
                setDeleteModal({
                  isOpen: true,
                  annotationId: selectedAnnotation.id!
                });
              }}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              title="Delete Annotation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Delete
            </button>
          </div>
        </div>  
      ) : null }
      <DeleteConfirmationModal />
      <EditAnnotationModal />
    </div>
  );
}