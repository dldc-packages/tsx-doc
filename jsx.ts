declare global {
  function jsxFactory(): JSX.Element;
  function jsxFragmentFactory(): JSX.Element;

  namespace JSX {
    interface Element {
      isElement: true;
    }
    interface ElementChildrenAttribute {
      children?: Node;
    }
    type Node = Element | string | number | boolean | null | undefined | Node[];
  }
}
