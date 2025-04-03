// lib/opensearch.ts
import { Client } from '@opensearch-project/opensearch';
import { Annotation } from '@/app/components/types';

// Configure your OpenSearch client
const client = new Client({
  node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.OPENSEARCH_USERNAME || '',
    password: process.env.OPENSEARCH_PASSWORD || '',
  },
});

// Get all available indices
export async function getIndices() {
  try {
    const response = await client.cat.indices({ format: 'json' });
    return response.body.map((index: any) => index.index)
      .filter((index: string) => !index.startsWith('.'));
  } catch (error) {
    console.error('Error fetching indices:', error);
    return [];
  }
}

// Get mappings for an index to determine field types
export async function getIndexMapping(index: string) {
  try {
    const response = await client.indices.getMapping({ index });
    const mappings = response.body[index].mappings.properties || {};
    
    const fields: { dateFields: string[], termFields: string[], numericFields: string[] } = {
      dateFields: [],
      termFields: [],
      numericFields: [],
    };
    
    Object.entries(mappings).forEach(([fieldName, fieldConfig]: [string, any]) => {
      if (['date'].includes(fieldConfig.type)) {
        fields.dateFields.push(fieldName);
      } else if (['keyword', 'text'].includes(fieldConfig.type)) {
        fields.termFields.push(fieldName);
      } else if (['long', 'integer', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float'].includes(fieldConfig.type)) {
        fields.numericFields.push(fieldName);
      }
    });
    
    return fields;
  } catch (error) {
    console.error(`Error fetching mapping for index ${index}:`, error);
    return { dateFields: [], termFields: [], numericFields: [] };
  }
}

// Get stats for an index to determine date range
export async function getIndexStats(index: string, timestamp: string, filterField: string, filterValue: string) {
  try {
    const response = await client.search({
      index,
      body: {
        size: 0,
        query: {
          bool: {
            filter: [
              {
                match_phrase: {
                  [`${filterField}`] : filterValue
                }
              }
            ],
          },
        },
        aggs: {
          max_date: {
            max: {
              field: timestamp,
            },
          },
          min_date: {
            min: {
              field: timestamp,
            },
          },
        },
      },
    });

    const aggregations = response.body.aggregations;

    if (!aggregations) {
      throw new Error('Aggregations not found in response');
    }
    const { max_date: { value_as_string: maxDate }, min_date: { value_as_string: minDate } } = aggregations as { max_date: { value_as_string: string }, min_date: { value_as_string: string } };
    
    return { maxDate, minDate };
  } catch (error) {
    console.error(`Error fetching stats for index ${index}:`, error);
    return { maxDate: '', minDate: '' };
  }
}

// Update the performAggregation function to accept date range parameters
export async function performAggregation(index: string, params: {
  term: string;
  interval: string;
  numericField: string;
  timestamp: string;
  startDate: string;
  endDate: string;
  filterField: string;
  filterValue: string;
}) {
  console.log('OS: performAggregation:', params.startDate, params.endDate);
  try {
    const { timestamp, startDate, endDate, filterField, filterValue } = params;

    const filterQuery = {
      bool: {
        filter: [
          {
            range: {
              [timestamp]: {
                format: 'strict_date_optional_time',
                gte: startDate,
                lte: endDate,
              },
            },
          },
          {
            match_phrase: {
              [`${filterField}`] : filterValue
            }
          }
        ],
      },
    };

    const aggs = makeTermListAggs(params);
    
    const searchBody: any = {
      size: 0,
      query: filterQuery,
      aggs,
    };

    // log searchBody as JSON
    // console.log('Search Body:', JSON.stringify(searchBody, null, 2));
       
    const response = await client.search({
      index,
      body: searchBody,
    });

    
    return response.body.aggregations;
  } catch (error) {

  
    console.error('OS: Error performing aggregation:', JSON.stringify(error, null, 2));
    

    throw error;
  }
}

// Save annotation to OpenSearch
export async function indexAnnotationRecord(annotation: Annotation) {
  const annotationIndex = process.env.ANNOTATION_INDEX || 'default_annotation_index';

  console.log('OS: indexAnnotationRecord:', annotation);
  
  try {
    const response = await client.index({
      index: annotationIndex,
      body: annotation,
    });
    refreshIndex(annotationIndex);
    return response.body;
  } catch (error) {
    console.error('Error saving annotation:', error);
    throw error;
  }
}

// Load annotations from OpenSearch
export async function searchAnnotationRecords(startDate: string, endDate: string, filterField: string, filterValue: string) {
  const annotationIndex = process.env.ANNOTATION_INDEX || 'default_annotation_index';  

  console.log('OS: searchAnnotationRecords:', startDate, endDate);
 
  try {

    const filterQuery = {
      bool: {
        filter: [
          {
            range: {
              startDate: {
                gte: startDate,
                lte: endDate,
              }
            }
          },
          {
            match_phrase: {
              filterField : filterField
            }
          },
          {
            match_phrase: {
              filterValue : filterValue
            }
          },
          {
            match: {
              deleted: false
            }
          }
        ]
      }
    };
    
    const searchBody: any = {
      size: 1000,
      query: filterQuery
    };

    const response = await client.search({
      index: annotationIndex,
      body: searchBody,
    });

    // for each hit, return the _source object and add _id as _id field
    return response.body.hits.hits.map((hit: any) => ({ ...hit._source, _id: hit._id })); 

  } catch (error) {
    console.error('Error fetching annotations:', error);
    throw error;
  }
}

// Delete annotation from OpenSearch
export async function deleteAnnotationRecord(annotationId: string) {
  const annotationIndex = process.env.ANNOTATION_INDEX || 'default_annotation_index'; 

  // update document and set deleted flag to true
  try {
    const response = await client.update({
      index: annotationIndex,
      id: annotationId,
      body: {
        doc: {
          deleted: true,
        },
      },
    });

    // call a function without blocking the return
    refreshIndex(annotationIndex);
    
    return response.body;
  } catch (error) {
    console.error('Error deleting annotation:', error);
    throw error;
  }
}

// Load filter values from OpenSearch
export async function searchFilterValues(
  indexName: string,
  filterField: string,
  startDate: string,
  endDate: string,
  searchTerms: string
) {

  try {
    const response = await client.search({
      index: indexName,
      body: {
        _source: filterField,
        query: {
          match_phrase_prefix: {
            [`${filterField}`]: {
              query: searchTerms,
              slop: 10,
              max_expansions: 50,
            }
          }
        },
      }
    });

    const values = response.body.hits.hits;

    // get unique values
    const options = values.map((value: any) => value._source[filterField]);
    const uniqueOptions = Array.from(new Set(options));

    //return Array.from(new Set(options));
    return uniqueOptions;

  } catch (error) {
    console.error('Error fetching filter values:', error);
    return [];
  }
}

// Your aggregation function
type MakeTermListAggs = {
  term: string;
  interval: string;
  numericField: string;
  timestamp: string;
};

export function makeTermListAggs({ term, interval, numericField, timestamp }: MakeTermListAggs) {
  return {
    date_aggregation: {
      date_histogram: {
        field: timestamp,
        fixed_interval: interval,
      },
      aggs: {
        value_aggregation: {
          terms: {
            field: term + '.keyword',
            size: 100,
          },
          aggs: {
            avg_value: {
              avg: {
                field: numericField,
              },
            },
          },
        },
      },
    },
  };
}

export function refreshIndex(index: string) {
  return client.indices.refresh({ index });
}