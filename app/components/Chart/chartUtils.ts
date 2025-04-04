// utils/chartUtils.ts - Improved version for multi-axes charts
import * as d3 from 'd3';
import { TimePoint, Annotation } from '@/app/components/types';

export interface ChartDimensions {
  margin: { top: number; right: number; bottom: number; left: number };
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface ChartScales {
  x: d3.ScaleTime<number, number>;
  yScales: Map<string, d3.ScaleLinear<number, number>>;
}

// Setup chart dimensions with dynamic margins based on visible lines
export function setupChartDimensions(
  canvasWidth: number, 
  canvasHeight: number, 
  visibleLines: {[key: string]: boolean} = {}
): ChartDimensions {
  // Count visible lines
  const visibleLinesCount = Object.values(visibleLines).filter(Boolean).length;
  
  // Calculate left margin based on visible axes
  const axisSpacing = 40; // Space between axes
  const baseLeftMargin = 60; // Base margin for one axis
  const leftMargin = baseLeftMargin + (visibleLinesCount > 1 ? (visibleLinesCount - 1) * axisSpacing : 0);
  
  const margin = { 
    top: 20, 
    right: 0, 
    bottom: 40, 
    left: leftMargin 
  };
  
  // These should be the actual drawing area dimensions
  const width = canvasWidth - margin.left - margin.right;
  const height = canvasHeight - margin.top - margin.bottom;
  
  return {
    margin,
    width,
    height,
    canvasWidth,
    canvasHeight
  };
}

// Create chart scales for X and Y axes
// X scale is shared, Y scales are separate for each series
export function createChartScales(
  results: TimePoint[], 
  chartData: Array<{name: string, values: Array<{date: Date, value: number}>}>,
  dimensions: ChartDimensions,
  visibleLines: {[key: string]: boolean} = {},
  domainPadding: number = 0.1
): ChartScales {
  const { margin, width, height } = dimensions;
  
  // Get all data points from visible lines for more accurate domain calculation
  const allVisiblePoints: {date: Date}[] = [];
  chartData.forEach(series => {
    if (visibleLines[series.name] && series.values.length > 0) {
      allVisiblePoints.push(...series.values);
    }
  });
  
  // Use the actual data points for domain calculation if available
  let dateExtent: [Date, Date];
  if (allVisiblePoints.length > 0) {
    dateExtent = d3.extent(allVisiblePoints, d => d.date) as [Date, Date];
  } else {
    dateExtent = d3.extent(results, d => new Date(d.timestamp)) as [Date, Date];
  }
  
  // Add a small padding to the date range if there's only one data point
  // or if the range is very small
  if (!dateExtent[0] || !dateExtent[1] || 
      dateExtent[0].getTime() === dateExtent[1].getTime() ||
      dateExtent[1].getTime() - dateExtent[0].getTime() < 60000) { // less than a minute
    const day = 24 * 60 * 60 * 1000; // milliseconds in a day
    const midPoint = dateExtent[0] ? dateExtent[0].getTime() : Date.now();
    dateExtent[0] = new Date(midPoint - day/2);
    dateExtent[1] = new Date(midPoint + day/2);
  }
  
  // X scale - use the exact width between margins
  const x = d3.scaleTime()
    .domain(dateExtent)
    .range([margin.left, margin.left + width]);  // Remove .nice() to ensure exact alignment
  
  // Y scales (create a separate y-scale for each data series)
  const yScales = new Map<string, d3.ScaleLinear<number, number>>();
  
  // Only create scales for visible lines
  chartData.forEach(series => {
    if (visibleLines[series.name] && series.values.length > 0) {
      // Find min and max values
      const minValue = d3.min(series.values, d => d.value) || 0;
      const maxValue = d3.max(series.values, d => d.value) || 0;
      
      // Calculate domain padding
      const valueRange = maxValue - minValue;
      const paddingAmount = valueRange * domainPadding;
      
      // Create scale with padding
      const y = d3.scaleLinear()
        .domain([
          Math.max(0, minValue - paddingAmount), // Don't go below zero for most metrics
          maxValue + paddingAmount
        ])
        .range([margin.top + height, margin.top]) // Use full height between margins
        .nice(); // Keep .nice() for y-axis to have clean tick values

      yScales.set(series.name, y);
    }
  });

  return { x, yScales };
}

// Draw grid lines
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  scales: ChartScales,
  dimensions: ChartDimensions
): void {
  const { x, yScales } = scales;
  const { margin, width, height } = dimensions;
  
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 0.5;
  
  // Draw X grid lines
  const xTicks = x.ticks(7); // Limit number of ticks for better readability
  xTicks.forEach(tick => {
    const xPos = x(tick);
    ctx.moveTo(xPos, margin.top);
    ctx.lineTo(xPos, margin.top + height);
  });

  // Draw Y grid lines - choosing one yScale for the purpose
  if (yScales.size > 0) {
    const y = Array.from(yScales.values())[0];
    const yTicks = y.ticks(5); // Limit to 5 ticks for better readability
    yTicks.forEach(tick => {
      const yPos = y(tick);
      ctx.moveTo(margin.left, yPos);
      ctx.lineTo(margin.left + width, yPos);
    });
  }

  ctx.stroke();
}

