import { Body, Controller, Delete, Get, HttpCode, Logger, NotFoundException, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBasicAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateItemDto, ItemCountDto, ItemDto, UpdateItemDto } from "./items.dto";

const MOCK_ITEMS: ItemDto[] = [
  { id: "item-001", name: "Widget Pro", category: "electronics", price: 29.99, description: "A high-quality widget.", createdAt: "2024-01-10T08:00:00.000Z" },
  { id: "item-002", name: "Gadget Lite", category: "electronics", price: 14.99, createdAt: "2024-02-05T12:00:00.000Z" },
  { id: "item-003", name: "Comfort Shirt", category: "clothing", price: 24.99, description: "Breathable cotton shirt.", createdAt: "2024-03-01T09:00:00.000Z" },
  { id: "item-004", name: "Power Drill", category: "tools", price: 89.99, description: "Cordless drill with 20V battery.", createdAt: "2024-03-15T14:00:00.000Z" },
  { id: "item-005", name: "Organic Oats", category: "food", price: 5.49, createdAt: "2024-04-01T07:00:00.000Z" },
];

@ApiBasicAuth()
@ApiTags("items")
@Controller("items")
export class ItemsController {
  private readonly logger = new Logger(ItemsController.name);
  private readonly items: ItemDto[] = [...MOCK_ITEMS];

  /**
   * Returns a list of items, optionally filtered by category or a search term.
   *
   * @param category - Optional category to filter by.
   * @param search - Optional search term matched against item name.
   * @returns Array of matching items.
   */
  @ApiOperation({
    summary: "List items",
    description: "Returns all items. Use `category` to filter by category and `search` to perform a name-based text search.",
  })
  @ApiQuery({ name: "category", required: false, description: "Filter by category: electronics, clothing, food, or tools.", enum: ["electronics", "clothing", "food", "tools"] })
  @ApiQuery({ name: "search", required: false, description: "Case-insensitive substring search on item name." })
  @ApiResponse({ status: 200, description: "Array of items matching the given filters.", type: [ItemDto] })
  @Get()
  getItems(@Query("category") category?: string, @Query("search") search?: string): ItemDto[] {
    this.logger.log(`getItems category=${category} search=${search}`);
    let result = this.items;
    if (category) {
      result = result.filter((item) => item.category === category);
    }
    if (search) {
      const term = search.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(term));
    }
    return result;
  }

  /**
   * Returns a single item by its unique identifier.
   *
   * @param id - The item ID.
   * @returns The matching item, or 404 if not found.
   */
  @ApiOperation({
    summary: "Get item by ID",
    description: "Returns a single item by its unique identifier. Responds with 404 when the item does not exist.",
  })
  @ApiParam({ name: "id", description: "Unique identifier of the item.", example: "item-001" })
  @ApiResponse({ status: 200, description: "The requested item.", type: ItemDto })
  @ApiResponse({ status: 404, description: "Item not found." })
  @Get(":id")
  getItemById(@Param("id") id: string): ItemDto {
    this.logger.log(`getItemById id=${id}`);
    const item = this.items.find((i) => i.id === id);
    if (!item) {
      throw new NotFoundException(`Item with id '${id}' not found.`);
    }
    return item;
  }

  /**
   * Creates a new item and returns it with a generated ID and timestamp.
   *
   * @param body - The item data to create.
   * @returns The newly created item.
   */
  @ApiOperation({
    summary: "Create item",
    description: "Creates a new item. A unique ID and `createdAt` timestamp are assigned automatically.",
  })
  @ApiBody({ type: CreateItemDto })
  @ApiResponse({ status: 201, description: "Item created successfully.", type: ItemDto })
  @Post()
  createItem(@Body() body: CreateItemDto): ItemDto {
    this.logger.log(`createItem name=${body.name}`);
    const newItem: ItemDto = {
      id: `item-${String(this.items.length + 1).padStart(3, "0")}`,
      createdAt: new Date().toISOString(),
      ...body,
    };
    this.items.push(newItem);
    return newItem;
  }

  /**
   * Updates an existing item by ID. Only provided fields are changed.
   *
   * @param id - The item ID to update.
   * @param body - Partial item fields to update.
   * @returns The updated item.
   */
  @ApiOperation({
    summary: "Update item",
    description: "Partially updates an existing item. Only the fields present in the request body are applied (patch semantics).",
  })
  @ApiParam({ name: "id", description: "Unique identifier of the item to update.", example: "item-001" })
  @ApiBody({ type: UpdateItemDto })
  @ApiResponse({ status: 200, description: "Item updated successfully.", type: ItemDto })
  @ApiResponse({ status: 404, description: "Item not found." })
  @Put(":id")
  updateItem(@Param("id") id: string, @Body() body: UpdateItemDto): ItemDto {
    this.logger.log(`updateItem id=${id}`);
    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new NotFoundException(`Item with id '${id}' not found.`);
    }
    this.items[index] = { ...this.items[index], ...body };
    return this.items[index];
  }

  /**
   * Deletes an item by ID.
   *
   * @param id - The item ID to delete.
   */
  @ApiOperation({
    summary: "Delete item",
    description: "Permanently removes an item by its unique identifier. Returns 204 No Content on success.",
  })
  @ApiParam({ name: "id", description: "Unique identifier of the item to delete.", example: "item-001" })
  @ApiResponse({ status: 204, description: "Item deleted successfully." })
  @ApiResponse({ status: 404, description: "Item not found." })
  @HttpCode(204)
  @Delete(":id")
  deleteItem(@Param("id") id: string): void {
    this.logger.log(`deleteItem id=${id}`);
    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new NotFoundException(`Item with id '${id}' not found.`);
    }
    this.items.splice(index, 1);
  }

  /**
   * Returns a count of items grouped by category.
   *
   * @returns Array of category/count pairs sorted by count descending.
   */
  @ApiOperation({
    summary: "Count items by category",
    description: "Aggregates all items and returns a count per category, sorted by count descending.",
  })
  @ApiResponse({ status: 200, description: "Array of category/count pairs sorted by count descending.", type: [ItemCountDto] })
  @Get("counts/by-category")
  getCountsByCategory(): ItemCountDto[] {
    this.logger.log("getCountsByCategory");
    const counts: Record<string, number> = {};
    for (const item of this.items) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }
}
