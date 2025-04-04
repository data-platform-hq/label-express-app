// app/actions.ts
'use server'

import { 
  getIndexMapping, 
  getIndexStats, 
  performAggregation,
  indexAnnotationRecord,
  searchAnnotationRecords,
  deleteAnnotationRecord,
  searchFilterValues 
} from '@/lib/opensearch';
import { Annotation } from '@/app/components/types';

export async function fetchIndexFields(index: string) {
  if (!index) return { dateFields: [], termFields: [], numericFields: [] };
  
  try {
    return await getIndexMapping(index);
  } catch (error) {
    console.error('Error fetching index fields:', error);
    return { dateFields: [], termFields: [], numericFields: [] };
  }
}

export async function fetchAggregationData(
  index: string, 
  term: string, 
  interval: string, 
  numericField: string, 
  timestamp: string,
  startDate: string,
  endDate: string,
  filterField: string,
  filterValue: string
) {
  if (!index || !term || !interval || !numericField || !timestamp || !startDate || !endDate || !filterField || !filterValue) {
    return { error: 'Missing required parameters' };
  }
  
  try {

    const results = await performAggregation(index, {
      term,
      interval,
      numericField,
      timestamp,
      startDate,
      endDate,
      filterField,
      filterValue
    });
    
    // Process the results on the server side to prepare them for display
    const processedData = processAggregationResults(results);
    
    return {
      processed: processedData
    };
  } catch (error) {
    console.error('Error performing aggregation:', error);
    return { error: 'Failed to perform aggregation' };
  }
}

export async function fetchIndexStats(index: string, timestamp: string, filterField: string, filterValue: string) {
  try {
    return await getIndexStats(index, timestamp, filterField, filterValue);
  } catch (error) {
    console.error('Error fetching index stats:', error);
    return { maxDate: '', minDate: '' };
  }
}

export async function saveAnnotationRecord(annotation: Annotation) {

  try {
    return await indexAnnotationRecord(annotation);
  }
  catch (error) {
    console.error('Error saving annotation:', error);
    return { error: 'Failed to save annotation' };
  }
}

export async function fetchAnnotationRecords(startDate: string, endDate: string, filterField: string, filterValue: string) {
  try {

    return await searchAnnotationRecords(startDate, endDate, filterField, filterValue);

  }
  catch (error) {
    console.error('Error fetching annotations:', error);
    return [];
  }
}

export async function removeAnnotationRecord(annotationId: string) {

  try 
  {
    return await deleteAnnotationRecord(annotationId);
  }
  catch (error)
  {
    console.error('Error deleting annotation:', error);
    return { error: 'Failed to delete annotation' };
  } 
}

export async function fetchFilterValues(
  indexName: string,
  filterField: string,
  startDate: string,
  endDate: string,
  searchTerms: string
) {

  if (searchTerms.length < 3) {
    return [];
  }

  try {
    return await searchFilterValues(indexName, filterField, startDate, endDate, searchTerms);
  } catch (error) {
    console.error('Error fetching filter values:', error);
    return [];
  }
  
}

// Process the aggregation results on the server side
function processAggregationResults(results: any) {
  if (!results || !results.date_aggregation || !results.date_aggregation.buckets) {
    return [];
  }
  
  // Transform the data into a format that's easy to use in charts or tables
  return results.date_aggregation.buckets.map((dateBucket: any) => {
    const timestamp = dateBucket.key;
    
    const formattedDate = new Date(timestamp).toISOString();
    
    const termBuckets = dateBucket.value_aggregation.buckets.map((termBucket: any) => ({
      term: termBucket.key,
      count: termBucket.doc_count,
      avgValue: termBucket.avg_value.value || 0
    }));
    
    return {
      timestamp,
      formattedDate,
      terms: termBuckets
    };
  });
}