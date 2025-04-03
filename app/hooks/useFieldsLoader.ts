// hooks/useFieldsLoader.ts
import { useState, useEffect } from 'react';
import { fetchIndexFields } from '@/app/utils/actions';

export function useFieldsLoader(selectedIndex: string) {
  const [fields, setFields] = useState<{
    dateFields: string[];
    termFields: string[];
    numericFields: string[];
  }>({ dateFields: [], termFields: [], numericFields: [] });

  useEffect(() => {
    async function loadFields() {
      if (!selectedIndex) {
        setFields({ dateFields: [], termFields: [], numericFields: [] });
        return;
      }

      const indexFields = await fetchIndexFields(selectedIndex);
      setFields(indexFields);
    }

    loadFields();
  }, [selectedIndex]);

  return fields;
}