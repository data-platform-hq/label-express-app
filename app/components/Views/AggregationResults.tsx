// components/AggregationResults.tsx
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { TimePoint, AggregationParams } from '@/app/types/types';
import ChartView from '@/app/components/Chart/ChartView';
import AnnotationSidebar from '@/app/components/Annotations/AnnotationSidebar';
import AnnotationPopup from '@/app/components/Annotations/AnnotationPopup';
import AnnotationView from '@/app/components/Views/AnnotationView';
import ViewControls from '@/app/components/Views/ViewControls';
import VisualizationLayout from '@/app/components/Views/VisualizationLayout';
import { useDataProcessor } from '@/app/components/Chart/DataProcessor';
import { useBrushInteraction } from '@/app/components/Chart/useBrushInteraction';
import { useAnnotations } from '@/app/hooks/useAnnotations';
import { useFormState } from '@/app/contexts/FormStateContext';



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

  const { startDate, endDate, interval } = useFormState();

  const [showAnnotationSidebar, setShowAnnotationSidebar] = useState(false);
  const [showAnnotationPopup, setShowAnnotationPopup] = useState(false);

  // State to preserve the full list of annotations
  const [annotationList, setAnnotationList] = useState<any[]>([]);
  
  // Flag to track if we're navigating to an annotation
  const [isNavigatingToAnnotation, setIsNavigatingToAnnotation] = useState(false);
  
  // Reference to track if we've loaded the full list
  const fullListLoadedRef = useRef(false);
  
  // Add a state to track when a new annotation is created
  const [newAnnotationCreated, setNewAnnotationCreated] = useState(false);

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
    handleUpdateAnnotation,
  } = useAnnotations();

  const {
    brushMode,
    setBrushMode,
    brushSelection,
    handleBrushEnd,
    resetBrushSelection
  } = useBrushInteraction(onDateRangeChange, () => setShowAnnotationPopup(true));

  // Effect to manage the annotation list
  useEffect(() => {

    // Skip if we're still loading and this isn't a new annotation
    if (isLoadingAnnotations && !newAnnotationCreated) {
      return;
    }
    
    // If we're navigating to an annotation, don't update the list unless it's a new annotation
    if (isNavigatingToAnnotation && !newAnnotationCreated) {
      return;
    }
    
    // If we have annotations and either:
    // 1. We haven't loaded the full list yet, OR
    // 2. We're in the initial state (brushMode === 'disabled'), OR
    // 3. We're in zoom mode (which means user explicitly zoomed), OR
    // 4. A new annotation was just created
    if (annotations.length > 0 && 
        (!fullListLoadedRef.current || 
         brushMode === 'disabled' || 
         brushMode === 'zoom' || 
         newAnnotationCreated)) {      
      
      // If a new annotation was created, append it to the existing list
      if (newAnnotationCreated && annotationList.length > 0) {
        // Find annotations that aren't already in the list
        const existingIds = new Set(annotationList.map(a => a.id));
        const newAnnotations = annotations.filter(a => !existingIds.has(a.id));
        
        if (newAnnotations.length > 0) {
          setAnnotationList(prev => [...prev, ...newAnnotations]);
        } else {
          // Fallback to replacing the list if we can't find new ones
          setAnnotationList(annotations);
        }
      } else {
        // Otherwise just replace the list
        setAnnotationList(annotations);
      }
      
      // Mark that we've loaded the full list
      if (brushMode === 'disabled') {
        fullListLoadedRef.current = true;
      }
      
      // Reset the new annotation flag
      if (newAnnotationCreated) {
        setNewAnnotationCreated(false);
        setIsLoadingNewAnnotation(false);
      }
    }
  }, [isLoadingAnnotations, annotations, brushMode, isNavigatingToAnnotation, newAnnotationCreated, annotationList]);




  // Modify your handleZoomHistory function
  const handleZoomHistory = useCallback(() => {
    
    setSelectedAnnotation(null);
    setAnnotationList([]);
    setIsNavigatingToAnnotation(false); 
    fullListLoadedRef.current = false;
    setIsLoadingNewAnnotation(false);
    
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

  // Handle annotation deletion
  const handleAnnotationDeletion = useCallback(async (id: string) => {
    // Delete the annotation
    await handleDeleteAnnotation(id);
    
    // Also remove it from our local list
    setAnnotationList(prev => prev.filter(a => a.id !== id));
  }, [handleDeleteAnnotation]);

  // Handle annotation update
  const handleAnnotationUpdate = useCallback(async (id: string, actionType: string, update: any) => {
    // Update the annotation
    await handleUpdateAnnotation(id, actionType, update);

    if (actionType === 'delete') {
      // Remove the annotation from the local list
      setAnnotationList(prev => prev.filter(a => a.id !== id));
      setSelectedAnnotation(null);
    }
    else {
      // Update the annotation in the local list
      setAnnotationList(prev => { 
        const index = prev.findIndex(a => a.id === id);
        if (index !== -1) {
          const updatedAnnotations = [...prev];
          updatedAnnotations[index] = { ...updatedAnnotations[index], ...update };
          return updatedAnnotations;
        }
        return prev;
      }
      );
    }
    
  }, [handleUpdateAnnotation]);

  // Handle successful annotation creation
  const handleAnnotationCreated = useCallback(() => {
    
    // Close popup and reset brush
    setShowAnnotationPopup(false);
    resetBrushSelection();
    
    // Show loading indicator
    setIsLoadingNewAnnotation(true);
    
    // Set flag that we've created a new annotation
    setNewAnnotationCreated(true);
    
    // Force reload annotations with a delay to ensure backend has processed it
    setTimeout(() => {
      loadAnnotations();
    }, 1000);
  }, [loadAnnotations, resetBrushSelection]);

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

  const hasResults = Array.isArray(results) && results.length > 0;

  return (
    <VisualizationLayout
      showAnnotationSidebar={showAnnotationSidebar}
      sidebarContent={
        <AnnotationSidebar 
          annotations={annotationList}
          isLoading={isLoadingAnnotations && annotationList.length === 0}
          onDeleteAnnotation={handleAnnotationDeletion}
          onNavigateAnnotation={handleNavigateAnnotation}
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
          showBrushControls={hasResults}
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
        // if sidebar is open, show annotation details
        showAnnotationSidebar && selectedAnnotation ? (
        <AnnotationView 
          onUpdateAnnotation={handleAnnotationUpdate}
          selectedAnnotation={selectedAnnotation}
          onDeleteAnnotation={handleAnnotationDeletion}        
        />
        ) : null
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
              setShowAnnotationPopup(false);
              resetBrushSelection();
              
              // After creating a new annotation, reload annotations
              // and reset the navigation flag to update the list
              loadAnnotations();
              setIsNavigatingToAnnotation(false);
              fullListLoadedRef.current = false;
            }} 
            aggregationParams={params}
          />
        ) : null
      }
    />
  );
}