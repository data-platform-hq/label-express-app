// app/utils/annotationOptions.ts

export const annotationTypeOptions = [
    { value: 'incident', label: 'Incident' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'deployment', label: 'Deployment' },
    { value: 'event', label: 'Event' },
    { value: 'other', label: 'Other' }
  ];
  
  export const indicatorOptions = [
    { value: 'critical', label: 'Critical' },
    { value: 'warning', label: 'Warning' },
    { value: 'info', label: 'Informational' },
    { value: 'success', label: 'Success' }
  ];
  
  export const recommendationOptions = [
    { value: 'investigate', label: 'Investigate Further' },
    { value: 'monitor', label: 'Monitor Closely' },
    { value: 'ignore', label: 'No Action Required' },
    { value: 'escalate', label: 'Escalate to Team' }
  ];
  
  // Define a common interface for options
  export interface OptionType {
    value: string;
    label: string;
  }
  
  // helper functions
  export function getOptionLabel(options: OptionType[], value: string): string {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  }