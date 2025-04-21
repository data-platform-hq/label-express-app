// types.ts
export interface TermData {
    term: string;
    count: number;
    avgValue: number;
  }
  
  export interface TimePoint {
    timestamp: number;
    formattedDate: string;
    terms: TermData[];
  }
    
  export interface AggregationParams {
    index: string;
    term: string;
    interval: string;
    numericField: string;
    timestamp: string;
    filterField: string;
    filterValue: string;
  }
  
  export interface TooltipData {
    visible: boolean;
    x: number;
    y: number;
    date: string;
    values: {term: string; value: number}[];
  }

  export type BrushMode = 'annotation' | 'zoom' | 'disabled';

  export interface BrushSelection {
    startDate: string | "";
    endDate: string | "";
    isActive: boolean;
  }

  export type AnnotationStatus = 'created' | 'approved' | 'rejected' | 'deleted';

  export interface AnnotationHistory {
    changedAt: string; // Date/time of the change in ISO format or desired string format
    changedBy: {
      email: string;
      userId: string;
    }; // Information about the user who made the change
    changes: Array<{
      field: string; // Name of the field that was changed
      oldValue: any; // Previous value of the field
      newValue: any; // New value of the field
    }>; // List of field changes for this particular modification
  }

  export interface Annotation {
    id?: string;
    sourceIndex: string;
    filterField: string;
    filterValue: string;
    startDate: string;
    endDate: string;
    description: string;
    deleted: boolean;
    annotationType: string;
    indicator: string;
    recommendation: string;
    color?: string;
    createdAt: string;
    createdBy: {
      email: string;
      userId: string;
    };
    status: AnnotationStatus; 
    history?: AnnotationHistory[];
  }

