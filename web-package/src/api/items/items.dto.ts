import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ItemDto {
  @ApiProperty({ description: "Unique identifier of the item", example: "item-001" })
  id!: string;

  @ApiProperty({ description: "Display name of the item", example: "Widget Pro" })
  name!: string;

  @ApiProperty({ description: "Item category", example: "electronics", enum: ["electronics", "clothing", "food", "tools"] })
  category!: string;

  @ApiProperty({ description: "Price in USD", example: 29.99 })
  price!: number;

  @ApiPropertyOptional({ description: "Optional longer description of the item", example: "A high-quality widget for professional use." })
  description?: string;

  @ApiProperty({ description: "ISO 8601 timestamp when the item was created", example: "2024-01-15T10:30:00.000Z" })
  createdAt!: string;
}

export class CreateItemDto {
  @ApiProperty({ description: "Display name of the item", example: "Widget Pro" })
  name!: string;

  @ApiProperty({ description: "Item category", example: "electronics", enum: ["electronics", "clothing", "food", "tools"] })
  category!: string;

  @ApiProperty({ description: "Price in USD", example: 29.99 })
  price!: number;

  @ApiPropertyOptional({ description: "Optional longer description of the item", example: "A high-quality widget for professional use." })
  description?: string;
}

export class UpdateItemDto {
  @ApiPropertyOptional({ description: "Updated display name", example: "Widget Pro Max" })
  name?: string;

  @ApiPropertyOptional({ description: "Updated category", example: "tools", enum: ["electronics", "clothing", "food", "tools"] })
  category?: string;

  @ApiPropertyOptional({ description: "Updated price in USD", example: 39.99 })
  price?: number;

  @ApiPropertyOptional({ description: "Updated description", example: "An upgraded high-quality widget." })
  description?: string;
}

export class ItemCountDto {
  @ApiProperty({ description: "Category name", example: "electronics" })
  category!: string;

  @ApiProperty({ description: "Number of items in this category", example: 12 })
  count!: number;
}
