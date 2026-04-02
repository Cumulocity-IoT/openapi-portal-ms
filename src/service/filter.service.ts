import { BadRequestException, Injectable } from "@nestjs/common";
import { compileExpression } from "filtrex";

@Injectable()
export class FilterService {
  /**
   * Filters an array of objects based on a string rule.
   * @param items The array of data to filter
   * @param ruleExpression The string rule (e.g. "status == 'active' and age > 20")
   */
  filterArray<T>(items: T[], ruleExpression?: string): T[] {
    if (!ruleExpression || items.length === 0) {
      return items;
    }

    try {
      const filterFn = compileExpression(ruleExpression);
      return items.filter((item) => Boolean(filterFn(item)));
    } catch (error) {
      throw new BadRequestException(`Invalid filter syntax: ${error.message}`);
    }
  }
}
