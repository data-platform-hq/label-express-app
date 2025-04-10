'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { TimePoint, AggregationParams } from '@/app/components/types';
import ChartView from '@/app/components/Chart/ChartView';
import AnnotationDetails from '@/app/components/Views/AnnotationDetails';
import AnnotationSidebar from '@/app/components/Annotations/AnnotationSidebar';
import AnnotationPopup from '@/app/components/Annotations/AnnotationPopup';
import ViewControls from '@/app/components/Views/ViewControls';
import VisualizationLayout from '@/app/components/Views/VisualizationLayout';
import { useDataProcessor } from '@/app/components/Chart/DataProcessor';
import { useBrushInteraction } from '@/app/components/Chart/useBrushInteraction';
import { useAnnotations } from '@/app/hooks/useAnnotations';
import { useFormState } from '@/app/contexts/FormStateContext';
import { useSession } from 'next-auth/react';

interface AggregationResultsProps {
  results: TimePoint[];
  params: AggregationParams;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  onZoomHistory?: () => void;
}

export default function AggregationResults({ 
  results, 
  params, 
  onDateRangeChange,
  onZoomHistory = () => {}
}: AggregationResultsProps) {

  const { data: session } = useSession();

  const { startDate, endDate, interval } = useFormState();
 
  const [showAnnotationSidebar, setShowAnnotationSidebar] = useState(false);
  const [showAnnotationPopup, setShowAnnotationPopup] = useState(false);

  // State to preserve the full list of annotations
  const [annotationList, setAnnotationList] = useState<any[]>([]);
  
  // Flag to track if we're navigating to an annotation
  const [isNavigatingToAnnotation, setIsNavigatingToAnnotation] = useState(false);
  
  // Reference to track if we've loaded the full list
  const fullListLoadedRef = useRef(false);
  
  // Add a state to track when a new annotation is created or updated
  const [annotationModified, setAnnotationModified] = useState(false);

  // Add a state for tracking loading of new annotations
  const [isLoadingNewAnnotation, setIsLoadingNewAnnotation] = useState(false);

  // Add this state near your other state declarations
  const [selectedAnnotation, setSelectedAnnotation] = useState<any | null>(null);
  
  // Use custom hooks to extract terms and color scale
  const { uniqueTerms, colorScale } = useDataProcessor(results || []);
  
  // useAnnotations hook call
  const { 
    annotations, 
    isLoadingAnnotations, 
    loadAnnotations, 
    handleDeleteAnnotation,
    handleUpdateAnnotation
  } = useAnnotations();
  
  const {
    brushMode,
    setBrushMode,
    brushSelection,
    handleBrushEnd,
    resetBrushSelection
  } = useBrushInteraction(onDateRangeChange, () => setShowAnnotationPopup(true));

  // Effect to reload annotations when an update occurs
  useEffect(() => {
    if (annotationModified) {
      // Reset the flag first to avoid infinite loops
      setAnnotationModified(false);
      
      // Force reload annotations
      loadAnnotations();
      
      // Reset navigation flags to ensure we get fresh data
      setIsNavigatingToAnnotation(false);
      fullListLoadedRef.current = false;
    }
  }, [annotationModified, loadAnnotations]);

  // Effect to manage the annotation list
  useEffect(() => {
    // Skip if we're still loading and this isn't a modification
    if (isLoadingAnnotations && !annotationModified) {
      return;
    }
    
    // If we're navigating to an annotation, don't update the list unless it's a modification
    if (isNavigatingToAnnotation && !annotationModified) {
      return;
    }
    
    // If we have annotations and either:
    // 1. We haven't loaded the full list yet, OR
    // 2. We're in the initial state (brushMode === 'disabled'), OR
    // 3. We're in zoom mode (which means user explicitly zoomed), OR
    // 4. An annotation was just modified (created, updated, etc.)
    if (annotations.length > 0 && 
        (!fullListLoadedRef.current || 
         brushMode === 'disabled' || 
         brushMode === 'zoom' || 
         annotationModified)) {      
      
      // Replace the entire list to ensure we have the most up-to-date data
      setAnnotationList(annotations);
      
      // Mark that we've loaded the full list
      if (brushMode === 'disabled') {
        fullListLoadedRef.current = true;
      }
      
      // Reset the loading indicator
      if (annotationModified) {
        setIsLoadingNewAnnotation(false);
      }
    }
  }, [isLoadingAnnotations, annotations, brushMode, isNavigatingToAnnotation, annotationModified]);

  // Effect to clear selected annotation when sidebar is closed
  useEffect(() => {
    if (!showAnnotationSidebar) {
      setSelectedAnnotation(null);
    }
  }, [showAnnotationSidebar]);

  // Custom zoom out handler that resets the annotation list
  const handleZoomHistory = useCallback(() => {
    // Reset the navigation flag
    setIsNavigatingToAnnotation(false);
    
    // Reset the full list loaded flag
    fullListLoadedRef.current = false;
    
    // Call the provided zoom out handler
    onZoomHistory();
  }, [onZoomHistory]);

  const handleNavigateLeft = (interval: string) => {
    // Parse the current visible time range
    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);

    // Calculate the time difference to shift by
    const timeShift = parseTimeInterval(interval);

    // Create new date range shifted left
    const newStart = new Date(currentStart.getTime() - timeShift);
    const newEnd = new Date(currentEnd.getTime() - timeShift);
    
    // Call the onDateRangeChange function with the new date range
    if (onDateRangeChange) {
      onDateRangeChange(newStart.toISOString(), newEnd.toISOString());
    }
  }

  const handleNavigateRight = (interval: string) => {
    // Parse the current visible time range
    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);

    // Calculate the time difference to shift by
    const timeShift = parseTimeInterval(interval);

    // Create new date range shifted left
    const newStart = new Date(currentStart.getTime() + timeShift);
    const newEnd = new Date(currentEnd.getTime() + timeShift);

    // Call the onDateRangeChange function with the new date range
    if (onDateRangeChange) {
      onDateRangeChange(newStart.toISOString(), newEnd.toISOString());
    }
  }

  // Handle navigation to a specific annotation
  const handleNavigateAnnotation = useCallback((annotation: any) => {
    // Set flag that we're navigating to an annotation
    setIsNavigatingToAnnotation(true);

    // Store the selected annotation
    setSelectedAnnotation(annotation);

    const startDate = new Date(annotation.startDate);
    const endDate = new Date(annotation.endDate);

    // Calculate the duration of the annotation
    const duration = endDate.getTime() - startDate.getTime();

    // Calculate 10% offsets
    const offset = Math.max(duration * 0.1, 60000); // At least 1 minute offset
  
    // Apply offsets to create adjusted dates
    const adjustedStartDate = new Date(startDate.getTime() - offset);
    const adjustedEndDate = new Date(endDate.getTime() + offset);
    
    // Call the onDateRangeChange function with the new date range
    if (onDateRangeChange) {
      onDateRangeChange(adjustedStartDate.toISOString(), adjustedEndDate.toISOString());
    }
  }, [onDateRangeChange]);

  // this function to navigate to the full annotation list date range
  const handleNavigateToAnnotationList = useCallback(() => {
    // Reset the navigation flag
    setIsNavigatingToAnnotation(false);
    
    // Find the earliest and latest dates from the annotation list
    if (annotationList.length > 0) {
      // Sort annotations by start date
      const sortedByStart = [...annotationList].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      
      // Sort annotations by end date (separate sort)
      const sortedByEnd = [...annotationList].sort(
        (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
      );
      
      // Get earliest start date and latest end date
      const earliestDate = new Date(sortedByStart[0].startDate);
      const latestDate = new Date(sortedByEnd[0].endDate);
      
      // Add a small buffer (10% on each side)
      const totalDuration = latestDate.getTime() - earliestDate.getTime();
      const buffer = totalDuration * 0.1;
      
      const startDate = new Date(earliestDate.getTime() - buffer);
      const endDate = new Date(latestDate.getTime() + buffer);
      
      // Navigate to this date range
      if (onDateRangeChange) {
        onDateRangeChange(startDate.toISOString(), endDate.toISOString());
      }
    }
  }, [annotationList, onDateRangeChange]);

  // Handle annotation deletion
  const handleAnnotationDeletion = useCallback(async (id: string) => {
    // Delete the annotation
    await handleDeleteAnnotation(id);
    
    // Mark that annotations were modified to trigger a reload
    setAnnotationModified(true);
  }, [handleDeleteAnnotation]);

  const handleEditAnnotation = (annotation: any) => {
    console.log('Editing annotation:', annotation);
  };

  // Handle successful annotation creation
  const handleAnnotationCreated = useCallback(() => {
    // Close popup and reset brush
    setShowAnnotationPopup(false);
    resetBrushSelection();
    
    // Show loading indicator
    setIsLoadingNewAnnotation(true);
    
    // Set flag that we've modified annotations
    setAnnotationModified(true);
  }, [resetBrushSelection]);

  const handleApprovalStatus = useCallback(async (annotationId: any, updates: {}) => {
    // Handle approval status change
    console.log('Handling approval status for annotation:', updates);
    
    // Update the annotation
    await handleUpdateAnnotation(annotationId, updates);
    
    // Mark that annotations were modified to trigger a reload
    setAnnotationModified(true);
    
    // If we have a selected annotation that was just updated, update it in our state
    if (selectedAnnotation && selectedAnnotation.id === annotationId) {
      setSelectedAnnotation((prev: any) => ({
        ...prev,
        ...updates
      }));
    }
  }, [handleUpdateAnnotation, selectedAnnotation]);

  // Add these functions
  const handleZoomIn = useCallback(() => {
    if (onDateRangeChange) {
      // Parse the current date range
      const startDateObj = new Date(startDate || '');
      const endDateObj = new Date(endDate || '');
      
      // Calculate the total duration
      const totalDuration = endDateObj.getTime() - startDateObj.getTime();
      
      // Calculate 15% of the duration from each side
      const adjustmentAmount = totalDuration * 0.15;
      
      // Create new dates by adjusting 15% from each side
      const newStart = new Date(startDateObj.getTime() + adjustmentAmount);
      const newEnd = new Date(endDateObj.getTime() - adjustmentAmount);
      
      // Call onDateRangeChange with the new dates
      onDateRangeChange(newStart.toISOString(), newEnd.toISOString());
    }
  }, [onDateRangeChange, startDate, endDate]);

  const handleZoomOut = useCallback(() => {
    if (onDateRangeChange) {
      // Parse the current date range
      const startDateObj = new Date(startDate || '');
      const endDateObj = new Date(endDate || '');
      
      // Calculate the total duration
      const totalDuration = endDateObj.getTime() - startDateObj.getTime();
      
      // Calculate 20% of the duration to add to each side
      const adjustmentAmount = totalDuration * 0.2;
      
      // Create new dates by adjusting 20% from each side
      const newStart = new Date(startDateObj.getTime() - adjustmentAmount);
      const newEnd = new Date(endDateObj.getTime() + adjustmentAmount);
      
      // Call onDateRangeChange with the new dates
      onDateRangeChange(newStart.toISOString(), newEnd.toISOString());
    }
  }, [onDateRangeChange, startDate, endDate]);

  // Helper function to parse time interval strings into milliseconds
  const parseTimeInterval = (interval: string): number => {
    const value = parseInt(interval.match(/\d+/)?.[0] || '15', 10);
    
    if (interval.includes('m')) return value * 60 * 1000; // minutes to ms
    if (interval.includes('h')) return value * 60 * 60 * 1000; // hours to ms
    if (interval.includes('d')) return value * 24 * 60 * 60 * 1000; // days to ms
    
    return 15 * 60 * 1000; // default to 15 minutes
  };

  return (
    <VisualizationLayout
      showAnnotationSidebar={showAnnotationSidebar}
      sidebarContent={
        <AnnotationSidebar 
          annotations={annotationList}
          isLoading={isLoadingAnnotations && annotationList.length === 0}
          onDeleteAnnotation={handleAnnotationDeletion}
          onNavigateAnnotation={handleNavigateAnnotation}
          onNavigateToAnnotationList={handleNavigateToAnnotationList}
          onEditAnnotation={handleEditAnnotation}
          isPreservedList={isNavigatingToAnnotation}
        />
      }
      controlsContent={
        <ViewControls
          showAnnotationSidebar={showAnnotationSidebar}
          setShowAnnotationSidebar={setShowAnnotationSidebar}
          brushMode={brushMode}
          setBrushMode={setBrushMode}
          onZoomHistory={handleZoomHistory}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onNavigateLeft={handleNavigateLeft}
          onNavigateRight={handleNavigateRight}
          currentInterval={interval}
          showBrushControls={true}
        />
      }
      mainContent={
        <ChartView
          results={results}
          uniqueTerms={uniqueTerms}
          colorScale={colorScale}
          params={params}
          brushMode={brushMode}
          setBrushMode={setBrushMode}
          onBrushEnd={handleBrushEnd}
          annotations={annotations} // Use current annotations for the chart
          onZoomHistory={handleZoomHistory}
        />
      }
      footerContent={
        <AnnotationDetails 
          selectedAnnotation={selectedAnnotation}
          user={session?.user}
          onApproval={handleApprovalStatus}
          sidebarOpen={showAnnotationSidebar}
        />
      }
      popupContent={
        showAnnotationPopup ? (
          <AnnotationPopup
            brushSelection={brushSelection}
            onCancel={() => {
              setShowAnnotationPopup(false);
              resetBrushSelection();
            }}
            onSuccess={() => {
              handleAnnotationCreated();
            }} 
            aggregationParams={params}
          />
        ) : null
      }
    />
  );
}