// Format date based on time range
function formatDate(date: Date, timeRange: number): string {
  // timeRange is in milliseconds
  const days = timeRange / (24 * 60 * 60 * 1000);
  
  if (days <= 1) {
    // For ranges less than a day, show hours and minutes
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days <= 7) {
    // For ranges less than a week, show day and time
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  } else if (days <= 31) {
    // For ranges less than a month, show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } else {
    // For longer ranges, show month and year
    return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
  }
}

// Draw axes with all y-axes on the left side
export function drawAxes(
  ctx: CanvasRenderingContext2D,
  scales: ChartScales,
  dimensions: ChartDimensions,
  visibleLines: {[key: string]: boolean} = {},
  colorScale: (term: string) => string,
): void {
  const { x, yScales } = scales;
  const { margin, width, height } = dimensions;
  
  // Calculate time range for formatting dates
  const timeRange = x.domain()[1].getTime() - x.domain()[0].getTime();
  
  // Draw X axis
  ctx.beginPath();
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.moveTo(margin.left, margin.top + height);
  ctx.lineTo(margin.left + width, margin.top + height);
  ctx.stroke();
  
  // Draw X axis ticks and labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'black';
  ctx.font = '10px sans-serif';
  const xTicks = x.ticks(5); // Limit number of ticks for better readability
  xTicks.forEach(tick => {
    const xPos = x(tick);
    ctx.beginPath();
    ctx.moveTo(xPos, margin.top + height);
    ctx.lineTo(xPos, margin.top + height+5);
    ctx.stroke();
    
    // Format date based on the time range
    const formattedDate = formatDate(tick, timeRange);
    ctx.fillText(formattedDate, xPos, margin.top + height + 8);
  });
  
  // Draw Y axes for each series - all on the left side
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = '10px sans-serif';
  
  // Calculate spacing for multiple y-axes on the left
  const axisSpacing = 40; // Space between each axis
  
  // Filter visible series and their scales
  const visibleSeries = Array.from(yScales.entries())
    .filter(([seriesName]) => visibleLines[seriesName])
    .map(([seriesName, scale]) => ({ seriesName, scale }));
  
  // Draw each y-axis for visible lines only
  visibleSeries.forEach(({ seriesName, scale }, index) => {
    // Position each axis with spacing - using dynamic positions based on visible axes
    const axisX = margin.left - index * axisSpacing;
    
    ctx.strokeStyle = colorScale(seriesName);
    
    // Draw Y axis line
    ctx.beginPath();
    ctx.moveTo(axisX, margin.top);
    ctx.lineTo(axisX, margin.top + height);
    ctx.stroke();

    // Draw Y axis ticks and labels
    const yTicks = scale.ticks(10); // Limit to 5 ticks to avoid crowding
    yTicks.forEach(tick => {
      const yPos = scale(tick);
      ctx.beginPath();
      ctx.moveTo(axisX, yPos);
      ctx.lineTo(axisX - 5, yPos);
      ctx.stroke();
      
      // Format number with appropriate units (k, M, etc.)
      const formattedValue = formatNumber(tick);
      ctx.fillText(formattedValue, axisX - 8, yPos);
    });
    
    // Draw axis label (series name)
    ctx.save();
    ctx.translate(axisX - 30, margin.top + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    
    // Truncate long series names
    const displayName = seriesName.length > 15 ? seriesName.substring(0, 13) + '...' : seriesName;
    ctx.fillText(displayName, 0, 0);
    ctx.restore();
  });
}

// Format number with appropriate units (k, M, etc.)
function formatNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'M';
  } else if (Math.abs(value) >= 1_000) {
    return (value / 1_000).toFixed(1) + 'k';
  } else if (Math.abs(value) < 0.01 && value !== 0) {
    return value.toExponential(1);
  } else {
    return value.toFixed(Math.abs(value) < 1 ? 2 : 0);
  }
}

