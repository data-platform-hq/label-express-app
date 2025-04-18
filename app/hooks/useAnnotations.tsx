// components/useAnnotations.tsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { Annotation } from '@/app/types/types';
import { fetchAnnotationRecords, updateAnnotationRecord } from '@/app/utils/actions';
import { useFormState } from '@/app/contexts/FormStateContext';
import * as d3 from 'd3';

interface UpdateResult {
  success: boolean;
  updatedAnnotation?: Annotation | null; // Include the updated annotation data
  deletedId?: string | null;
}

interface UseAnnotationsResult {
  annotations: Annotation[];
  isLoadingAnnotations: boolean;
  loadAnnotations: () => Promise<void>;
  updateAnnotation: (documentId: string, actionType: 'update' | 'delete', updatePayload: any) => Promise<UpdateResult>;
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
  const { selectedIndex, startDate, endDate, filterField, filterValue } = useFormState();
  const prevStateRef = useRef({});
  const isLoadingRef = useRef(false);

  const loadAnnotations = useCallback(async () => {
    if (isLoadingRef.current || !startDate || !endDate) {
      return;
    }
    isLoadingRef.current = true;
    setIsLoadingAnnotations(true);
    try {
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
        createdBy: a.createdBy,
        createdAt: a.createdAt,
        status: a.status,
      }));

      setAnnotations(processedAnnotations); // Update state
    } catch (error) {
      console.error('Error loading annotations:', error);
      setAnnotations([]); // Clear on error maybe?
    } finally {
      setIsLoadingAnnotations(false);
      isLoadingRef.current = false;
    }
  }, [startDate, endDate, filterField, filterValue]);

  useEffect(() => {
    if (!startDate || !endDate) {
      return;
    }
    const prevState = prevStateRef.current;
    const startDateChanged = !prevState.startDate || prevState.startDate !== startDate;
    const endDateChanged = !prevState.endDate || prevState.endDate !== endDate;
    const filterFieldChanged = prevState.filterField !== filterField;
    const filterValueChanged = prevState.filterValue !== filterValue;
    const indexChanged = prevState.selectedIndex !== selectedIndex;

    prevStateRef.current = { startDate, endDate, filterField, filterValue, selectedIndex };

    // Only load if range or filters change significantly
    // Or if it's the initial load (prevState is empty)
    if (startDateChanged || endDateChanged || filterFieldChanged || filterValueChanged || indexChanged || annotations.length === 0 ) {
         loadAnnotations();
    }
  }, [startDate, endDate, filterField, filterValue, selectedIndex, loadAnnotations, annotations.length]); // Add annotations.length dependency


  // Modified updateAnnotation function
  const updateAnnotation = async (
        id: string,
        actionType: 'update' | 'delete',
        updatePayload: any
    ): Promise<UpdateResult> => {
    try {
      // Call the backend
      // Assuming updateAnnotationRecord handles both update and soft delete logic
      const backendResult = await updateAnnotationRecord(id, actionType, updatePayload);

      // If backend indicates success (modify based on actual return value)
      if (backendResult) { // Assume backendResult is truthy on success
          if (actionType === 'update') {
              // Create the updated annotation object based on the payload
              // Important: Ensure the payload contains all necessary fields or merge with existing
              const updatedAnnotationData: Annotation = {
                  ...annotations.find(a => a.id === id), // Find existing data
                  ...updatePayload, // Apply updates from payload
                  id: id, // Ensure ID is present
                  color: getColorForAnnotationType(updatePayload.annotationType || annotations.find(a => a.id === id)?.annotationType || 'default'), // Recalculate color if type changed
              };

              // Update local state IMMEDIATELY
              setAnnotations(prevAnnotations =>
                  prevAnnotations.map(ann =>
                      ann.id === id ? updatedAnnotationData : ann
                  )
              );
              return { success: true, updatedAnnotation: updatedAnnotationData };

          } else if (actionType === 'delete') {
              // Update local state IMMEDIATELY (remove the annotation)
              setAnnotations(prevAnnotations =>
                  prevAnnotations.filter(ann => ann.id !== id)
              );
              return { success: true, deletedId: id };
          }
      }
      // If backend failed or returned falsy
       console.error('Backend annotation update/delete failed for:', id, actionType);
      return { success: false };

    } catch (error) {
      console.error(`Failed to ${actionType} annotation:`, error);
      return { success: false };
    }
  };

  return {
    annotations,
    isLoadingAnnotations,
    loadAnnotations,
    updateAnnotation,
  };
}