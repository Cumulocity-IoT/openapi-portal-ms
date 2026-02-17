import { get } from 'lodash'; // Using lodash.get makes deep access safe & easy

export function projectData(event: any, fields: string[]): any {
  // If no fields requested, return everything
  if (!fields || fields.length === 0) return event;

  const result: any = {};
  
  fields.forEach(field => {
    const value = get(event, field.trim());
    if (value !== undefined) {
      // We flatten the result key to avoid deep nesting in the response
      // e.g. "attributes.size" -> { "attributes.size": 1024 }
      // This is perfect for Grafana columns.
      result[field.trim()] = value;
    }
  });

  return result;
}