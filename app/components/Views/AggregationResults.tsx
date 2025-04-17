// components/AggregationResults.tsx
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { TimePoint, AggregationParams, Annotation } from '@/app/types/types'; // Added Annotation type
import ChartView from '@/app/components/Chart/ChartView';
import AnnotationSidebar from '@/app/components/Annotations/AnnotationSidebar';
import AnnotationPopup from '@/app/components/Annotations/AnnotationPopup';
// import AnnotationView from '@/app/components/Views/AnnotationView'; // Keep if needed elsewhere
import ViewControls from '@/app/components/Views/ViewControls';
import VisualizationLayout from '@/app/components/Views/VisualizationLayout';
import { useDataProcessor } from '@/app/components/Chart/DataProcessor';
import { useBrushInteraction } from '@/app/components/Chart/useBrushInteraction';
import { useAnnotations } from '@/app/hooks/useAnnotations';
import { useFormState } from '@/app/contexts/FormStateContext';

interface AggregationResultsProps {
  results: TimePoint[];
  params: AggregationParams;
  onDateRangeChange?: (startDate: string, endDate: string) => void; // Original handler
  onZoomHistory?: () => void;
}

export default function AggregationResults({
  results,
  params,
  onDateRangeChange: originalOnDateRangeChange = () => {}, // Provide default and rename
  onZoomHistory = () => {},
}: AggregationResultsProps) {
  const { startDate, endDate, interval } = useFormState();

  const [showAnnotationSidebar, setShowAnnotationSidebar] = useState(false);
  const [showAnnotationPopup, setShowAnnotationPopup] = useState(false);

  // Ref to track if the date range change was triggered by the AnnotationSidebar navigation
  const isSidebarNavigationTriggerRef = useRef(false);

  // State to hold the annotations currently displayed in the sidebar
  // This list might be preserved during sidebar navigation triggers.
  const [displayedSidebarAnnotations, setDisplayedSidebarAnnotations] = useState<Annotation[]>([]);

  // Use custom hooks
  const { uniqueTerms, colorScale } = useDataProcessor(results || []);

  // useAnnotations hook - Fetches annotations based on current context/range
  const {
    annotations: fetchedAnnotations, // Rename the result from the hook
    isLoadingAnnotations,
    loadAnnotations,
  } = useAnnotations(); // Assuming this hook reacts to startDate/endDate changes internally

  const {
    brushMode,
    setBrushMode,
    brushSelection,
    handleBrushEnd,
    resetBrushSelection,
  } = useBrushInteraction(
      // Pass the original handler for brush actions
      originalOnDateRangeChange,
      () => setShowAnnotationPopup(true)
  );

  // --- Effect to decide which annotations to display in the sidebar ---
  useEffect(() => {
    // If the flag is set, it means the fetch was likely triggered
    // by the sidebar's navigation. We want to *keep* the existing sidebar list.
    if (isSidebarNavigationTriggerRef.current) {
      console.log("Parent: Ignoring fetchedAnnotations update for sidebar due to internal navigation.");
      // Reset the flag for the next potential external update
      isSidebarNavigationTriggerRef.current = false;
      // Do NOT update displayedSidebarAnnotations
    } else {
      // If it's an external update (brush, zoom, history, initial load, creation),
      // update the sidebar list with the newly fetched annotations.
      console.log("Parent: Updating sidebar annotations from fetched data.");
      setDisplayedSidebarAnnotations(fetchedAnnotations || []); // Use fetched data
    }
    // Dependency: This effect runs when new annotations are fetched by the hook.
  }, [fetchedAnnotations]);


  // --- Wrapper function passed to the AnnotationSidebar ---
  // This function signals that the sidebar initiated the date change.
  const handleSidebarDateRangeChange = useCallback((startDate: string, endDate: string) => {
      console.log("Parent: Sidebar navigation triggered date change.");
      // Set the flag *before* calling the original handler
      isSidebarNavigationTriggerRef.current = true;
      // Call the original handler to actually change the date range and trigger data fetch
      originalOnDateRangeChange(startDate, endDate);
  }, [originalOnDateRangeChange]);


  // --- Other Handlers ---

  const handleZoomHistory = useCallback(() => {
      // Reset the flag because this is an external trigger
      isSidebarNavigationTriggerRef.current = false;
      onZoomHistory();
  }, [onZoomHistory]);

  const handleNavigateLeft = useCallback((interval: string) => {
    isSidebarNavigationTriggerRef.current = false; // External trigger
    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);
    const timeShift = parseTimeInterval(interval);
    const newStart = new Date(currentStart.getTime() - timeShift);
    const newEnd = new Date(currentEnd.getTime() - timeShift);
    originalOnDateRangeChange(newStart.toISOString(), newEnd.toISOString());
  }, [startDate, endDate, originalOnDateRangeChange]);

  const handleNavigateRight = useCallback((interval: string) => {
    isSidebarNavigationTriggerRef.current = false; // External trigger
    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);
    const timeShift = parseTimeInterval(interval);
    const newStart = new Date(currentStart.getTime() + timeShift);
    const newEnd = new Date(currentEnd.getTime() + timeShift);
    originalOnDateRangeChange(newStart.toISOString(), newEnd.toISOString());
  }, [startDate, endDate, originalOnDateRangeChange]);

  const handleAnnotationCreated = useCallback(() => {
    setShowAnnotationPopup(false);
    resetBrushSelection();
    // Ensure the flag is false so the new list is loaded after creation
    isSidebarNavigationTriggerRef.current = false;
    setTimeout(() => {
      loadAnnotations(); // This will trigger a fetch and the useEffect above
    }, 500); // Reduced delay slightly
  }, [loadAnnotations, resetBrushSelection]);

  const handleZoomIn = useCallback(() => {
    isSidebarNavigationTriggerRef.current = false; // External trigger
    const startDateObj = new Date(startDate || '');
    const endDateObj = new Date(endDate || '');
    const totalDuration = endDateObj.getTime() - startDateObj.getTime();
    const adjustmentAmount = totalDuration * 0.15;
    const newStart = new Date(startDateObj.getTime() + adjustmentAmount);
    const newEnd = new Date(endDateObj.getTime() - adjustmentAmount);
    originalOnDateRangeChange(newStart.toISOString(), newEnd.toISOString());
  }, [originalOnDateRangeChange, startDate, endDate]);

  const handleZoomOut = useCallback(() => {
    isSidebarNavigationTriggerRef.current = false; // External trigger
    const startDateObj = new Date(startDate || '');
    const endDateObj = new Date(endDate || '');
    const totalDuration = endDateObj.getTime() - startDateObj.getTime();
    const adjustmentAmount = totalDuration * 0.2;
    const newStart = new Date(startDateObj.getTime() - adjustmentAmount);
    const newEnd = new Date(endDateObj.getTime() + adjustmentAmount);
    originalOnDateRangeChange(newStart.toISOString(), newEnd.toISOString());
  }, [originalOnDateRangeChange, startDate, endDate]);

  const parseTimeInterval = (interval: string): number => {
    const value = parseInt(interval.match(/\d+/)?.[0] || '15', 10);
    if (interval.includes('m')) return value * 60 * 1000;
    if (interval.includes('h')) return value * 60 * 60 * 1000;
    if (interval.includes('d')) return value * 24 * 60 * 60 * 1000;
    return 15 * 60 * 1000;
  };

  const hasResults = Array.isArray(results) && results.length > 0;

  return (
    <VisualizationLayout
      showAnnotationSidebar={showAnnotationSidebar}
      sidebarContent={
        // Pass the potentially preserved list and the special handler
        <AnnotationSidebar
          // Key prop helps React reset state if needed, but might not be necessary here
          // key={displayedSidebarAnnotations.map(a => a.id).join('-')} // Optional: force re-mount if list content changes drastically
          annotations={displayedSidebarAnnotations} // Pass the state managed by the parent
          isLoading={isLoadingAnnotations}
          onDateRangeChange={handleSidebarDateRangeChange} // Pass the wrapper function
        />
      }
      controlsContent={
        <ViewControls
          showAnnotationSidebar={showAnnotationSidebar}
          setShowAnnotationSidebar={setShowAnnotationSidebar}
          brushMode={brushMode}
          setBrushMode={setBrushMode}
          // Use original handlers for controls that are external triggers
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
          annotations={fetchedAnnotations} // Chart always shows the LATEST fetched annotations
          onZoomHistory={handleZoomHistory} // Pass original zoom history if needed by chart
        />
      }
      footerContent={
        null // Your AnnotationView logic if needed
      }
      popupContent={
        showAnnotationPopup ? (
          <AnnotationPopup
            brushSelection={brushSelection}
            onCancel={() => {
              setShowAnnotationPopup(false);
              resetBrushSelection();
              // Ensure flag is false if cancelling brush annotation
              isSidebarNavigationTriggerRef.current = false;
            }}
            onSuccess={handleAnnotationCreated} // Use the updated handler
            aggregationParams={params}
          />
        ) : null
      }
    />
  );
}