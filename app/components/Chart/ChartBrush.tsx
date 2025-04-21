// components/ChartBrush.tsx
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { BrushMode, BrushSelection } from '@/app/types/types';
import { ChartScales, ChartDimensions } from '@/app/components/Chart/chartUtils';

interface ChartBrushProps {
  brushMode: BrushMode;
  scales: ChartScales;
  dimensions: ChartDimensions;
  onBrushEnd: (selection: BrushSelection) => void;
}

export default function ChartBrush({
  brushMode,
  scales,
  dimensions,
  onBrushEnd
}: ChartBrushProps) {
  const brushRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!brushRef.current || brushMode === 'disabled') return;
    
    const { x } = scales;
    const { margin, width, height } = dimensions;
    
    const brushLayer = d3.select(brushRef.current);
    brushLayer.selectAll("*").remove();
    
    const svg = brushLayer
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .style("position", "absolute")
      .style("top", "0")
      .style("left", "0")
      .style("pointer-events", "none");
      
    const brushGroup = svg
      .append("g")
      .attr("class", "brush")
      .style("pointer-events", "all");
      
    const brush = d3.brushX()
      .extent([[margin.left, margin.top], [margin.left + width, margin.top + height]])
      .on("end", (event) => {
        if (!event.selection) {
          onBrushEnd({ startDate: "", endDate: "", isActive: false });
          return;
        }
        
        // Convert pixel positions to dates
        const [x0, x1] = event.selection;
        const startDate = x.invert(x0).toISOString();
        const endDate = x.invert(x1).toISOString();
    
        onBrushEnd({
          startDate,
          endDate,
          isActive: true
        });
      });
      
    brushGroup.call(brush);
    
    return () => {
      brushLayer.selectAll("*").remove();
    };
  }, [brushMode, scales, dimensions, onBrushEnd]);
  
  return (
    <div 
      ref={brushRef} 
      className="absolute inset-0" 
      style={{ 
        pointerEvents: brushMode === 'disabled' ? 'none' : 'auto',
        zIndex: 10 
      }}
    />
  );
}