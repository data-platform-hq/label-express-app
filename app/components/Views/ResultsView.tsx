// components/ResultsView.tsx
import { TimePoint, AggregationParams } from '@/app/components/types';

interface ResultsViewProps {
  params: AggregationParams;
  results: TimePoint[];
}

export default function ResultsView({
  params,
  results
}: ResultsViewProps) {

  return (
    <div className="text-sm text-gray-500">
      <p className="text-sm text-gray-500">
        Interval: <b>{params.interval}</b> | Total periods: <b>{results.length}</b> | From: <b>{results[0]?.formattedDate || 'N/A'}</b> | To: <b>{results[results.length - 1]?.formattedDate || 'N/A'}</b>
      </p>
    </div>
  );
}