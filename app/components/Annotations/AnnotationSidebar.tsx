// AnnotationSidebar.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Annotation } from '@/app/components/types';

interface AnnotationSidebarProps {
  annotations: Annotation[];
  isLoading?: boolean;
  onNavigateAnnotation?: (annotation: Annotation) => void;
  itemsPerPage?: number;

}

const AnnotationSidebar: React.FC<AnnotationSidebarProps> = ({
  annotations,
  isLoading = false,
  onNavigateAnnotation,
  itemsPerPage = 16,

}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState<number | null>(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    annotationId: null as string | null
  });


  const initialLoadRef = useRef(true);

  useEffect(() => {

    // Calculate if we should keep the current page or reset
    const newTotalPages = Math.max(1, Math.ceil(annotations.length / itemsPerPage));
    
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
  const totalPages = Math.max(1, Math.ceil(annotations.length / itemsPerPage));
  
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
  const currentAnnotations = annotations.slice(
    indexOfFirstAnnotation, 
    indexOfLastAnnotation
  );
  
  // Handle annotation selection
  const handleAnnotationSelect = (annotation: Annotation, localIndex: number) => {
    setSelectedAnnotationIndex(localIndex);
    onNavigateAnnotation?.(annotation);
  };


  if (annotations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 h-full flex items-center justify-center">
        No annotations found
      </div>
    );
  }

  // Function to get the first showing and last showing item numbers
  const getItemRange = () => {
    const firstItem = indexOfFirstAnnotation + 1;
    const lastItem = Math.min(indexOfLastAnnotation, annotations.length);
    return `${firstItem}-${lastItem}`;
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full">
      {/* Header with Title and Count */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h4 className="text-base font-semibold text-gray-900 flex items-center">
          Annotations 
          <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
            {annotations.length}
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
            const pageAnnotations = annotations.slice(
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
            const pageAnnotations = annotations.slice(
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
                
              </div>
            </div>
          );
        })}
      </div>
  
      {/* Page Navigation with Items Per Page Display */}
      {annotations.length > itemsPerPage && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Showing {getItemRange()} of {annotations.length}
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
    </div>
  );
};

export default AnnotationSidebar;