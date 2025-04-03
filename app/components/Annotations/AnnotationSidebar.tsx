// AnnotationSidebar.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Annotation } from '@/app/components/types';

interface AnnotationSidebarProps {
  annotations: Annotation[];
  isLoading?: boolean;
  onDeleteAnnotation?: (id: string) => void;
  onEditAnnotation?: (annotation: Annotation) => void;
  onNavigateAnnotation?: (annotation: Annotation) => void;
  onNavigateToAnnotationList?: () => void;
  itemsPerPage?: number;
  isPreservedList?: boolean;
}

const AnnotationSidebar: React.FC<AnnotationSidebarProps> = ({
  annotations,
  isLoading = false,
  onDeleteAnnotation,
  onEditAnnotation,
  onNavigateAnnotation,
  itemsPerPage = 16,
  isPreservedList = false,
  onNavigateToAnnotationList

}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState<number | null>(null);
  const [filteredAnnotations, setFilteredAnnotations] = useState<Annotation[]>([]);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    annotationId: null as string | null
  });

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
                if (deleteModal.annotationId && onDeleteAnnotation) {
                  onDeleteAnnotation(deleteModal.annotationId);
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

  const initialLoadRef = useRef(true);

  useEffect(() => {

    // Filter out deleted annotations
    const activeAnnotations = annotations.filter(a => !a.deleted);
    setFilteredAnnotations(activeAnnotations);
    
    // Calculate if we should keep the current page or reset
    const newTotalPages = Math.max(1, Math.ceil(activeAnnotations.length / itemsPerPage));
    
    // Only reset to first page if:
    // 1. It's the first load
    // 2. Current page would be out of bounds with new data
    if (initialLoadRef.current || currentPage > newTotalPages) {
      setCurrentPage(1);
      initialLoadRef.current = false;
    }
    // Otherwise, maintain the current page
  }, [annotations, itemsPerPage]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredAnnotations.length / itemsPerPage));
  
  // Page navigation
  const handlePrevPage = () => {
    setCurrentPage(prev => prev > 1 ? prev - 1 : prev);
    setSelectedAnnotationIndex(null);
  };

  const handleNextPage = () => {
    setCurrentPage(prev => prev < totalPages ? prev + 1 : prev);
    setSelectedAnnotationIndex(null);
  };

  // Get current page annotations
  const indexOfLastAnnotation = currentPage * itemsPerPage;
  const indexOfFirstAnnotation = indexOfLastAnnotation - itemsPerPage;
  const currentAnnotations = filteredAnnotations.slice(
    indexOfFirstAnnotation, 
    indexOfLastAnnotation
  );
  
  // Handle annotation selection
  const handleAnnotationSelect = (annotation: Annotation, localIndex: number) => {
    setSelectedAnnotationIndex(localIndex);
    onNavigateAnnotation?.(annotation);
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center h-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-gray-500">Loading annotations...</p>
        </div>
      </div>
    );
  }

  if (filteredAnnotations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 h-full flex items-center justify-center">
        No annotations found
      </div>
    );
  }

  // Function to get the first showing and last showing item numbers
  const getItemRange = () => {
    const firstItem = indexOfFirstAnnotation + 1;
    const lastItem = Math.min(indexOfLastAnnotation, filteredAnnotations.length);
    return `${firstItem}-${lastItem}`;
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full">
      {/* Header with Title and Count */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h4 className="text-base font-semibold text-gray-900 flex items-center">
          Annotations 
          <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
            {filteredAnnotations.length}
          </span>
              {/* Navigation arrows for annotations */}
    <div className="flex items-center ml-2">
      <button
        onClick={() => {
          if (selectedAnnotationIndex !== null && selectedAnnotationIndex > 0) {
            const newIndex = selectedAnnotationIndex - 1;
            setSelectedAnnotationIndex(newIndex);
            const annotation = currentAnnotations[newIndex];
            onNavigateAnnotation?.(annotation);
          } else if (currentPage > 1) {
            // Navigate to previous page and select last item
            const newPage = currentPage - 1;
            setCurrentPage(newPage);
            const pageAnnotations = filteredAnnotations.slice(
              (newPage - 1) * itemsPerPage, 
              newPage * itemsPerPage
            );
            const lastIndex = pageAnnotations.length - 1;
            setSelectedAnnotationIndex(lastIndex);
            onNavigateAnnotation?.(pageAnnotations[lastIndex]);
          }
        }}
        disabled={
          (selectedAnnotationIndex === null || selectedAnnotationIndex === 0) && 
          currentPage === 1
        }
        className={`p-1 rounded-full ${
          (selectedAnnotationIndex === null || selectedAnnotationIndex === 0) && currentPage === 1
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-blue-500 hover:bg-blue-100'
        }`}
        title="Previous annotation"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>
      
      <button
        onClick={() => {
          if (selectedAnnotationIndex !== null && selectedAnnotationIndex < currentAnnotations.length - 1) {
            const newIndex = selectedAnnotationIndex + 1;
            setSelectedAnnotationIndex(newIndex);
            const annotation = currentAnnotations[newIndex];
            onNavigateAnnotation?.(annotation);
          } else if (currentPage < totalPages) {
            // Navigate to next page and select first item
            const newPage = currentPage + 1;
            setCurrentPage(newPage);
            const pageAnnotations = filteredAnnotations.slice(
              (newPage - 1) * itemsPerPage, 
              newPage * itemsPerPage
            );
            setSelectedAnnotationIndex(0);
            onNavigateAnnotation?.(pageAnnotations[0]);
          }
        }}
        disabled={
          (selectedAnnotationIndex === null || selectedAnnotationIndex === currentAnnotations.length - 1) && 
          currentPage === totalPages
        }
        className={`p-1 rounded-full ${
          (selectedAnnotationIndex === null || selectedAnnotationIndex === currentAnnotations.length - 1) && currentPage === totalPages
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-blue-500 hover:bg-blue-100'
        }`}
        title="Next annotation"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
        </h4>
        {isPreservedList && onNavigateToAnnotationList && (
          <button
          onClick={onNavigateToAnnotationList}
          className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full flex items-center transition-colors"
          title="View all annotations in their full date range"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </button>
        )}
      </div>
  
      {/* Annotations List - Compact */}
      <div className="flex-grow overflow-y-auto">
        {currentAnnotations.map((annotation, localIndex) => {

          const borderColorClass = annotation.color ? '' : 'border-gray-300';
          const borderStyle = annotation.color ? { borderLeftColor: annotation.color } : {};

          return (
            <div 
              key={annotation.id} 
              className={`px-2 py-2 hover:bg-gray-50 transition-colors cursor-pointer border-l-6 ${
                selectedAnnotationIndex === localIndex 
                  ? `${borderColorClass} bg-blue-50` 
                  : `${borderColorClass} border-opacity-50`
              }`}
              style={borderStyle}
              onClick={() => handleAnnotationSelect(annotation, localIndex)}
            >
              {/* Compact Annotation Content - 1-2 lines only */}
              <div className="flex justify-between items-center">
                <div className="flex items-center overflow-hidden">
                  <span className="text-xs font-medium text-gray-900 capitalize mr-2 whitespace-nowrap">
                    {annotation.annotationType || 'Unknown'}
                  </span>
                </div>
                
                {/* Edit/Delete Buttons - Smaller */}
                <div className="flex space-x-1 ml-1 flex-shrink-0">
                  {onEditAnnotation && annotation.id &&(
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditAnnotation(annotation);
                      }}
                      className="text-blue-500 hover:text-blue-700 p-0.5 hover:bg-blue-50 rounded"
                      title="Edit Annotation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.379-8.379-2.828-2.828z" />
                      </svg>
                    </button>
                  )}
                  {onDeleteAnnotation && annotation.id && (
                    <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModal({
                        isOpen: true,
                        annotationId: annotation.id!
                      });
                    }}
                    className="text-red-500 hover:text-red-700 p-0.5 hover:bg-red-50 rounded"
                    title="Delete Annotation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
  
      {/* Page Navigation with Items Per Page Display */}
      {filteredAnnotations.length > itemsPerPage && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Showing {getItemRange()} of {filteredAnnotations.length}
          </span>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePrevPage}
              className={`text-gray-600 hover:text-gray-900 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Previous Page"
              disabled={currentPage === 1}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs text-gray-500">
              {currentPage} / {totalPages}
            </span>
            <button 
              onClick={handleNextPage}
              className={`text-gray-600 hover:text-gray-900 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Next Page"
              disabled={currentPage === totalPages}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <DeleteConfirmationModal />
    </div>
  );
};

export default AnnotationSidebar;