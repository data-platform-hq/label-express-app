// components/ChartTooltip.tsx
import { TooltipData } from '@/app/components/types';

interface ChartTooltipProps {
  tooltip: TooltipData;
  colorScale: (term: string) => string;
}

export default function ChartTooltip({ tooltip, colorScale }: ChartTooltipProps) {
  if (!tooltip.visible) return null;
  
  return (
    <div 
      className="absolute bg-white p-2 shadow-lg rounded border border-gray-200 z-10"
      style={{
        left: `${tooltip.x + 5}px`,
        transform: 'translateY(0)',
        pointerEvents: 'none',
        maxWidth: '250px'
      }}
    >
      <div className="font-medium text-sm border-b pb-1 mb-1">{tooltip.date}</div>
      <div className="space-y-1">
        {tooltip.values.map((item) => (
          <div key={item.term} className="flex items-center text-sm">
            <span 
              className="w-3 h-3 mr-2 rounded-full" 
              style={{ backgroundColor: colorScale(item.term) }}
            ></span>
            <span className="mr-2">{item.term}:</span>
            <span className="font-medium">{item.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}