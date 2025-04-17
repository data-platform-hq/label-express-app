// AnnotationSidebar.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Annotation } from '@/app/types/types'; // Assuming this path is correct

interface AnnotationSidebarProps {
  annotations: Annotation[]; // The potentially changing list from the parent
  isLoading?: boolean;
  itemsPerPage?: number;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
}

const AnnotationSidebar: React.FC<AnnotationSidebarProps> = ({
  annotations: annotationsProp, // Rename prop to avoid conflict with state
  isLoading,
  itemsPerPage = 16,
  onDateRangeChange,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState<number | null>(null);

  // State to hold the list currently displayed in the sidebar
  const [annotationList, setAnnotationList] = useState<Annotation[]>([]);

  // Ref to track if the component initiated the navigation/reload
  const isInternalNavigationRef = useRef(false);
  // Ref to track if it's the very first load of the component
  const isInitialLoadRef = useRef(true);

  // --- Effect to handle updates from the parent ---
  useEffect(() => {
    // If the flag is set, it means the parent reload was likely triggered
    // by this component's navigation. We want to *keep* the existing list.
    if (isInternalNavigationRef.current) {
      console.log("Sidebar: Ignoring prop update due to internal navigation.");
      // Reset the flag for the next potential external update
      isInternalNavigationRef.current = false;
      return; // Do not update annotationList from props
    }

    // If it's the initial load or an external update (not internal navigation),
    // update the list with the new props.
    console.log("Sidebar: Accepting prop update from parent.");
    setAnnotationList(annotationsProp);

    // Reset selection and page when the list is updated externally
    setSelectedAnnotationIndex(null);
    setCurrentPage(1); // Reset to first page on external data change

    // Mark initial load as complete after the first *external* update
    if (isInitialLoadRef.current) {
       isInitialLoadRef.current = false;
    }

  }, [annotationsProp]); // Dependency: This effect runs when the parent sends new annotations

  // --- Pagination calculations based on the *internal* list state ---
  const totalPages = Math.max(1, Math.ceil(annotationList.length / itemsPerPage));
  const indexOfLastAnnotation = currentPage * itemsPerPage;
  const indexOfFirstAnnotation = indexOfLastAnnotation - itemsPerPage;
  // Ensure slice indices are valid, especially during updates
  const currentAnnotations = annotationList.slice(
    Math.max(0, indexOfFirstAnnotation),
    Math.min(annotationList.length, indexOfLastAnnotation)
  );

   // Effect to keep currentPage within bounds if annotationList or itemsPerPage changes
   // This should run *after* the list might have been updated.
   useEffect(() => {
     const newTotalPages = Math.max(1, Math.ceil(annotationList.length / itemsPerPage));
     if (currentPage > newTotalPages) {
       setCurrentPage(newTotalPages); // Go to the last valid page
     }
     // Handle case where list becomes empty
     if (annotationList.length === 0 && currentPage !== 1) {
         setCurrentPage(1);
     }
   }, [annotationList, itemsPerPage, currentPage]);


  // --- Navigation and Selection Handlers ---

  // Function to call parent to reload data for a specific annotation
  const triggerParentReload = (annotation: Annotation) => {
    // Set the flag *before* calling the function that triggers the parent reload
    isInternalNavigationRef.current = true;
    console.log("Sidebar: Internal navigation triggered. Setting flag.");

    const startDate = new Date(annotation.startDate);
    const endDate = new Date(annotation.endDate);

    // Calculate the duration of the annotation
    const duration = endDate.getTime() - startDate.getTime();

    // Calculate offsets (e.g., 10% or a minimum like 1 minute)
    const offset = Math.max(duration * 0.1, 60000); // At least 1 minute offset

    // Apply offsets to create adjusted dates
    const adjustedStartDate = new Date(startDate.getTime() - offset);
    const adjustedEndDate = new Date(endDate.getTime() + offset);

    if (onDateRangeChange) {
      onDateRangeChange(adjustedStartDate.toISOString(), adjustedEndDate.toISOString());
    }
  };

  // Handle annotation selection by clicking on it
  const handleAnnotationSelect = (annotation: Annotation, localIndex: number) => {
    // Calculate the global index in the full annotationList
    const globalIndex = indexOfFirstAnnotation + localIndex;
    setSelectedAnnotationIndex(globalIndex); // Store global index relative to annotationList
    triggerParentReload(annotation);
  };

  // Handle Previous Annotation Button
  const handlePrevAnnotation = () => {
    if (annotationList.length === 0) return;

    let targetGlobalIndex: number | null = null;

    if (selectedAnnotationIndex !== null) {
      // If something is selected, try to go to the previous one
      targetGlobalIndex = selectedAnnotationIndex - 1;
    } else {
      // If nothing is selected, select the last item on the current page (or overall if only one page)
      targetGlobalIndex = Math.min(indexOfLastAnnotation, annotationList.length) - 1;
    }

    // Ensure the target index is valid
    if (targetGlobalIndex !== null && targetGlobalIndex >= 0) {
      const targetAnnotation = annotationList[targetGlobalIndex];
      // Check if the target index is on a previous page
      const targetPage = Math.floor(targetGlobalIndex / itemsPerPage) + 1;
      if (targetPage < currentPage) {
        setCurrentPage(targetPage);
      }
      setSelectedAnnotationIndex(targetGlobalIndex);
      triggerParentReload(targetAnnotation);
    }
  };

  // Handle Next Annotation Button
  const handleNextAnnotation = () => {
     if (annotationList.length === 0) return;

     let targetGlobalIndex: number | null = null;

     if (selectedAnnotationIndex !== null) {
       // If something is selected, try to go to the next one
       targetGlobalIndex = selectedAnnotationIndex + 1;
     } else {
       // If nothing is selected, select the first item on the current page
       targetGlobalIndex = indexOfFirstAnnotation;
     }

     // Ensure the target index is valid
     if (targetGlobalIndex !== null && targetGlobalIndex < annotationList.length) {
       const targetAnnotation = annotationList[targetGlobalIndex];
       // Check if the target index is on a subsequent page
       const targetPage = Math.floor(targetGlobalIndex / itemsPerPage) + 1;
       if (targetPage > currentPage) {
         setCurrentPage(targetPage);
       }
       setSelectedAnnotationIndex(targetGlobalIndex);
       triggerParentReload(targetAnnotation);
     }
  };


  // Page navigation (does NOT trigger parent reload, just changes view)
  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    // Optionally clear selection when changing pages via page buttons
    // setSelectedAnnotationIndex(null);
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    // Optionally clear selection when changing pages via page buttons
    // setSelectedAnnotationIndex(null);
  };


  // --- Rendering Logic ---

  if (!isLoading && annotationList.length === 0 && !isInitialLoadRef.current) {
    return (
      <div className="p-4 text-center text-gray-500 h-full flex items-center justify-center">
        No annotations found for the selected range.
      </div>
    );
  }

   if (isLoading && annotationList.length === 0) {
     return (
       <div className="p-4 text-center text-gray-500 h-full flex items-center justify-center">
         Loading annotations...
       </div>
     );
   }

  // Function to get the first showing and last showing item numbers
  const getItemRange = () => {
    if (annotationList.length === 0) return "0-0";
    const firstItem = Math.max(1, indexOfFirstAnnotation + 1);
    const lastItem = Math.min(indexOfLastAnnotation, annotationList.length);
    return `${firstItem}-${lastItem}`;
  };

  // Calculate local index for highlighting
  const getLocalIndex = (globalIndex: number | null) => {
      if (globalIndex === null) return null;
      const localIndex = globalIndex - indexOfFirstAnnotation;
      // Check if the selected item is actually on the current page
      if (localIndex >= 0 && localIndex < itemsPerPage) {
          return localIndex;
      }
      return null; // Selected item is not on the current page
  }
  const currentLocalSelectedIndex = getLocalIndex(selectedAnnotationIndex);

  // Determine disabled state for Prev/Next Annotation buttons
  const isPrevDisabled = selectedAnnotationIndex !== null ? selectedAnnotationIndex <= 0 : annotationList.length === 0;
  const isNextDisabled = selectedAnnotationIndex !== null ? selectedAnnotationIndex >= annotationList.length - 1 : annotationList.length === 0;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full">
      {/* Header with Title and Count */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
        <h4 className="text-base font-semibold text-gray-900 flex items-center">
          Annotations
          <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
            {annotationList.length}
          </span>
          {/* Navigation arrows for annotations */}
          <div className="flex items-center ml-2">
            <button
              onClick={handlePrevAnnotation}
              disabled={isPrevDisabled}
              className={`p-1 rounded-full ${
                isPrevDisabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-blue-500 hover:bg-blue-100'
              }`}
              title="Previous annotation"
            >
              {/* SVG Left Arrow */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </button>

            <button
               onClick={handleNextAnnotation}
               disabled={isNextDisabled}
              className={`p-1 rounded-full ${
                isNextDisabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-blue-500 hover:bg-blue-100'
              }`}
              title="Next annotation"
            >
              {/* SVG Right Arrow */}
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </button>
          </div>
        </h4>
      </div>

      {/* Annotations List - Compact */}
      <div className="flex-grow overflow-y-auto">
        {isLoading && <div className="p-4 text-center text-gray-400">Loading...</div>}
        {!isLoading && currentAnnotations.map((annotationItem, localIndex) => { // Renamed loop variable
          const borderColorClass = annotationItem.color ? '' : 'border-gray-300';
          const borderStyle = annotationItem.color ? { borderLeftColor: annotationItem.color } : {};
          const isSelected = currentLocalSelectedIndex === localIndex;

          return (
            <div
              key={annotationItem.id} // Use unique ID from annotation
              className={`px-2 py-2 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${ // Adjusted border thickness
                isSelected
                  ? `${borderColorClass} bg-blue-50 font-semibold` // Highlight selected
                  : `${borderColorClass} border-opacity-50`
              }`}
              style={borderStyle}
              onClick={() => handleAnnotationSelect(annotationItem, localIndex)}
            >
              {/* Compact Annotation Content */}
              <div className="flex justify-between items-center">
                <div className="flex items-center overflow-hidden">
                   <span className={`text-xs ${isSelected ? 'text-blue-900' : 'text-gray-900'} capitalize mr-2 whitespace-nowrap`}>
                    {annotationItem.annotationType || 'Unknown'}
                  </span>
                  {/* Optional: Add more details if needed, keep it compact */}
                  {/* <span className="text-xs text-gray-500 truncate">
                      {new Date(annotationItem.startDate).toLocaleString()}
                  </span> */}
                </div>
                 {/* Optional: Add indicator or action icon */}
              </div>
            </div>
          );
        })}
        {!isLoading && annotationList.length > 0 && currentAnnotations.length === 0 && currentPage > 1 &&
             <div className="p-4 text-center text-gray-500">No annotations on this page.</div>
        }
      </div>

      {/* Page Navigation */}
      {annotationList.length > itemsPerPage && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
          <span className="text-xs text-gray-500">
            Showing {getItemRange()} of {annotationList.length}
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              className={`p-1 rounded hover:bg-gray-200 ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'}`}
              title="Previous Page"
              disabled={currentPage === 1}
            >
              {/* SVG Left Chevron */}
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
              {/* SVG Right Chevron */}
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationSidebar;