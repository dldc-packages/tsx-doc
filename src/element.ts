import { IS_DOC_ELEMENT } from "./internal.ts";
import type { DocElement } from "./types.ts";

export function createDocElement(
  name: string,
  attributes?: Record<string, unknown>,
  children?: unknown[],
): DocElement {
  return {
    [IS_DOC_ELEMENT]: true,
    name,
    attributes,
    children,
  };
}

export function isDocElement(node: unknown): node is DocElement {
  return typeof node === "object" && node !== null && (node as any)[IS_DOC_ELEMENT] === true;
}
