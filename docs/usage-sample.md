# Creating custom events (Gainsight PX)

This document shows two ways to create/send custom events used by the Gainsight product‑experience pipeline:
- Programmatically via `GainsightService`
- Declaratively in templates using the `c8yProductExperience` directive

All examples use the project's CustomEvent type:

```typescript
// src/model/custom-event.model.ts
export interface CustomEvent {
  eventName: `customEvent${string}`; // e.g. customEventSolenis
  attributes: {
    action_type: string;
    category: string;
    label: string;
    metadata: Record<string, any>;
  };
}
```

---

## 1) Programmatic — using GainsightService

Inject `GainsightService` and call its event method (example uses `triggerEvent(eventName, data)`).

```typescript
import { Component } from '@angular/core';
import { GainsightService } from '@c8y/ngx-components';
import { CustomEvent } from '...';

@Component({ ... })
export class ExampleComponent {
  constructor(private gainsightService: GainsightService) {}

  sendPurchaseEvent(): void {
    const evt: CustomEvent = {
      eventName: 'customEventSolenis',
      attributes: {
        action_type: 'click',
        category: 'purchase',
        label: 'buy-now',
        metadata: { productId: 123, price: 9.99 }
      }
    };

    // GainsightService forwards the event to the PX platform
    this.gainsightService.triggerEvent(evt.eventName, evt.attributes);
  }
}
```

Notes:
- `eventName` must start with "customEvent" (enforced by the type).
- Put arbitrary contextual fields inside `attributes.metadata`.

---

## 2) Declarative — using the c8yProductExperience directive (HTML)

Set `actionName` to the event name and `actionData` to the attributes object.

```html
<button
  c8yProductExperience
  [actionName]="'customEventSolenis'"
  [actionData]="{
    action_type: 'click',
    category: 'purchase',
    label: 'buy-now',
    metadata: { productId: 123 }
  }"
>
  Buy
</button>
```

The directive emits the same event shape and the framework forwards it to the Gainsight service.

> Note — standalone components (WebSDK 1023+)
>
> For Angular standalone components you can either:
>
> - Import `ProductExperienceDirective` directly into your component's `imports` array:
>
> ```ts
> import { Component } from '@angular/core';
> import { ProductExperienceDirective } from '@c8y/ngx-components';
>
> @Component({
>   standalone: true,
>   imports: [ProductExperienceDirective],
>   template: `...`
> })
> export class BuyButtonComponent {}
> ```
>
> - Or for 1021+ import the `ProductExperienceModule` in an NgModule (non-standalone / legacy setups):
>
> ```ts
> import { NgModule } from '@angular/core';
> import { ProductExperienceModule } from '@c8y/ngx-components';
>
> @NgModule({
>   imports: [ProductExperienceModule]
> })
> export class AppModule {}
> ```

## Quick rules & tips
- Use the `CustomEvent` interface for compile‑time safety.
- `eventName` must begin with `customEvent` and end with your company name.
- values inside `attributes` should be in camelCase 
- `attributes.metadata` is for arbitrary contextual data (IDs, prices, feature flags, etc.).
- Prefer the directive for simple UI-driven events; use `GainsightService` for events from business logic or non‑click triggers.