// Draw data series lines
export function drawDataLines(
  ctx: CanvasRenderingContext2D,
  chartData: Array<{name: string, values: Array<{date: Date, value: number}>}>,
  scales: ChartScales,
  colorScale: (term: string) => string,
  visibleLines: {[key: string]: boolean},
  lineWidth: number = 1.5,
): void {
  const { x, yScales } = scales;

  // Line generator
  const line = d3.line<{date: Date, value: number}>()
    // .x(d => x(d.date))
    .x(d => Math.round(x(d.date))) 
    .context(ctx)
    .curve(d3.curveMonotoneX); // Use monotone curve for smoother lines
  
  chartData.forEach((series) => {
    const y = yScales.get(series.name);
    if (y && visibleLines[series.name]) {
      const color = colorScale(series.name);
      
      // Draw the line
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      // Ensure we're drawing with crisp lines
      ctx.save();
      ctx.translate(0.5, 0.5); // Offset by 0.5 pixel for crisp lines


      line.y(d => y(d.value))(series.values);
      ctx.stroke();

      // ctx.restore(); // Restore original context state
    }
  });
}

// Draw annotations with persisted colors
export function drawAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: Annotation[],
  scales: ChartScales,
  dimensions: ChartDimensions,
  colorMapping: {[key: string]: string} = {}
): void {
  const { x } = scales;
  const { margin, width, height } = dimensions;

  // Fallback color
  const fallbackColor = 'rgba(108, 117, 125, 0.3)';

  ctx.save();
  ctx.globalAlpha = 0.1;
  
  annotations.forEach(annotation => {
    if (annotation.deleted) return; // Skip deleted annotations
    
    // Convert dates to Date objects
    const startDate = new Date(annotation.startDate);
    const endDate = new Date(annotation.endDate);
    
    // Use the x scale to convert dates to pixel coordinates
    const startX = Math.max(margin.left, x(startDate));
    const endX = Math.min(margin.left + width, x(endDate));
    
    // Ensure the annotation stays within the chart area
    if (startX >= margin.left + width || endX <= margin.left) {
      // Annotation is completely outside the visible area, skip it
      return;
    }
    
    // Calculate width of the annotation
    const rectWidth = endX - startX;
    
    // Skip if width is too small
    if (rectWidth <= 0) return;
    
    // Get the annotation type and find its color
    const annotationType = annotation.annotationType;
    
    // Draw annotation background
    ctx.fillStyle = annotation.color || fallbackColor;
    ctx.fillRect(startX, margin.top, rectWidth, height);
    
    // Draw annotation label
    ctx.fillStyle = "black";
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Only draw text if there's enough space
    if (rectWidth > 30) {
      // Capitalize first letter of annotation type
      const displayText = annotationType.charAt(0).toUpperCase() + 
                          annotationType.slice(1).toLowerCase();
      
      ctx.fillText(
        displayText, 
        startX + rectWidth / 2, 
        margin.top + 5, 
        rectWidth - 10 // Max width to prevent text overflow
      );
    }
  });
  
  ctx.restore();
}

// Prepare chart data from time points
export function prepareChartData(
  results: TimePoint[],
  uniqueTerms: string[]
): Array<{name: string, values: Array<{date: Date, value: number}>}> {
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
      values: points.filter(p => p.value !== 0) // Filter out zero values
    };
  });

  // Sort chart data by term name
  return chartData.sort((a, b) => a.name.localeCompare(b.name));
}