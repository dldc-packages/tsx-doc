import type { IS_DOC_ELEMENT } from "./internal.ts";

export interface DocElement {
  [IS_DOC_ELEMENT]: true;
  name: string;
  attributes?: Record<string, unknown>;
  children?: unknown[];
}

export interface Doc {
  children: unknown[];
}
