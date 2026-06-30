import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
  UseGuards,
  HttpCode,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { SpecRegistryService } from "../spec/spec-registry.service";
import { RegisterSpecDto, SpecSummary } from "../spec/spec.model";
import { TenantGuard } from "../guards/tenant.guard";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller("admin/specs")
export class AdminController {
  constructor(private readonly registry: SpecRegistryService) {}

  /** List all registered specs (id, label, url, fetchedAt). */
  @Get()
  @ApiOperation({ summary: "List all registered specs" })
  @ApiResponse({ status: 200, description: "Array of spec summaries" })
  list(): SpecSummary[] {
    return this.registry.getAll();
  }

  /** Register a new spec from a remote URL or an uploaded payload. */
  @Post()
  @ApiOperation({ summary: "Register a spec (URL pull or payload upload)" })
  @ApiResponse({ status: 201, description: "Spec registered" })
  async register(@Body() dto: RegisterSpecDto): Promise<SpecSummary> {
    const { id, label, url, content, ttlMs } = dto;

    if (!id || !label) {
      throw new BadRequestException("id and label are required");
    }
    if (!url && !content) {
      throw new BadRequestException("Provide either url or content");
    }
    if (url && content) {
      throw new BadRequestException("Provide url or content, not both");
    }

    if (url) {
      await this.registry.addFromUrl(id, label, url, ttlMs);
    } else {
      this.registry.addFromPayload(id, label, content!);
    }

    return this.registry.getById(id)!;
  }

  /** Force an immediate re-fetch for a URL-backed spec. */
  @Post(":id/refresh")
  @HttpCode(200)
  @ApiOperation({ summary: "Force refresh of a URL-backed spec" })
  @ApiResponse({ status: 200, description: "Spec refreshed" })
  async refresh(@Param("id") id: string): Promise<SpecSummary> {
    const entry = this.registry.getById(id);
    if (!entry) throw new NotFoundException(`Spec "${id}" not found`);
    if (!entry.url) throw new BadRequestException(`Spec "${id}" has no URL — use POST /admin/specs to replace it`);
    await this.registry.refresh(id);
    return this.registry.getById(id)!;
  }

  /** Remove a spec by id. */
  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a spec" })
  @ApiResponse({ status: 204, description: "Spec deleted" })
  remove(@Param("id") id: string): void {
    if (!this.registry.delete(id)) {
      throw new NotFoundException(`Spec "${id}" not found`);
    }
  }
}
