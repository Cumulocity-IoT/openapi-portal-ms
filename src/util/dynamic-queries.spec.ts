import { BadRequestException } from "@nestjs/common";
import {
  filterArray,
  parseFieldList,
  parseOrderBy,
  projectData,
  sortArray,
} from "./dynamic-queries";

describe("projectData", () => {
  const event = {
    name: "Alice",
    age: 30,
    attributes: { size: 1024, color: "blue" },
  };

  it("returns the original object when no fields are provided", () => {
    expect(projectData(event)).toBe(event);
  });

  it("returns the original object when an empty fields array is provided", () => {
    expect(projectData(event, [])).toBe(event);
  });

  it("returns only the requested top-level fields", () => {
    expect(projectData(event, ["name"])).toEqual({ name: "Alice" });
  });

  it("returns multiple requested top-level fields", () => {
    expect(projectData(event, ["name", "age"])).toEqual({
      name: "Alice",
      age: 30,
    });
  });

  it("returns nested fields using dot-notation as a flat key", () => {
    // Cast needed because dot-notation paths are not in keyof T
    expect(projectData(event as any, ["attributes.size"])).toEqual({
      "attributes.size": 1024,
    });
  });

  it("omits fields that do not exist on the object", () => {
    expect(projectData(event, ["name", "nonexistent" as any])).toEqual({
      name: "Alice",
    });
  });

  it("trims whitespace from field names", () => {
    expect(projectData(event, [" name " as any])).toEqual({ name: "Alice" });
  });
});

describe("filterArray", () => {
  const items = [
    { name: "Alice", age: 25, status: "active" },
    { name: "Bob", age: 17, status: "inactive" },
    { name: "Carol", age: 32, status: "active" },
  ];

  it("returns the original array when no expression is provided", () => {
    expect(filterArray(items)).toBe(items);
  });

  it("returns the original array when an empty expression is provided", () => {
    expect(filterArray(items, "")).toBe(items);
  });

  it("returns the original array when items is empty", () => {
    expect(filterArray([], "age > 18")).toEqual([]);
  });

  it("filters by a numeric comparison", () => {
    expect(filterArray(items, "age >= 18")).toEqual([
      { name: "Alice", age: 25, status: "active" },
      { name: "Carol", age: 32, status: "active" },
    ]);
  });

  it("filters by a string equality check", () => {
    expect(filterArray(items, 'status == "active"')).toEqual([
      { name: "Alice", age: 25, status: "active" },
      { name: "Carol", age: 32, status: "active" },
    ]);
  });

  it("filters with a compound expression", () => {
    expect(filterArray(items, 'status == "active" and age > 26')).toEqual([
      { name: "Carol", age: 32, status: "active" },
    ]);
  });

  it("returns an empty array when no items match", () => {
    expect(filterArray(items, "age > 100")).toEqual([]);
  });

  it("throws BadRequestException for invalid filter syntax", () => {
    expect(() => filterArray(items, "!!!invalid???")).toThrow(
      BadRequestException,
    );
  });
});

describe("sortArray", () => {
  const items = [
    { name: "Charlie", age: 30 },
    { name: "Alice", age: 25 },
    { name: "Bob", age: 17 },
  ];

  it("returns the original array when items is empty", () => {
    expect(sortArray([], "name" as any)).toEqual([]);
  });

  it("sorts strings ascending by default", () => {
    expect(sortArray(items, "name").map((i) => i.name)).toEqual([
      "Alice",
      "Bob",
      "Charlie",
    ]);
  });

  it("sorts strings descending", () => {
    expect(sortArray(items, "name", "desc").map((i) => i.name)).toEqual([
      "Charlie",
      "Bob",
      "Alice",
    ]);
  });

  it("sorts numbers ascending", () => {
    expect(sortArray(items, "age").map((i) => i.age)).toEqual([17, 25, 30]);
  });

  it("sorts numbers descending", () => {
    expect(sortArray(items, "age", "desc").map((i) => i.age)).toEqual([
      30, 25, 17,
    ]);
  });

  it("does not mutate the original array", () => {
    const original = [...items];
    sortArray(items, "name");
    expect(items).toEqual(original);
  });

  it("places undefined values at the end regardless of direction", () => {
    const withUndefined = [
      { name: "Bob" as string | undefined },
      { name: undefined },
      { name: "Alice" as string | undefined },
    ];
    expect(sortArray(withUndefined, "name", "asc").map((i) => i.name)).toEqual([
      "Alice",
      "Bob",
      undefined,
    ]);
    expect(sortArray(withUndefined, "name", "desc").map((i) => i.name)).toEqual(
      ["Bob", "Alice", undefined],
    );
  });
});

describe("parseOrderBy", () => {
  it("returns null for undefined", () => {
    expect(parseOrderBy(undefined)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseOrderBy("")).toBeNull();
  });

  it("returns null for a whitespace-only string", () => {
    expect(parseOrderBy("   ")).toBeNull();
  });

  it("returns null when the field part is empty (colon at start)", () => {
    expect(parseOrderBy(":desc")).toBeNull();
  });

  it("parses a bare field name and defaults to asc", () => {
    expect(parseOrderBy("date")).toEqual({ field: "date", direction: "asc" });
  });

  it("parses field:asc", () => {
    expect(parseOrderBy("date:asc")).toEqual({
      field: "date",
      direction: "asc",
    });
  });

  it("parses field:desc", () => {
    expect(parseOrderBy("date:desc")).toEqual({
      field: "date",
      direction: "desc",
    });
  });

  it("only splits on the first colon — extra segments are ignored", () => {
    expect(parseOrderBy("date:desc:extra:ignored")).toEqual({
      field: "date",
      direction: "desc",
    });
  });

  it("falls back to asc for an unrecognised direction", () => {
    expect(parseOrderBy("date:UPSTREAM")).toEqual({
      field: "date",
      direction: "asc",
    });
  });

  it("trims whitespace around field and direction", () => {
    expect(parseOrderBy(" date : desc ")).toEqual({
      field: "date",
      direction: "desc",
    });
  });
});

describe("parseFieldList", () => {
  it("returns an empty array for undefined", () => {
    expect(parseFieldList(undefined)).toEqual([]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseFieldList("")).toEqual([]);
  });

  it("returns an empty array for a whitespace-only string", () => {
    expect(parseFieldList("   ")).toEqual([]);
  });

  it("splits a two-field comma-separated string", () => {
    expect(parseFieldList("name,date")).toEqual(["name", "date"]);
  });

  it("trims whitespace around each field name", () => {
    expect(parseFieldList(" name , date ")).toEqual(["name", "date"]);
  });

  it("filters out empty segments from leading, trailing, or doubled commas", () => {
    expect(parseFieldList(",name,,date,")).toEqual(["name", "date"]);
  });

  it("returns a single-element array for a single field", () => {
    expect(parseFieldList("host")).toEqual(["host"]);
  });
});
