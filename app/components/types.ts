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
    createdBy: string;
    status: AnnotationStatus; 
  }

