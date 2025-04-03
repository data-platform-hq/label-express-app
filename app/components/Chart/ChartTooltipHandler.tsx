// components/ChartTooltipHandler.tsx
import { useEffect } from 'react';
import * as d3 from 'd3';
import { BrushMode, TimePoint, TooltipData } from '@/app/components/types';
import { ChartScales, ChartDimensions } from '@/app/components/Chart/chartUtils';

interface ChartTooltipHandlerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  results: TimePoint[];
  scales: ChartScales;
  dimensions: ChartDimensions;
  visibleLines: {[key: string]: boolean};
  setTooltip: (tooltipData: TooltipData | ((prev: TooltipData) => TooltipData)) => void;
  brushMode?: BrushMode
}

export default function ChartTooltipHandler({
  canvasRef,
  results,
  scales,
  dimensions,
  visibleLines,
  setTooltip,
  brushMode = 'disabled'
}: ChartTooltipHandlerProps) {
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const { x } = scales;
    const { margin, width } = dimensions;
    
    // Mouse move handler for tooltip
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      
      // Only show tooltip if mouse is in the chart area
      if (mouseX < margin.left || mouseX > margin.left + width) {
        setTooltip(prev => ({ ...prev, visible: false }));
        return;
      }
      
      // Find the closest time point
      const mouseDate = x.invert(mouseX);
      const bisect = d3.bisector((d: TimePoint) => new Date(d.timestamp)).left;
      const index = bisect(results, mouseDate);
      const closestPoint = results[Math.min(results.length - 1, index)];
      
      if (!closestPoint) return;
      
      // Calculate distance to determine if we're close enough to show tooltip
      const pointX = x(new Date(closestPoint.timestamp));
      const distance = Math.abs(mouseX - pointX);
      
      if (distance > 30) {
        setTooltip(prev => ({ ...prev, visible: false }));
        return;
      }
      
      // Prepare tooltip data
      const tooltipData = {
        visible: true,
        x: pointX,
        y: margin.top,
        date: closestPoint.formattedDate,
        values: closestPoint.terms
          .filter(term => visibleLines[term.term])
          .map(term => ({
            term: term.term,
            value: term.avgValue
          }))
      };
      
      // sort values by term name
      tooltipData.values.sort((a, b) => a.term.localeCompare(b.term));

      setTooltip(tooltipData);
    };
    
    // Add mouse event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', () => {
      setTooltip(prev => ({ ...prev, visible: false }));
    });
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', () => {
        setTooltip(prev => ({ ...prev, visible: false }));
      });
    };
  }, [canvasRef, results, scales, dimensions, visibleLines, setTooltip]);
  
  return null; // This is a non-visual component
}