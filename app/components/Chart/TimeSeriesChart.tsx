// components/TimeSeriesChart.tsx
import { useEffect, useRef, useState, useMemo } from 'react';
import { TimePoint, TooltipData, BrushMode, BrushSelection, Annotation } from '@/app/components/types';
import { 
  setupChartDimensions, 
  createChartScales, 
  prepareChartData, 
  drawGrid, 
  drawAxes, 
  drawDataLines, 
  drawAnnotations,
  ChartScales,
  ChartDimensions
} from '@/app/components/Chart/chartUtils';
import ChartBrush from '@/app/components/Chart/ChartBrush';
import ChartTooltipHandler from '@/app/components/Chart/ChartTooltipHandler';

interface TimeSeriesChartProps {
  results: TimePoint[];
  uniqueTerms: string[];
  visibleLines: {[key: string]: boolean};
  hoveredLegendItem: string | null;
  colorScale: (term: string) => string;
  numericField: string;
  setTooltip: (tooltipData: TooltipData | ((prev: TooltipData) => TooltipData)) => void;
  brushMode: BrushMode;
  onBrushEnd?: (selection: BrushSelection) => void;
  annotations?: Annotation[];
}

export default function TimeSeriesChart({
  results,
  uniqueTerms,
  visibleLines,
  hoveredLegendItem,
  colorScale,
  numericField,
  setTooltip,
  brushMode = 'disabled',
  onBrushEnd = () => {},
  annotations 
}: TimeSeriesChartProps) {


  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
 
  // Prepare chart data using useMemo to avoid unnecessary recalculations
  const chartData = useMemo(() => 
    prepareChartData(results, uniqueTerms), 
    [results, uniqueTerms]
  );
  
  // Calculate dimensions and scales only when canvas size or data changes
  const dimensions = useMemo(() => {
    if (canvasSize.width === 0 || canvasSize.height === 0) return null;
    
    // Pass the visibleLines object to dynamically adjust dimensions
    return setupChartDimensions(canvasSize.width, canvasSize.height, visibleLines);
  }, [canvasSize.width, canvasSize.height, visibleLines]); 
  
// In TimeSeriesChart.tsx
  const scales = useMemo(() => {
    if (!dimensions || results.length === 0) return null;
    return createChartScales(results, chartData, dimensions, visibleLines);
  }, [dimensions, results, chartData, visibleLines]); // Add visibleLines to dependencies
  
  // Effect to measure canvas size
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    
    const updateCanvasSize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      
      const container = containerRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match container size
      setCanvasSize({
        width: container.clientWidth,
        height: container.clientHeight
      });
    };
    
    // Initial size measurement
    updateCanvasSize();
    
    // Create a ResizeObserver to detect container size changes
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(containerRef.current);
    
    // Also listen for window resize as a fallback
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);
  
  // Main rendering effect
  useEffect(() => {
    if (!canvasRef.current || !dimensions || !scales || results.length === 0) return;
    
    // Get the device pixel ratio for high-resolution displays
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Get canvas and context
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set the canvas size accounting for pixel ratio
    canvas.width = dimensions.canvasWidth * pixelRatio;
    canvas.height = dimensions.canvasHeight * pixelRatio;
    
    // Scale the context to account for pixel ratio
    ctx.scale(pixelRatio, pixelRatio);
    
    // Clear canvas
    ctx.clearRect(0, 0, dimensions.canvasWidth, dimensions.canvasHeight);
    
    // Draw grid
    drawGrid(ctx, scales, dimensions);
    
    // Draw annotations
    drawAnnotations(ctx, annotations || [], scales, dimensions);
    
    // Draw axes
    drawAxes(ctx, scales, dimensions, visibleLines, colorScale);
    
    // Draw data lines
    drawDataLines(ctx, chartData, scales, colorScale, visibleLines);

    // // Add this to your main rendering effect in TimeSeriesChart.tsx
    // // Debug outline to see canvas boundaries
    // ctx.strokeStyle = 'red';
    // ctx.lineWidth = 1;
    // ctx.strokeRect(0, 0, dimensions.canvasWidth, dimensions.canvasHeight);

    // // Debug outline to see chart area
    // ctx.strokeStyle = 'blue';
    // ctx.lineWidth = 1;
    // ctx.strokeRect(
    //   dimensions.margin.left, 
    //   dimensions.margin.top, 
    //   dimensions.width, 
    //   dimensions.height
    // );

    
  }, [
    results, 
    chartData, 
    dimensions, 
    scales, 
    visibleLines, 
    hoveredLegendItem, 
    colorScale, 
    numericField, 
    annotations
  ]);
  
  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full"
      />
      
      {scales && dimensions && (
        <>
          <ChartTooltipHandler
            canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
            results={results}
            scales={scales}
            dimensions={dimensions}
            visibleLines={visibleLines}
            setTooltip={setTooltip}
          />
          
          {brushMode !== 'disabled' && (
            <ChartBrush
              brushMode={brushMode}
              scales={scales}
              dimensions={dimensions}
              onBrushEnd={onBrushEnd}
            />
          )}
        </>
      )}
    </div>
  );
}