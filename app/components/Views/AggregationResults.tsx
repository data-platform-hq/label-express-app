'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { TimePoint, AggregationParams, Annotation } from '@/app/types/types';
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
  onDateRangeChange: originalOnDateRangeChange = () => {},
  onZoomHistory = () => {},
}: AggregationResultsProps) {
  const { startDate, endDate, interval } = useFormState();
  const [showAnnotationSidebar, setShowAnnotationSidebar] = useState(false);
  const [showAnnotationPopup, setShowAnnotationPopup] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [showAnnotationView, setShowAnnotationView] = useState(false);
  const isSidebarNavigationTriggerRef = useRef(false);
  
  // Local state for optimistic updates
  const [localAnnotations, setLocalAnnotations] = useState<Annotation[]>([]);
  const { uniqueTerms, colorScale } = useDataProcessor(results || []);

  // useAnnotations hook - Fetches annotations based on current context/range
  const {
    annotations: fetchedAnnotations,
    isLoadingAnnotations,
    loadAnnotations,
    updateAnnotation, 
  } = useAnnotations();

  // Sync fetched annotations to local state
  useEffect(() => {
    if (!isSidebarNavigationTriggerRef.current && fetchedAnnotations) {
      setLocalAnnotations(fetchedAnnotations);
    }
  }, [fetchedAnnotations]);

  // if sidebar is closed, reset the selected annotation
  useEffect(() => {
    if (!showAnnotationSidebar) {
      setSelectedAnnotation(null);
      setShowAnnotationView(false);
    }
  }, [showAnnotationSidebar]);


  const {
    brushMode,
    setBrushMode,
    brushSelection,
    handleBrushEnd,
    resetBrushSelection,
  } = useBrushInteraction(
      originalOnDateRangeChange,
      () => setShowAnnotationPopup(true)
  );

  // --- Sidebar Navigation Handler ---
  const handleSidebarDateRangeChange = useCallback((startDate: string, endDate: string) => {
      isSidebarNavigationTriggerRef.current = true;
      originalOnDateRangeChange(startDate, endDate);
  }, [originalOnDateRangeChange]);

  // --- Optimistic Update Handler ---
  const handleAnnotationUpdate = useCallback(async (
    id: string,
    actionType: 'update' | 'delete',
    updatePayload: any
  ): Promise<boolean> => {
    try {
      // Optimistic update for UI
      if (actionType === 'update') {
        // Create an optimistically updated annotation
        const updatedAnnotation = {
          ...localAnnotations.find(a => a.id === id),
          ...updatePayload
        } as Annotation;
        
        // Update local state optimistically
        setLocalAnnotations(prev => 
          prev.map(a => a.id === id ? updatedAnnotation : a)
        );
        
        // Update selected annotation if it's the one being edited
        if (selectedAnnotation?.id === id) {
          setSelectedAnnotation(updatedAnnotation);
        }
      } 
      else if (actionType === 'delete') {
        // Remove from local state optimistically
        setLocalAnnotations(prev => prev.filter(a => a.id !== id));
        
        // Close view if the deleted annotation was selected
        if (selectedAnnotation?.id === id) {
          setSelectedAnnotation(null);
          setShowAnnotationView(false);
        }
      }

      // Perform actual API update
      const result = await updateAnnotation(id, actionType, updatePayload);

      if (!result.success) {
        // Revert optimistic update on failure by reloading data
        loadAnnotations();
        console.error(`Annotation ${actionType} failed for ID: ${id}`);
        return false;
      }
      
      return true;
    } catch (error) {
      // Revert optimistic update on error by reloading data
      loadAnnotations();
      console.error(`Error during annotation ${actionType}:`, error);
      return false;
    }
  }, [
    localAnnotations,
    selectedAnnotation,
    updateAnnotation,
    loadAnnotations
  ]);

  // --- Other Handlers ---
  const handleZoomHistory = useCallback(() => {
    isSidebarNavigationTriggerRef.current = false;

    onZoomHistory();
  }, [onZoomHistory]);

  const handleNavigateLeft = useCallback((interval: string) => {
    isSidebarNavigationTriggerRef.current = false;
    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);
    const timeShift = parseTimeInterval(interval);
    const newStart = new Date(currentStart.getTime() - timeShift);
    const newEnd = new Date(currentEnd.getTime() - timeShift);
    originalOnDateRangeChange(newStart.toISOString(), newEnd.toISOString());
  }, [startDate, endDate, originalOnDateRangeChange]);

  const handleNavigateRight = useCallback((interval: string) => {
    isSidebarNavigationTriggerRef.current = false;
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
    
    // Optimistically assume success and reload annotations
    loadAnnotations();
  }, [loadAnnotations, resetBrushSelection]);

  const handleZoomIn = useCallback(() => {
    isSidebarNavigationTriggerRef.current = false;
    const startDateObj = new Date(startDate || '');
    const endDateObj = new Date(endDate || '');
    const totalDuration = endDateObj.getTime() - startDateObj.getTime();
    const adjustmentAmount = totalDuration * 0.15;
    const newStart = new Date(startDateObj.getTime() + adjustmentAmount);
    const newEnd = new Date(endDateObj.getTime() - adjustmentAmount);
    originalOnDateRangeChange(newStart.toISOString(), newEnd.toISOString());
  }, [originalOnDateRangeChange, startDate, endDate]);

  const handleZoomOut = useCallback(() => {
    isSidebarNavigationTriggerRef.current = false;
    const startDateObj = new Date(startDate || '');
    const endDateObj = new Date(endDate || '');
    const totalDuration = endDateObj.getTime() - startDateObj.getTime();
    const adjustmentAmount = totalDuration * 0.2;
    const newStart = new Date(startDateObj.getTime() - adjustmentAmount);
    const newEnd = new Date(endDateObj.getTime() + adjustmentAmount);
    originalOnDateRangeChange(newStart.toISOString(), newEnd.toISOString());
  }, [originalOnDateRangeChange, startDate, endDate]);

  const handleAnnotationSelect = useCallback((annotation: Annotation) => {
    setSelectedAnnotation(annotation);
    setShowAnnotationView(true);
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
          annotations={localAnnotations} // Use local state for optimistic updates
          isLoading={isLoadingAnnotations}
          onDateRangeChange={handleSidebarDateRangeChange}
          onAnnotationSelect={handleAnnotationSelect}
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
          annotations={localAnnotations} // Use local state for optimistic updates
          onZoomHistory={handleZoomHistory}
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
              isSidebarNavigationTriggerRef.current = false;
            }}
            onSuccess={handleAnnotationCreated}
            aggregationParams={params}
          />
        ) : null
      }
    />
  );
}