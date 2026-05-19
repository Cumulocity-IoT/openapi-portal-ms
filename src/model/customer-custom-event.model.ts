import { CachedEvent } from "./cache-model";
import { ControllerEvent } from "./controller-model";

/**
 * The structured `attributes` payload carried by a {@link CustomerCustomEvent}.
 *
 * Once ingested by the cache pipeline, this object becomes the `data` field
 * of a `CachedEvent` (`CustomEvent.attributes` → `CachedEvent.data`).
 */
export type CustomerCustomEventAttributes = {
  action_type: string;
  category: string;
  label: string;
  metadata: Record<string, any>;
};

/**
 * Comma-separated list of dot-notation field paths to project from a
 * {@link CustomerCustomEvent}'s `data` payload.
 *
 * Top-level valid values: `action_type`, `category`, `label`, `metadata`.
 * Nested paths inside `metadata` are also supported using dot-notation
 * (e.g. `metadata.size`, `metadata.widgetId`).
 *
 * Example: `"action_type,category"` or `"label,metadata.size"`
 */
export type CustomerCustomEventDataFieldList = keyof CustomerCustomEventAttributes | `metadata.${string}` | string; // allows comma-separated combinations at runtime

/**
 * A specialization of {@link CachedEvent} representing events explicitly
 * created by a customer via the SDK.
 *
 * Differences from the base {@link CachedEvent}:
 * - `name` is constrained to the `customEvent${string}` naming convention
 * - `data` is narrowed from `Record<string, any>` to the well-known
 *   {@link CustomerCustomEventAttributes} structure (`action_type`, `category`,
 *   `label`, `metadata`)
 *
 * The `data` field corresponds to `CustomEvent.attributes` as stored by the
 * cache pipeline (`CustomEvent.attributes` → `CachedEvent.data`).
 * The `v2/customEvents` endpoint surfaces only events matching this type.
 */
export type CustomerCustomCachedEvent = Omit<CachedEvent, "name" | "data"> & {
  name: `customEvent${string}`;
  data: CustomerCustomEventAttributes;
};

/**
 * Type predicate that narrows a {@link CachedEvent} to {@link CustomerCustomCachedEvent}.
 *
 * Checks that:
 * - `name` starts with `"customEvent"`
 * - `data` contains the expected {@link CustomerCustomEventAttributes} keys
 *   (`action_type`, `category`, `label`, `metadata`)
 */
export function isCustomerCustomCachedEvent(event: CachedEvent): event is CustomerCustomCachedEvent {
  return typeof event.name === "string" && event.name.startsWith("customEvent") && typeof event.data === "object" && event.data !== null && "action_type" in event.data && "category" in event.data && "label" in event.data && "metadata" in event.data;
}

/**
 * The shape returned by the `/v2/customEvents` endpoint.
 * `name` is always present and constrained to the `customEvent${string}` pattern.
 * `data`, when present, is narrowed to {@link CustomerCustomEventAttributes}
 * rather than the generic `Record<string, any>` of {@link ControllerEvent}.
 * All other fields are present only when included in the `fields` projection.
 */
export type CustomerCustomEventResponse = {
  name: `customEvent${string}`;
} & Partial<
  Omit<ControllerEvent, "name" | "data"> & {
    data: Partial<CustomerCustomEventAttributes>;
  }
>;
