// components/useAnnotations.tsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { Annotation } from '@/app/components/types';
import { fetchAnnotationRecords, removeAnnotationRecord } from '@/app/utils/actions';
import { useFormState } from '@/app/contexts/FormStateContext';
import * as d3 from 'd3';

interface UseAnnotationsResult {
  annotations: Annotation[];
  isLoadingAnnotations: boolean;
  loadAnnotations: () => Promise<void>;
  handleDeleteAnnotation: (documentId: string) => Promise<void>;
}

// Helper function to get or generate color for an annotation type
function getColorForAnnotationType(annotationType: string): string {
  const STORAGE_KEY = 'annotationTypeColors';
  
  // Try to get existing colors from localStorage
  const storedColorsString = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  let colorMap: Record<string, string> = {};
  
  if (storedColorsString) {
    try {
      colorMap = JSON.parse(storedColorsString);
    } catch (e) {
      console.error('Error parsing annotation colors from localStorage', e);
    }
  }
  
  // If we already have a color for this type, return it
  if (colorMap[annotationType]) {
    return colorMap[annotationType];
  }
  
  // Generate a new color using d3's color schemes
  // Using category10 as it's one of the most distinct color schemes // schemeReds[20]
  const colorScheme = d3.schemePaired;
  const existingColors = Object.values(colorMap);
  
  // Find a color that's not already used
  let newColor = colorScheme[0];
  for (const color of colorScheme) {
    if (!existingColors.includes(color)) {
      newColor = color;
      break;
    }
  }
  
  // If all colors are used, generate a random one
  if (existingColors.length >= colorScheme.length) {
    newColor = d3.rgb(
      Math.floor(Math.random() * 200) + 55,
      Math.floor(Math.random() * 200) + 55,
      Math.floor(Math.random() * 200) + 55
    ).toString();
  }
  
  // Save the new color to localStorage
  colorMap[annotationType] = newColor;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colorMap));
  }
  
  return newColor;
}

export function useAnnotations(): UseAnnotationsResult {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState(false);
  
  // load form state
  const { selectedIndex, startDate, endDate, filterField, filterValue } = useFormState();
  
  // Track previous values to detect actual changes
  const prevStateRef = useRef({
    startDate: '',
    endDate: '',
    filterField: '',
    filterValue: '',
    selectedIndex: ''
  });
  
  // Track if we're currently loading annotations to prevent duplicate requests
  const isLoadingRef = useRef(false);
  
  // Memoize loadAnnotations to maintain stable reference
  const loadAnnotations = useCallback(async () => {
    // Skip if we're already loading or if dates are missing
    if (isLoadingRef.current || !startDate || !endDate) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoadingAnnotations(true);
    
    try {
      // Convert Date objects to ISO strings
      const startDateStr = startDate;
      const endDateStr = endDate;
      
      const fetchedAnnotations = await fetchAnnotationRecords(startDateStr, endDateStr, filterField, filterValue);
      
      const processedAnnotations = fetchedAnnotations.map(a => ({
        id: a._id,
        sourceIndex: a.sourceIndex,
        filterField: a.filterField,
        filterValue: a.filterValue,
        description: a.description,
        startDate: a.startDate,
        endDate: a.endDate,
        deleted: a.deleted,
        annotationType: a.annotationType,
        indicator: a.indicator,
        recommendation: a.recommendation,
        color: getColorForAnnotationType(a.annotationType || 'default'), 
      }));
      
      setAnnotations(processedAnnotations);
    } catch (error) {
      console.error('Error loading annotations:', error);
    } finally {
      setIsLoadingAnnotations(false);
      isLoadingRef.current = false;
    }
  }, [startDate, endDate, filterField, filterValue]);
  
  // Effect to load annotations when relevant form state changes
  useEffect(() => {
    // Skip if we don't have valid dates
    if (!startDate || !endDate) {
      return;
    }
    
    // Check if any relevant values actually changed
    const prevState = prevStateRef.current;
    const startDateChanged = !prevState.startDate || prevState.startDate !== startDate;
    const endDateChanged = !prevState.endDate || prevState.endDate !== endDate;
    const filterFieldChanged = prevState.filterField !== filterField;
    const filterValueChanged = prevState.filterValue !== filterValue;
    const indexChanged = prevState.selectedIndex !== selectedIndex;
    
    // Update previous state
    prevStateRef.current = {
      startDate,
      endDate,
      filterField,
      filterValue,
      selectedIndex
    };
    
    // Only load if something relevant changed
    if (startDateChanged || endDateChanged || filterFieldChanged || filterValueChanged || indexChanged) {
      loadAnnotations();
    }
  }, [startDate, endDate, filterField, filterValue, selectedIndex, loadAnnotations]);
  
  const handleDeleteAnnotation = async (id: string) => {
    try {
      await removeAnnotationRecord(id);
      // After deleting, reload annotations
      loadAnnotations();
    } catch (error) {
      console.error('Failed to delete annotation:', error);
    }
  };

  return {
    annotations,
    isLoadingAnnotations,
    loadAnnotations,
    handleDeleteAnnotation
  };
}