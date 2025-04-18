// components/AggregationResults.tsx
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { TimePoint, AggregationParams, Annotation } from '@/app/types/types'; // Added Annotation type
import ChartView from '@/app/components/Chart/ChartView';
import AnnotationSidebar from '@/app/components/Annotations/AnnotationSidebar';
import AnnotationPopup from '@/app/components/Annotations/AnnotationPopup';
import AnnotationView from '@/app/components/Views/AnnotationView'; // Keep if needed elsewhere
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
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [showAnnotationView, setShowAnnotationView] = useState(false);
  const isSidebarNavigationTriggerRef = useRef(false);
  const [displayedSidebarAnnotations, setDisplayedSidebarAnnotations] = useState<Annotation[]>([]);
  const lastExternalRangeRef = useRef<{ start: string | null; end: string | null }>({ start: null, end: null });
  const { uniqueTerms, colorScale } = useDataProcessor(results || []);


  // useAnnotations hook - Fetches annotations based on current context/range
  const {
    annotations: fetchedAnnotations,
    isLoadingAnnotations,
    loadAnnotations,
    updateAnnotation, 
  } = useAnnotations();



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

  // Effect to update sidebar list based on fetchedAnnotations
  useEffect(() => {
    if (isSidebarNavigationTriggerRef.current) {
      console.log("Parent: Sidebar navigation active, preserving sidebar list.");
      isSidebarNavigationTriggerRef.current = false;
      // Keep displayedSidebarAnnotations as they are
    } else {
      console.log("Parent: Updating sidebar annotations from fetched data. Count:", fetchedAnnotations?.length);
      // Use the LATEST fetched annotations from the hook
      // This will now also reflect immediate updates made within the hook
      setDisplayedSidebarAnnotations(fetchedAnnotations || []);
    }
  }, [fetchedAnnotations]); // Depend on fetchedAnnotations


  // --- Sidebar Navigation Handler ---
  const handleSidebarDateRangeChange = useCallback((startDate: string, endDate: string) => {
      console.log("Parent: Sidebar navigation triggered date change.");
      // Set the flag *before* calling the original handler
      isSidebarNavigationTriggerRef.current = true;
      // Call the original handler to actually change the date range and trigger data fetch
      originalOnDateRangeChange(startDate, endDate);
  }, [originalOnDateRangeChange]);

  // --- Refined Handler for Annotation Updates/Deletes ---
  const handleAnnotationUpdate = useCallback(async (
    id: string,
    actionType: 'update' | 'delete',
    updatePayload: any
  ): Promise<boolean> => {
    console.log(`Parent: Handling annotation ${actionType}:`, id);

    // --- START: Determine the correct refresh range ---
    let refreshStartDate = startDate; // Default to current form state
    let refreshEndDate = endDate;   // Default to current form state

    if (displayedSidebarAnnotations && displayedSidebarAnnotations.length > 0) {
        // Calculate range based on the *currently displayed list* in the sidebar
        try {
            const dates = displayedSidebarAnnotations.flatMap(a => [new Date(a.startDate).getTime(), new Date(a.endDate).getTime()]);
            const minTime = Math.min(...dates);
            const maxTime = Math.max(...dates);

            if (isFinite(minTime) && isFinite(maxTime)) {
                 const duration = maxTime - minTime;
                 // Add padding (e.g., 10% on each side, or minimum 1 minute)
                 const padding = Math.max(duration * 0.1, 60 * 1000);
                 refreshStartDate = new Date(minTime - padding).toISOString();
                 refreshEndDate = new Date(maxTime + padding).toISOString();
                 console.log(`Parent: Calculated refresh range based on displayed list: ${refreshStartDate} to ${refreshEndDate}`);
            } else {
                 console.warn("Parent: Could not determine valid min/max date from displayed annotations, using form state range for refresh.");
            }
        } catch (e) {
             console.error("Parent: Error calculating refresh range from displayed annotations:", e);
             // Fallback to form state range already assigned
        }
    } else {
        console.warn("Parent: displayedSidebarAnnotations is empty, using form state range for refresh.");
    }
    // --- END: Determine the correct refresh range ---


    try {
      // 1. Call the hook to update backend and hook's internal state
      const result = await updateAnnotation(id, actionType, updatePayload);

      if (result.success) {
        console.log(`Parent: Annotation ${actionType} successful for ID: ${id}`);

        // 2. Update local selected state if needed (using data from hook result)
        if (actionType === 'update' && result.updatedAnnotation) {
          if (selectedAnnotation && selectedAnnotation.id === id) {
            setSelectedAnnotation(result.updatedAnnotation);
          }
          setShowAnnotationView(true); // Keep view open for update
        } else if (actionType === 'delete') {
          if (selectedAnnotation && selectedAnnotation.id === id) {
            setSelectedAnnotation(null);
            setShowAnnotationView(false); // Close view for delete
          }
        }

        // 3. Trigger a data fetch using the CALCULATED WIDER range
        console.log(`Parent: Triggering data refresh with range: ${refreshStartDate} to ${refreshEndDate}`);
        // Ensure the flag is FALSE so the sidebar DOES update
        isSidebarNavigationTriggerRef.current = false;
        // Call the main date range change handler to fetch ALL data (chart + annotations) for the wider range
        originalOnDateRangeChange(refreshStartDate, refreshEndDate);

        return true; // Indicate success

      } else {
        console.error(`Parent: Annotation ${actionType} failed for ID: ${id}`);
        return false; // Indicate failure
      }
    } catch (error) {
      console.error(`Parent: Error during annotation ${actionType}:`, error);
      return false; // Indicate failure
    }
  }, [
      selectedAnnotation,
      updateAnnotation,
      displayedSidebarAnnotations, // Need this list to calculate range
      originalOnDateRangeChange, // Need this to trigger the refresh
      startDate, // Need current start date as fallback
      endDate    // Need current end date as fallback
  ]);

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
    isSidebarNavigationTriggerRef.current = false; // Ensure list is refreshed
    // Load annotations directly to get the new one
    loadAnnotations();
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

  // Add handler for annotation selection
  const handleAnnotationSelect = useCallback((annotation: Annotation) => {
  setSelectedAnnotation(annotation);
  setShowAnnotationView(true);

  console.log("Parent: Annotation selected:", annotation);

  }, []);

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
        <AnnotationSidebar
          annotations={displayedSidebarAnnotations} // Pass the state managed by the parent
          isLoading={isLoadingAnnotations}
          onDateRangeChange={handleSidebarDateRangeChange} // Pass the wrapper function
          onAnnotationSelect={handleAnnotationSelect} // Pass the selection handler
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
          annotations={fetchedAnnotations} // Chart always shows the LATEST fetched annotations
          onZoomHistory={handleZoomHistory} // Pass original zoom history if needed by chart
        />
      }
      footerContent={
        showAnnotationView ? (
          <AnnotationView
            selectedAnnotation={selectedAnnotation}
            onUpdateAnnotation={handleAnnotationUpdate}
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