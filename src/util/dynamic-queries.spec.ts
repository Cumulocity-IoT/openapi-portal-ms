import { BadRequestException } from "@nestjs/common";
import { filterArray, projectData } from "./dynamic-queries";

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
