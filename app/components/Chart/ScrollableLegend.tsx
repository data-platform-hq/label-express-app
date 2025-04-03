// components/ScrollableLegend.tsx
import React, { useState, useEffect } from 'react';

// Define the LegendProps interface
interface LegendProps {
  chartData: Array<{name: string, values: Array<{date: Date, value: number}>}>;
  visibleLines: {[key: string]: boolean};
  setVisibleLines: (value: {[key: string]: boolean}) => void;
  setHoveredLegendItem: (value: string | null) => void;
  colorScale: (term: string) => string;
  itemsPerPage?: number;
}

export default function ScrollableLegend({ 
  chartData, 
  visibleLines, 
  setVisibleLines, 
  setHoveredLegendItem,
  colorScale,
  itemsPerPage = 17 
}: LegendProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(chartData.length / itemsPerPage);
  
  // Reset to first page when chart data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [chartData.length]);
  
  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = chartData.slice(indexOfFirstItem, indexOfLastItem);
  
  const handleToggleVisibility = (term: string) => {
    setVisibleLines({
      ...visibleLines,
      [term]: !visibleLines[term]
    });
  };
  
  const handleToggleAll = () => {
    const allVisible = chartData.every(series => visibleLines[series.name]);
    const newVisibility: {[key: string]: boolean} = {};
    
    chartData.forEach(series => {
      newVisibility[series.name] = !allVisible;
    });
    
    setVisibleLines(newVisibility);
  };

  // Toggle visibility for current page items only
  const handleTogglePage = () => {
    const allPageItemsVisible = currentItems.every(series => visibleLines[series.name]);
    const newVisibility = {...visibleLines};
    
    currentItems.forEach(series => {
      newVisibility[series.name] = !allPageItemsVisible;
    });
    
    setVisibleLines(newVisibility);
  };
  

  
  // Calculate stats
  const visibleCount = Object.values(visibleLines).filter(Boolean).length;
  const hiddenCount = chartData.length - visibleCount;
  
  return (
    <div className="w-48 h-full flex flex-col bg-white">
      {/* Header with controls */}
      <div className="flex-shrink-0 p-2 border-b border-gray-200 space-y-2">
        {/* Global controls */}
        <div className="flex space-x-1">
          <button 
            onClick={handleToggleAll}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded flex-grow text-center"
          >
            {chartData.every(series => visibleLines[series.name]) 
              ? "Hide All" 
              : "Show All"}
          </button>
        </div>
      </div>
      
      {/* Legend items for current page */}
      <div className="flex-grow overflow-y-auto p-2">
        <div className="space-y-1">
          {currentItems.map((series) => (
            <div 
              key={series.name}
              className={`flex items-center p-1 rounded hover:bg-gray-100 ${
                visibleLines[series.name] ? 'opacity-100' : 'opacity-50'
              }`}
              onMouseEnter={() => setHoveredLegendItem(series.name)}
              onMouseLeave={() => setHoveredLegendItem(null)}
            >
              {/* Checkbox with proper alignment */}
              <input
                type="checkbox"
                checked={visibleLines[series.name] || false}
                onChange={() => handleToggleVisibility(series.name)}
                className="h-4 w-4 flex-shrink-0"
              />
              
              {/* Color circle with consistent spacing */}
              <div 
                className="w-4 h-4 rounded-full mx-2 flex-shrink-0"
                style={{ backgroundColor: colorScale(series.name) }}
              />
              
              {/* Text that takes remaining space */}
              <span 
                className="text-sm truncate flex-grow cursor-pointer"
                onClick={() => handleToggleVisibility(series.name)}
                title={series.name}
              >
                {series.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer with pagination */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 p-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`text-xs px-2 py-1 rounded ${
                currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <span className="text-xs text-gray-500">
              {currentPage}/{totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`text-xs px-2 py-1 rounded ${
                currentPage === totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}