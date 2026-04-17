import { get } from "lodash"; // Using lodash.get makes deep access safe & easy
import { compileExpression } from "filtrex";
import { BadRequestException } from "@nestjs/common/exceptions/bad-request.exception";

/**
 * Projects a subset of fields from an object, with support for deep/nested field access.
 * If no fields are provided, the original object is returned as-is.
 *
 * Nested fields are flattened in the result using dot notation as the key,
 * making the output suitable for tabular consumers such as Grafana.
 *
 * @param event - The source object to project fields from.
 * @param fields - Optional list of field paths to include. Supports dot-notation for deep access (e.g. `"attributes.size"`).
 * @returns The original object when no fields are specified, or a new object containing only the requested fields.
 *
 * @example
 * // Returns the full object
 * projectData({ a: 1, b: 2 });
 *
 * @example
 * // Returns { name: "Alice" }
 * projectData({ name: "Alice", age: 30 }, ["name"]);
 *
 * @example
 * // Returns { "attributes.size": 1024 }
 * projectData({ attributes: { size: 1024 } }, ["attributes.size"]);
 */
export function projectData<T extends object>(event: T, fields?: []): T;
export function projectData<T extends object, K extends keyof T & string>(
  event: T,
  fields: K[],
): Pick<T, K>;
export function projectData<T extends object>(
  event: T,
  fields: string[],
): Partial<T>;
export function projectData(event: any, fields?: string[]): any {
  // If no fields requested, return everything
  if (!fields || fields.length === 0) return event;

  const result: any = {};

  fields.forEach((field) => {
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

/**
 * Filters an array of objects based on a filtrex expression string.
 * Returns the original array unchanged if no expression is provided or the array is empty.
 *
 * @param items - The array of items to filter.
 * @param ruleExpression - An optional filtrex filter expression (e.g. `"status == 'active' and age > 20"`).
 * @returns The filtered array, or the original array if no expression is given.
 * @throws {BadRequestException} If the expression cannot be compiled due to invalid syntax.
 *
 * @example
 * // Returns [{ name: "Alice", age: 25 }]
 * filterArray([{ name: "Alice", age: 25 }, { name: "Bob", age: 17 }], "age >= 18");
 */
export function filterArray<T>(items: T[], ruleExpression?: string): T[] {
  if (!ruleExpression || items.length === 0) {
    return items;
  }

  try {
    const filterFn = compileExpression(ruleExpression);
    return items.filter((item) => Boolean(filterFn(item)));
  } catch (error) {
    throw new BadRequestException(`Invalid filter syntax: ${error}`);
  }
}
