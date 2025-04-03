// components/SummaryStatistics.tsx
import { TimePoint } from '@/app/components/types';

interface SummaryStatisticsProps {
  results: TimePoint[];
  uniqueTerms: string[];
}

export default function SummaryStatistics({ results, uniqueTerms }: SummaryStatisticsProps) {
  return (
    <div className="px-4 py-5 sm:p-6">
      <h4 className="text-md font-medium text-gray-900 mb-4">Summary Statistics</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {uniqueTerms.map(termName => {
          // Calculate average, min, max for each term
          const termValues = results
            .flatMap(point => point.terms.filter(t => t.term === termName))
            .map(t => t.avgValue);
          
          const avg = termValues.length 
            ? termValues.reduce((sum, val) => sum + val, 0) / termValues.length 
            : 0;
          
          const min = termValues.length ? Math.min(...termValues) : 0;
          const max = termValues.length ? Math.max(...termValues) : 0;
          
          return (
            <div key={termName} className="bg-gray-50 rounded-lg p-4 border">
              <h5 className="font-medium text-gray-900">{termName}</h5>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  Average: <span className="font-medium">{avg.toFixed(2)}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Min: <span className="font-medium">{min.toFixed(2)}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Max: <span className="font-medium">{max.toFixed(2)}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Data points: <span className="font-medium">{termValues.length}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}