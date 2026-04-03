export interface CustomEvent {
  eventName: `customEvent${string}`;
  attributes: {
    action_type: string;
    category: string;
    label: string;
    metadata: Record<string, any>;
  };
}
