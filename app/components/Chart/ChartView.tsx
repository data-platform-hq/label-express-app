// components/ChartView.tsx
import { useState, useRef, useEffect } from 'react';
import { TimePoint, TooltipData, BrushMode, BrushSelection, Annotation } from '../types';
import TimeSeriesChart from '@/app/components/Chart/TimeSeriesChart';
import ScrollableLegend from '@/app/components/Chart/ScrollableLegend';
import ChartTooltip from '@/app/components/Chart/ChartTooltip';
import { AggregationParams } from '@/app/components/types';

interface ChartViewProps {
  results: TimePoint[];
  uniqueTerms: string[];
  colorScale: (term: string) => string;
  params: AggregationParams;
  brushMode: BrushMode;
  setBrushMode: (mode: BrushMode) => void;
  onBrushEnd: (selection: BrushSelection) => void;
  annotations: Annotation[];
  onZoomHistory: () => void;
}

export default function ChartView({
  results,
  uniqueTerms,
  colorScale,
  params,
  brushMode,
  setBrushMode,
  onBrushEnd,
  annotations,
  onZoomHistory
}: ChartViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visibilityInitialized = useRef(false);
  const [visibleLines, setVisibleLines] = useState<{[key: string]: boolean}>({});
  const [hoveredLegendItem, setHoveredLegendItem] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    date: '',
    values: []
  });

// Initialize visibility with only first 5 lines visible when there are more than 10 terms
useEffect(() => {
  if (!visibilityInitialized.current || Object.keys(visibleLines).length !== uniqueTerms.length) {
    const initialVisibility: {[key: string]: boolean} = {};
    
    // If more than 5 terms, only show first 5
    uniqueTerms.forEach((term, index) => {
      initialVisibility[term] = index < 5; // Show only first 5 items
    });
    
    setVisibleLines(initialVisibility);
    visibilityInitialized.current = true;
    
  }
}, [uniqueTerms, visibleLines]);

  // Prepare chart data
  const chartData = uniqueTerms.map(termName => {
    const points = results.map(point => {
      const termData = point.terms.find(t => t.term === termName);
      return {
        date: new Date(point.timestamp),
        value: termData ? termData.avgValue : 0
      };
    });
    
    return {
      name: termName,
      values: points
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="h-full w-full flex flex-col">
      <div 
        className="flex-grow flex overflow-hidden"
        ref={containerRef}
      >
        {/* this is where the chart is */}
        <div className="flex-grow relative h-full"> 
          <TimeSeriesChart
            results={results}
            uniqueTerms={uniqueTerms}
            visibleLines={visibleLines}
            hoveredLegendItem={hoveredLegendItem}
            colorScale={colorScale}
            numericField={params.numericField}
            setTooltip={setTooltip}
            brushMode={brushMode}
            onBrushEnd={onBrushEnd}
            annotations={annotations}
          />
        </div>
        
        <div className="flex-shrink-0 border-l border-gray-200 h-full">
          <ScrollableLegend
            chartData={chartData}
            visibleLines={visibleLines}
            setVisibleLines={setVisibleLines}
            setHoveredLegendItem={setHoveredLegendItem}
            colorScale={colorScale}
          />
        </div>
      </div>
      
      {tooltip.visible && (
        <ChartTooltip 
          tooltip={tooltip}
          colorScale={colorScale}
        />
      )}
    </div>
  );
}