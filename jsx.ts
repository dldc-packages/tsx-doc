export function jsx(): Element {
  throw new Error("Not implemented yet");
}

export function jsxFragment(): Element {
  throw new Error("Not implemented yet");
}

export interface Element {
  isElement: true;
}

export interface ElementChildrenAttribute {
  children?: Node;
}

export type Node =
  | Element
  | string
  | number
  | boolean
  | null
  | undefined
  | Node[];
