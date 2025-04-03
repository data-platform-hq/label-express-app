// hooks/useFilterValuesLoader.ts
import { useState, useEffect, use } from 'react';
import { fetchFilterValues } from '@/app/utils/actions';

export function useFilterValuesLoader(
  indexName: string,
  filterField: string,
  startDate: string | "",
  endDate: string | "",
  searchTerm: string,
) {

  const [valueToFilter, setValueToFilter] = useState('');
  const [responseValues, setResponseValues] = useState<string[]>([]);


  // Load filter values when the index name or filter field changes
  useEffect(() => {

    setValueToFilter(searchTerm);

    if (valueToFilter.length < 3) {
      return;
    }

    const fetchValues = async () => {
      const values = await fetchFilterValues(indexName, filterField, startDate, endDate, valueToFilter);
      setResponseValues(values);
    };
    fetchValues();
  }
  , [indexName, filterField, startDate, endDate, searchTerm]);

  return responseValues;

}