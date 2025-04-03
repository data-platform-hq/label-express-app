// utils/intervalUtils.ts
// Define interval options with their approximate duration in milliseconds
const intervalOptions = [
  { value: "1m", label: "1 Minute", ms: 60 * 1000 },
  { value: "5m", label: "5 Minutes", ms: 5 * 60 * 1000 },
  { value: "15m", label: "15 Minutes", ms: 15 * 60 * 1000 },
  { value: "30m", label: "30 Minutes", ms: 30 * 60 * 1000 },
  { value: "1h", label: "1 Hour", ms: 60 * 60 * 1000 },
  { value: "3h", label: "3 Hours", ms: 3 * 60 * 60 * 1000 },
  { value: "12h", label: "12 Hours", ms: 12 * 60 * 60 * 1000 },
  { value: "1d", label: "1 Day", ms: 24 * 60 * 60 * 1000 },
  { value: "7d", label: "1 Week", ms: 7 * 24 * 60 * 60 * 1000 }, // Use 7d instead of 1w
  { value: "30d", label: "30 Days", ms: 30 * 24 * 60 * 60 * 1000 } // Use 30d instead of 1M
];
  
  // Maximum number of data points to aim for
  const TARGET_DATA_POINTS = 1000;
  
  /**
   * Calculate the optimal interval based on the date range
   * @param startDate Start date of the range
   * @param endDate End date of the range
   * @returns The optimal interval value
   */
  export function calculateOptimalInterval(startDate: string | null, endDate: string | null): string {


    // Convert string dates to Date objects asuming the string contain UTC date
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;
    const startDateUTC = startDateObj ? new Date(startDateObj.getTime() + startDateObj.getTimezoneOffset() * 60000) : null;
    const endDateUTC = endDateObj ? new Date(endDateObj.getTime() + endDateObj.getTimezoneOffset() * 60000) : null;
    // If either date is null, return default interval


    // Default to 1d if dates are not provided
    if (!startDateUTC || !endDateUTC) {
      return "1d";
    }
  
    // Calculate the range in milliseconds
    const rangeMs = endDateUTC.getTime() - startDateUTC.getTime();
    
    // Calculate the ideal interval duration
    const idealIntervalMs = rangeMs / TARGET_DATA_POINTS;
    
    // Find the closest interval option that's not smaller than the ideal
    for (const option of intervalOptions) {
      if (option.ms >= idealIntervalMs) {
        return option.value;
      }
    }
    
    // If all intervals are too small, return the largest one
    return intervalOptions[intervalOptions.length - 1].value;
  }
  
  /**
   * Get all available interval options for UI display
   */
  export function getIntervalOptions() {
    return intervalOptions.map(option => ({
      value: option.value,
      label: option.label
    }));
  }