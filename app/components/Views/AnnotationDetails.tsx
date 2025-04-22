// components/AnnotationDetails.tsx
import { TimePoint } from '@/app/types/types';

interface AnnotationDetailsProps {
  results: TimePoint[];
  uniqueTerms: string[];
  selectedAnnotation?: any | null;
}

export default function AnnotationDetails({ results, uniqueTerms, selectedAnnotation }: AnnotationDetailsProps) {
  return (
    <div className="px-4 py-2 sm:p-9">
         {/* Show annotation details if one is selected */}
         {selectedAnnotation && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-blue-800">
              Selected Annotation
            </h3>

          </div>
          
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Time Range:</p>
              <p className="font-medium">
                {new Date(selectedAnnotation.startDate).toLocaleString()} - {new Date(selectedAnnotation.endDate).toLocaleString()}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Type:</p>
              <p className="font-medium">{selectedAnnotation.annotationType}</p>
            </div>
            
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Description:</p>
              <p className="font-medium">{selectedAnnotation.description}</p>
            </div>
            
            {selectedAnnotation.indicator && (
              <div>
                <p className="text-sm text-gray-600">Indicator:</p>
                <p className="font-medium">{selectedAnnotation.indicator}</p>
              </div>
            )}
            
            {selectedAnnotation.recommendation && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Recommendation:</p>
                <p className="font-medium">{selectedAnnotation.recommendation}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-600">Created By:</p>
              <p className="font-medium">{selectedAnnotation.createdBy}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Created At:</p>
              <p className="font-medium">{new Date(selectedAnnotation.createdAt).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-2 border-t border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Statistics for this time period:</h4>
            {/* You can add specific statistics for the annotation time period here */}
          </div>
        </div>
      )}

    </div>
  );
}