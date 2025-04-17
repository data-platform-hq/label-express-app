// components/DataProcessor.tsx
import { useMemo } from 'react';
import { TimePoint } from '@/app/types/types';
import * as d3 from 'd3';

interface ProcessedData {
  uniqueTerms: string[];
  colorScale: (term: string) => string;
}

// Create a persistent color mapping outside the component
// This ensures it doesn't get recreated on re-renders
const persistentColorMap = new Map<string, string>();
//const colorSchemes = [...d3.schemeCategory10, ...d3.schemeSet2, ...d3.schemeSet3];
const colorSchemes = [...d3.schemeObservable10];

//pastel2 or schemeSpectral for annotations

export function useDataProcessor(results: TimePoint[]): ProcessedData {
  // Get all unique terms across all time points
  const uniqueTerms = useMemo(() => {
    const allTerms = new Set<string>();
    results.forEach(point => {
      point.terms.forEach(term => {
        allTerms.add(term.term);
      });
    });
    return Array.from(allTerms).sort();
  }, [results]);

  // Create a persistent color scale function
  const colorScale = useMemo(() => {
    return (term: string): string => {
      // If we already assigned a color to this term, use it
      if (persistentColorMap.has(term)) {
        return persistentColorMap.get(term)!;
      }
      
      // Otherwise, assign a new color
      const assignedColors = Array.from(persistentColorMap.values());
      
      // Try to find a color from our schemes that hasn't been used yet
      const availableColor = colorSchemes.find(color => !assignedColors.includes(color));
      
      if (availableColor) {
        persistentColorMap.set(term, availableColor);
        return availableColor;
      }
      
      // If all colors are used, generate a shade from all colors
      const newColor = d3.interpolateRainbow(assignedColors.length / colorSchemes.length);
      persistentColorMap.set(term, newColor);
      return newColor;

    };
  }, []); // Empty dependency array ensures this function is created only once
    
  return {
    uniqueTerms,
    colorScale
  };
}