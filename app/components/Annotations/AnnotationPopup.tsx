// components/AnnotationPopup.tsx
import { BrushSelection, Annotation } from '@/app/types/types';
import AnnotationForm from '@/app/components/Annotations/AnnotationForm';
import { saveAnnotationRecord } from '@/app/utils/actions';
import { useSession } from "next-auth/react"


interface AnnotationPopupProps {
  brushSelection: BrushSelection;
  onCancel: () => void;
  onSuccess: () => void;
  aggregationParams: any;
}

export default function AnnotationPopup({
  brushSelection,
  onCancel,
  onSuccess,
  aggregationParams
}: AnnotationPopupProps) {

  const { data: session } = useSession()
  const user = session?.user?.name

  const handleCreateAnnotation = async (formData: {
    description: string;
    annotationType: string;
    indicator: string;
    recommendation: string;

  }) => {

    if (!brushSelection.startDate || !brushSelection.endDate) return;
    
    try {
      // to-do: remove id
      const newAnnotation: Annotation = {
        sourceIndex: aggregationParams.index,
        filterField: aggregationParams.filterField,
        filterValue: aggregationParams.filterValue,
        description: formData.description,
        startDate: brushSelection.startDate,
        endDate: brushSelection.endDate,
        deleted: false,
        annotationType: formData.annotationType,
        indicator: formData.indicator,
        recommendation: formData.recommendation,
        createdAt: new Date().toISOString(),
        createdBy: {
          email: session?.user?.email || '',
          userId: session?.user?.id || ''
        },
        
        status: 'created'
      };

      // Save annotation
      await saveAnnotationRecord(newAnnotation);
      
      // Call success callback
      onSuccess();
    } catch (error) {
      console.error('Failed to create annotation:', error);
      // Optional: Show error toast/notification
    }
  };

  return (
    <div className="overlay">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Create Annotation</h3>
          <AnnotationForm
              startDate={brushSelection.startDate}
              endDate={brushSelection.endDate}
              onSubmit={handleCreateAnnotation}
              onCancel={onCancel}
          />
      </div>
    </div>


  );
}