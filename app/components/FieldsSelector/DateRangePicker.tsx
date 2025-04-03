// components/DateRangePicker.tsx
import React from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateRangePickerProps {
  startDate: string | "";
  endDate: string | "";
  onStartDateChange: (dateStr: string) => void;
  onEndDateChange: (dateStr: string) => void;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}: DateRangePickerProps) {

  // Convert string to Date for the DatePicker
  const parseDate = (dateStr: string | null): Date | null => {
    return dateStr ? new Date(dateStr) : null;
  };

  // Convert Date to ISO string for the parent component
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      onStartDateChange(date.toISOString());
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      onEndDateChange(date.toISOString());
    }
  };


  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
        <DatePicker
          selected={parseDate(startDate)}
          onChange={handleStartDateChange}
          className="w-full pl-3 pr-26 py-2 text-sm border border-gray-300 bg-white rounded-md shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    appearance-none"
          placeholderText="Start date"
          dateFormat="yyyy-MM-dd HH:mm"
          isClearable
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
        <DatePicker
          selected={parseDate(endDate)}
          onChange={handleEndDateChange}
          className="w-full pl-3 pr-26 py-2 text-sm border border-gray-300 bg-white rounded-md shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    appearance-none"
          placeholderText="End date"
          dateFormat="yyyy-MM-dd HH:mm"
          isClearable
        />
      </div>
    </>
  );
}