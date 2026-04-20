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

/**
 * Returns a new array sorted by a single field, ascending or descending.
 * Items where the field value is `undefined` are placed at the end regardless of direction.
 * Does not mutate the original array.
 *
 * @param items - The array to sort.
 * @param field - The field name to sort by.
 * @param direction - Sort order: `"asc"` (default) or `"desc"`.
 * @returns A new sorted array.
 *
 * @example
 * // Returns [{ name: "Alice" }, { name: "Bob" }]
 * sortArray([{ name: "Bob" }, { name: "Alice" }], "name", "asc");
 *
 * @example
 * // Returns [{ count: 10 }, { count: 3 }]
 * sortArray([{ count: 3 }, { count: 10 }], "count", "desc");
 */
export function sortArray<T>(
  items: T[],
  field: keyof T & string,
  direction: "asc" | "desc" = "asc",
): T[] {
  if (!field || items.length === 0) return items;
  const dir = direction === "desc" ? -1 : 1;
  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === undefined) return 1;
    if (bv === undefined) return -1;
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

/**
 * Parses an `orderBy` string of the form `field` or `field:direction` into a
 * structured config object. Only the text before the **first** colon is used as
 * the field name, so inputs like `"date:desc:extra"` are handled safely.
 *
 * @param orderBy - Raw query-parameter string, e.g. `"date:desc"` or `"name"`.
 * @returns `{ field, direction }` or `null` when the input is absent or blank.
 *
 * @example parseOrderBy("date:desc")          // { field: "date", direction: "desc" }
 * @example parseOrderBy("name")              // { field: "name", direction: "asc" }
 * @example parseOrderBy("date:desc:extra")   // { field: "date", direction: "desc" }
 * @example parseOrderBy(":desc")             // null — no field name
 * @example parseOrderBy(undefined)           // null
 */
export type OrderByConfig = { field: string; direction: "asc" | "desc" };

export function parseOrderBy(orderBy?: string): OrderByConfig | null {
  if (!orderBy?.trim()) return null;
  const colonIdx = orderBy.indexOf(":");
  if (colonIdx === -1) {
    const field = orderBy.trim();
    return field ? { field, direction: "asc" } : null;
  }
  const field = orderBy.slice(0, colonIdx).trim();
  if (!field) return null;
  const dir = orderBy.slice(colonIdx + 1).split(":")[0].trim().toLowerCase();
  return { field, direction: dir === "desc" ? "desc" : "asc" };
}

/**
 * Parses a comma-separated field-list string into a trimmed string array.
 * Empty segments (e.g. from leading/trailing commas) are filtered out.
 *
 * @param fields - Comma-separated field names, e.g. `"host,path,pageTitle"`.
 * @returns Trimmed, non-empty field names; empty array when input is absent or blank.
 *
 * @example parseFieldList("host,path")     // ["host", "path"]
 * @example parseFieldList(" name , date ") // ["name", "date"]
 * @example parseFieldList(undefined)       // []
 */
export function parseFieldList(fields?: string): string[] {
  if (!fields?.trim()) return [];
  return fields
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
}
