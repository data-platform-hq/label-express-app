// components/VisualizationLayout.tsx
import React from 'react';

interface VisualizationLayoutProps {
  showAnnotationSidebar: boolean;
  sidebarContent: React.ReactNode;
  controlsContent: React.ReactNode;
  mainContent: React.ReactNode;
  footerContent: React.ReactNode;
  popupContent?: React.ReactNode;
}

export default function VisualizationLayout({
  showAnnotationSidebar,
  sidebarContent,
  controlsContent,
  mainContent,
  footerContent,
  popupContent
}: VisualizationLayoutProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-full">
      {/* Controls bar at the top */}
      <div className="border-b border-gray-200 p-2 bg-gray-50">
        {controlsContent}
      </div>
      
      {/* Main content area with optional sidebar */}
      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar - conditionally shown */}
        {showAnnotationSidebar && (
          <div className="w-1/5 border-r border-gray-200 bg-white overflow-y-auto">
            {sidebarContent}
          </div>
        )}    
        {/* Main content area */}
        <div className="flex-grow overflow-auto">
          {mainContent}
        </div>
      </div>
      
      {/* Footer area */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        {footerContent}
      </div>
      
      {/* Popup overlay - positioned absolutely */}
      {popupContent && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full m-4 overflow-hidden">
            {popupContent}
          </div>
        </div>
      )}
    </div>
  );
}