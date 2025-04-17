// AnnotationSidebar.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Annotation } from '@/app/types/types';

interface AnnotationSidebarProps {
  annotations: Annotation[]; // This list is now controlled by the parent
  isLoading?: boolean;
  itemsPerPage?: number;
  onDateRangeChange?: (startDate: string, endDate: string) => void; // Provided by parent
}

const AnnotationSidebar: React.FC<AnnotationSidebarProps> = ({
  annotations, // Directly use the prop passed from the parent
  isLoading,
  itemsPerPage = 16,
  onDateRangeChange,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  // Store the GLOBAL index of the selected annotation relative to the FULL 'annotations' prop list
  const [selectedAnnotationGlobalIndex, setSelectedAnnotationGlobalIndex] = useState<number | null>(null);

  // Reference to the previous annotations length to detect external changes
  const prevAnnotationsLengthRef = useRef(annotations.length);

  // --- Effect to reset page/selection when the list *actually* changes from parent ---
  useEffect(() => {
      // If the list length changes OR if the list identity changes (safer check)
      // and it wasn't just an internal page change, reset.
      // Compare lengths as a simple proxy for external list changes.
      // A more robust check might involve comparing IDs if lengths can be the same but content differs.
      if (annotations.length !== prevAnnotationsLengthRef.current) {
          console.log("Sidebar: Detected external annotation list change. Resetting view.");
          setCurrentPage(1);
          setSelectedAnnotationGlobalIndex(null);
          prevAnnotationsLengthRef.current = annotations.length; // Update ref
      }
      // Optional: If you want to reset even if the list content changes but length stays the same,
      // you might need a deep comparison or rely on the parent adding a key prop.
      // For now, length change is a decent heuristic for external updates.

  }, [annotations]); // Depend only on the annotations prop

  // Effect to keep currentPage within bounds if annotations or itemsPerPage changes
  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(annotations.length / itemsPerPage));
    if (annotations.length > 0 && currentPage > newTotalPages) {
        setCurrentPage(newTotalPages); // Adjust if current page becomes invalid
    } else if (annotations.length === 0 && currentPage !== 1) {
        setCurrentPage(1); // Reset to 1 if list becomes empty
    }
  }, [annotations, itemsPerPage, currentPage]);


  // --- Pagination Calculations ---
  const totalPages = Math.max(1, Math.ceil(annotations.length / itemsPerPage));
  const indexOfLastAnnotation = currentPage * itemsPerPage;
  const indexOfFirstAnnotation = indexOfLastAnnotation - itemsPerPage;
  // Slice the annotations prop directly
  const currentAnnotationsOnPage = annotations.slice(
    indexOfFirstAnnotation,
    indexOfLastAnnotation
  );

  // --- Navigation and Selection ---

  // Function to trigger parent reload centered on the annotation
  const triggerParentReload = (annotation: Annotation) => {
    const startDate = new Date(annotation.startDate);
    const endDate = new Date(annotation.endDate);
    const duration = endDate.getTime() - startDate.getTime();
    const offset = Math.max(duration * 0.1, 60000); // Min 1 min offset
    const adjustedStartDate = new Date(startDate.getTime() - offset);
    const adjustedEndDate = new Date(endDate.getTime() + offset);

    if (onDateRangeChange) {
        // Call the handler provided by the parent (which now sets the ref in parent)
        onDateRangeChange(adjustedStartDate.toISOString(), adjustedEndDate.toISOString());
    }
  };

  // Select annotation by clicking on its item in the list
  const handleAnnotationSelect = (annotation: Annotation, localIndexOnPage: number) => {
    const globalIndex = indexOfFirstAnnotation + localIndexOnPage;
    setSelectedAnnotationGlobalIndex(globalIndex);
    triggerParentReload(annotation);
  };

  // Previous Annotation Button
  const handlePrevAnnotation = () => {
    if (annotations.length === 0) return;

    let targetGlobalIndex: number | null = null;

    if (selectedAnnotationGlobalIndex !== null) {
      targetGlobalIndex = selectedAnnotationGlobalIndex - 1;
    } else {
      // If nothing selected, target the last item on the *current* page
       targetGlobalIndex = Math.min(indexOfLastAnnotation, annotations.length) -1;
       // Ensure index is not negative if current page is empty but list isn't
       targetGlobalIndex = Math.max(0, targetGlobalIndex);
    }


    if (targetGlobalIndex !== null && targetGlobalIndex >= 0) {
      const targetAnnotation = annotations[targetGlobalIndex];
      const targetPage = Math.floor(targetGlobalIndex / itemsPerPage) + 1;
      if (targetPage < currentPage) {
          setCurrentPage(targetPage); // Move to the correct page
      }
      setSelectedAnnotationGlobalIndex(targetGlobalIndex);
      triggerParentReload(targetAnnotation);
    }
  };

  // Next Annotation Button
  const handleNextAnnotation = () => {
    if (annotations.length === 0) return;

    let targetGlobalIndex: number | null = null;

    if (selectedAnnotationGlobalIndex !== null) {
      targetGlobalIndex = selectedAnnotationGlobalIndex + 1;
    } else {
      // If nothing selected, target the first item on the *current* page
      targetGlobalIndex = indexOfFirstAnnotation;
    }

    if (targetGlobalIndex !== null && targetGlobalIndex < annotations.length) {
      const targetAnnotation = annotations[targetGlobalIndex];
      const targetPage = Math.floor(targetGlobalIndex / itemsPerPage) + 1;
       if (targetPage > currentPage) {
           setCurrentPage(targetPage); // Move to the correct page
       }
      setSelectedAnnotationGlobalIndex(targetGlobalIndex);
      triggerParentReload(targetAnnotation);
    }
  };

  // Page navigation (does NOT trigger parent reload)
  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    // Decide if changing page should clear selection (optional)
    // setSelectedAnnotationGlobalIndex(null);
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    // Decide if changing page should clear selection (optional)
    // setSelectedAnnotationGlobalIndex(null);
  };


  // --- Rendering Logic ---

  if (isLoading && annotations.length === 0) {
     return <div className="p-4 text-center text-gray-500 h-full flex items-center justify-center">Loading annotations...</div>;
  }

  if (!isLoading && annotations.length === 0) {
    return <div className="p-4 text-center text-gray-500 h-full flex items-center justify-center">No annotations found.</div>;
  }

  const getItemRange = () => {
    if (annotations.length === 0) return "0-0";
    const firstItem = Math.max(1, indexOfFirstAnnotation + 1);
    const lastItem = Math.min(indexOfLastAnnotation, annotations.length);
    return `${firstItem}-${lastItem}`;
  };

  // Calculate local index on the current page for highlighting
  const getLocalIndexOnPage = (globalIndex: number | null): number | null => {
      if (globalIndex === null) return null;
      const localIndex = globalIndex - indexOfFirstAnnotation;
      // Check if the selected item is actually on the current page
      if (localIndex >= 0 && localIndex < itemsPerPage) {
          return localIndex;
      }
      return null; // Selected item is not on the current page
  }
  const currentLocalSelectedIndex = getLocalIndexOnPage(selectedAnnotationGlobalIndex);

  const isPrevDisabled = selectedAnnotationGlobalIndex !== null ? selectedAnnotationGlobalIndex <= 0 : annotations.length === 0;
  const isNextDisabled = selectedAnnotationGlobalIndex !== null ? selectedAnnotationGlobalIndex >= annotations.length - 1 : annotations.length === 0;


  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full">
      {/* Header */}
       <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h4 className="text-base font-semibold text-gray-900 flex items-center">
            Annotations
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {annotations.length} {/* Use prop length */}
            </span>
            {/* Navigation arrows */}
            <div className="flex items-center ml-2">
               <button
                 onClick={handlePrevAnnotation}
                 disabled={isPrevDisabled}
                 className={`p-1 rounded-full ${ isPrevDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-100'}`}
                 title="Previous annotation"
               >
                 {/* SVG Left */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
               </button>
               <button
                  onClick={handleNextAnnotation}
                  disabled={isNextDisabled}
                  className={`p-1 rounded-full ${ isNextDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-100'}`}
                  title="Next annotation"
               >
                  {/* SVG Right */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
               </button>
            </div>
          </h4>
        </div>

      {/* List */}
      <div className="flex-grow overflow-y-auto">
        {/* Use currentAnnotationsOnPage derived directly from props */}
        {currentAnnotationsOnPage.map((annotationItem, localIndexOnPage) => {
          const borderColorClass = annotationItem.color ? '' : 'border-gray-300';
          const borderStyle = annotationItem.color ? { borderLeftColor: annotationItem.color } : {};
          const isSelected = currentLocalSelectedIndex === localIndexOnPage;

          return (
            <div
              key={annotationItem.id} // Use unique ID
              className={`px-2 py-2 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                isSelected
                  ? `${borderColorClass} bg-blue-50 font-semibold`
                  : `${borderColorClass} border-opacity-50`
              }`}
              style={borderStyle}
              onClick={() => handleAnnotationSelect(annotationItem, localIndexOnPage)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center overflow-hidden">
                  <span className={`text-xs ${isSelected ? 'text-blue-900' : 'text-gray-900'} capitalize mr-2 whitespace-nowrap`}>
                    {annotationItem.annotationType || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
         {/* Display message if current page is empty but there are annotations */}
         {!isLoading && annotations.length > 0 && currentAnnotationsOnPage.length === 0 && currentPage > 1 && (
              <div className="p-4 text-center text-gray-500">No annotations on this page.</div>
         )}
      </div>

      {/* Pagination */}
      {annotations.length > itemsPerPage && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
          <span className="text-xs text-gray-500">
            Showing {getItemRange()} of {annotations.length}
          </span>
          <div className="flex items-center space-x-2">
             <button
               onClick={handlePrevPage}
               className={`p-1 rounded hover:bg-gray-200 ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'}`}
               title="Previous Page"
               disabled={currentPage === 1}
             >
                {/* SVG Left */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
             </button>
             <span className="text-xs text-gray-700 font-medium tabular-nums">
               {currentPage} / {totalPages}
             </span>
             <button
               onClick={handleNextPage}
               className={`p-1 rounded hover:bg-gray-200 ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'}`}
               title="Next Page"
               disabled={currentPage === totalPages}
             >
                {/* SVG Right */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationSidebar;