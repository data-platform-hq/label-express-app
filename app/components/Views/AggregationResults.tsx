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
  
  // Use custom hooks to extract terms and color scale
  const { uniqueTerms, colorScale } = useDataProcessor(results || []);


  // useAnnotations hook call
  const { 
    annotations, 
    isLoadingAnnotations, 
    loadAnnotations, 
  } = useAnnotations();

  const {
    brushMode,
    setBrushMode,
    brushSelection,
    handleBrushEnd,
    resetBrushSelection
  } = useBrushInteraction(onDateRangeChange, () => setShowAnnotationPopup(true));


  // Modify your handleZoomHistory function
  const handleZoomHistory = useCallback(() => {
    
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

  // Handle successful annotation creation
  const handleAnnotationCreated = useCallback(() => {
    
    // Close popup and reset brush
    setShowAnnotationPopup(false);
    resetBrushSelection();
        
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
          annotations={annotations}
          isLoading={isLoadingAnnotations}
          onDateRangeChange={onDateRangeChange}
          // onDeleteAnnotation={handleAnnotationDeletion}
          // onNavigateAnnotation={handleNavigateAnnotation}
          // isPreservedList={isNavigatingToAnnotation}
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
        null
        // // if sidebar is open, show annotation details
        // showAnnotationSidebar && selectedAnnotation ? (
        // <AnnotationView 
        //   onUpdateAnnotation={handleAnnotationUpdate}
        //   selectedAnnotation={selectedAnnotation}
        //   onDeleteAnnotation={handleAnnotationDeletion}        
        // />
        // ) : null
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
            }} 
            aggregationParams={params}
          />
        ) : null
      }
    />
  );
}