// lib/opensearch.ts
import { Client } from '@opensearch-project/opensearch';
import { Annotation } from '@/app/types/types';

// Configure your OpenSearch client
const client = new Client({
  // create url from process.env.OPENSEARCH_HOST, process.env.OPENSEARCH_PROTOCOL, process.env.OPENSEARCH_PORT
  node: `${process.env.OPENSEARCH_PROTOCOL}://${process.env.OPENSEARCH_HOST}:${process.env.OPENSEARCH_PORT}`,
  ssl: {
    rejectUnauthorized: false // Set to true in production with proper certificates
  },


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
export async function searchAnnotations(startDate: string, endDate: string, filterField: string, filterValue: string) {
  const annotationIndex = process.env.ANNOTATION_INDEX || 'default_annotation_index';  
 
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
      size: 10000,
      query: filterQuery
    };

    const response = await client.search({
      index: annotationIndex,
      body: searchBody,
    });

    // for each hit, return the _source object and add _id as _id field
    const annotations = response.body.hits.hits.map((hit: any) => ({ ...hit._source, _id: hit._id }));

    //sort by startDate
    annotations.sort((a: any, b: any) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return dateA.getTime() - dateB.getTime();
    });

    return annotations;

  } catch (error) {
    console.error('Error fetching annotations:', error);
    throw error;
  }
}

// Delete annotation from OpenSearch
export async function deleteAnnotation(annotationId: string) {
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

// Update annotation from OpenSearch
export async function updateAnnotation(annotationId: string, actionType: string, payload?: any) {
  const annotationIndex = process.env.ANNOTATION_INDEX || 'default_annotation_index';
  
  try {

    const doc = payload;
    // Determine the document update based on action type
    // const doc = actionType === 'delete' 
    //   ? { deleted: true } 
    //   : payload;
      
    // Validate action type
    if (actionType !== 'delete' && actionType !== 'update') {
      throw new Error(`Invalid action type: ${actionType}. Must be 'delete' or 'update'`);
    }
    
    // If update action but no payload provided
    if (!payload) {
      throw new Error('Payload is required for update action');
    }
    
    // Execute the update operation
    const response = await client.update({
      index: annotationIndex,
      id: annotationId,
      body: { doc },
    });
    
    // Refresh index asynchronously
    refreshIndex(annotationIndex);
    
    return response.body;
  } catch (error) {
    console.error(`Error ${actionType === 'delete' ? 'deleting' : 'updating'} annotation:`, error);
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
    // const response = await client.search({
    //   index: indexName,
    //   body: {
    //     _source: filterField,
    //     query: {
    //       match_phrase_prefix: {
    //         [`${filterField}`]: {
    //           query: searchTerms,
    //           slop: 10,
    //           max_expansions: 50,
    //         }
    //       }
    //     },
    //   }
    // });

    const response = await client.search({
      index: indexName,
      body: {
        size: 0,
        query: {
          wildcard: {
            [`${filterField}`]: {
              value: `*${searchTerms}*`,
              case_insensitive: true
            }

        },
        },
        aggs: {
          unique_values: {
            terms: {
              field: filterField + '.keyword',
              size: 1000,
              order: {
                _key: 'asc'
              },
            },
          }
        }
      }
    });

    const values = response.body.aggregations?.unique_values;

    if (!values) {
      console.error('No values found in response');
      return [];
    }
    const options = (values as { buckets: { key: string }[] }).buckets.map((bucket) => bucket.key);

    return options;

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