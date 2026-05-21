import type { Element } from "../../jsx.ts";

declare function MyComponent(props: { name: string; description: string }): Element;
interface AllAttrTypesProps {
  stringAttr: string;
  numberAttr: number;
  booleanAttr: boolean;
  nullAttr: null;
  arrayAttr: number[];
  objectAttr: { foo: string };
  elementAttr: Element;
}
declare function AllAttrTypes(props: AllAttrTypesProps): Element;
declare function Div(props: { children?: Element }): Element;

<MyComponent
  name="Test"
  description="My first component"
/>;

<AllAttrTypes
  stringAttr="str"
  numberAttr={42}
  booleanAttr
  nullAttr={null}
  arrayAttr={[1, 2, 3]}
  objectAttr={{ foo: "bar" }}
  elementAttr={<Div />}
/>;
