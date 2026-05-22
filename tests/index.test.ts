import { expect } from "@std/expect";
import { createDocElement, parse } from "../mod.ts";
import { file } from "./utils.ts";

Deno.test("parse paired JSX element", () => {
  expect(parse(
    file(
      '<Tag title="hello">',
      "  Hello",
      "  <Child />",
      "</Tag>",
    ),
  )).toEqual({
    children: [
      createDocElement("Tag", { title: "hello" }, [
        "Hello",
        createDocElement("Child"),
      ]),
    ],
  });
});

Deno.test("parse top-level primitive literals", () => {
  expect(parse(
    file(
      '"text";',
      "`templated`;",
      "42;",
      "true;",
      "false;",
      "null;",
    ),
  )).toEqual({
    children: ["text", "templated", 42, true, false, null],
  });
});

Deno.test("parse template literals in JSX expressions and attributes", () => {
  expect(parse(
    file(
      "<Root label={`hello`}>",
      "  {`world`}",
      "</Root>",
    ),
  )).toEqual({
    children: [
      createDocElement("Root", { label: "hello" }, ["world"]),
    ],
  });
});

Deno.test("parse array and object literals", () => {
  expect(parse(
    file(
      "[1, 2, 3];",
      '({ foo: "bar" });',
    ),
  )).toEqual({
    children: [
      [1, 2, 3],
      { foo: "bar" },
    ],
  });
});

Deno.test("parse supported attribute value types", () => {
  expect(parse(
    file(
      "<Values",
      '  stringAttr="str"',
      "  numberAttr={42}",
      "  booleanAttr",
      "  nullAttr={null}",
      "  arrayAttr={[1, 2, 3]}",
      '  objectAttr={{ foo: "bar" }}',
      "  elementAttr={<Child />}",
      "/>;",
    ),
  )).toEqual({
    children: [
      createDocElement("Values", {
        stringAttr: "str",
        numberAttr: 42,
        booleanAttr: true,
        nullAttr: null,
        arrayAttr: [1, 2, 3],
        objectAttr: { foo: "bar" },
        elementAttr: createDocElement("Child"),
      }),
    ],
  });
});

Deno.test("parse top-level fragment", () => {
  expect(parse(
    file(
      "<>",
      "  alpha",
      "  <Child />",
      "</>;",
    ),
  )).toEqual({
    children: [
      createDocElement("Fragment", undefined, [
        "alpha",
        createDocElement("Child"),
      ]),
    ],
  });
});

Deno.test("parse nested fragment", () => {
  expect(parse(
    file(
      "<Root>",
      "  <>",
      "    hello",
      "    <Child />",
      "  </>",
    ),
  )).toEqual({
    children: [
      createDocElement("Root", undefined, [
        createDocElement("Fragment", undefined, [
          "hello",
          createDocElement("Child"),
        ]),
      ]),
    ],
  });
});

Deno.test("parse fragment inside JSX expression child", () => {
  expect(parse(
    file(
      "<Root>",
      "  {<>",
      "    world",
      "    <Child />",
      "  </>}",
      "</Root>",
    ),
  )).toEqual({
    children: [
      createDocElement("Root", undefined, [
        createDocElement("Fragment", undefined, [
          "world",
          createDocElement("Child"),
        ]),
      ]),
    ],
  });
});

Deno.test("ignore imports, interfaces, and declare functions", () => {
  expect(parse(
    file(
      'import type { Element } from "../jsx.ts";',
      "",
      "interface Props {",
      "  title: string;",
      "}",
      "",
      "declare function Header(props: Props): Element;",
      "",
      '<Header title="Welcome" />;',
    ),
  )).toEqual({
    children: [
      createDocElement("Header", { title: "Welcome" }),
    ],
  });
});

Deno.test("throw on non-declare function declaration", () => {
  expect(() =>
    parse(
      file(
        "function helper() {",
        "  return null;",
        "}",
        "",
        "<Page />;",
      ),
    )
  ).toThrow("Unexpected function declaration: helper");
});

Deno.test("normalize multiline JSX text", () => {
  expect(parse(
    file(
      "<Paragraph>",
      "  Hello",
      "  from",
      "  tsx-doc",
      "</Paragraph>",
    ),
  )).toEqual({
    children: [
      createDocElement("Paragraph", undefined, ["Hello from tsx-doc"]),
    ],
  });
});

Deno.test("ignore whitespace-only JSX text nodes", () => {
  expect(parse(
    file(
      "<Page>",
      "  <Header />",
      "",
      "  <Content />",
      "</Page>",
    ),
  )).toEqual({
    children: [
      createDocElement("Page", undefined, [
        createDocElement("Header"),
        createDocElement("Content"),
      ]),
    ],
  });
});

Deno.test("parse expression children with primitive values", () => {
  expect(parse(
    file(
      "<Stats>",
      "  {42}",
      "  {true}",
      "  {null}",
      '  {"done"}',
      "</Stats>",
    ),
  )).toEqual({
    children: [
      createDocElement("Stats", undefined, [42, true, null, "done"]),
    ],
  });
});

Deno.test("parse expression children with arrays and objects", () => {
  expect(parse(
    file(
      "<Data>",
      "  {[1, 2, 3]}",
      '  {{ mode: "fast", retry: false }}',
      "</Data>",
    ),
  )).toEqual({
    children: [
      createDocElement("Data", undefined, [
        [1, 2, 3],
        { mode: "fast", retry: false },
      ]),
    ],
  });
});

Deno.test("throw on spread attributes", () => {
  expect(() => parse(file("<Panel {...props} />;"))).toThrow("Spread attributes are not supported yet");
});

Deno.test("throw on unsupported identifier expression", () => {
  expect(() => parse(file("<Page>{title}</Page>"))).toThrow("Unsupported expression kind: Identifier");
});

Deno.test("throw on namespaced or dotted tag names", () => {
  expect(() => parse(file("<UI.Card />;"))).toThrow("Unsupported tag name kind: PropertyAccessExpression");
});

Deno.test("throw on namespaced or dotted tag names", () => {
  expect(() => parse(file("Just some text"))).toThrow("Unsupported expression kind: Identifier");
});

Deno.test("parse demo document", async () => {
  const doc = await Deno.readTextFile("./tests/data/demo.doc.tsx");

  expect(parse(doc)).toEqual({
    children: [
      createDocElement("MyComponent", {
        name: "Test",
        description: "My first component",
      }),
      createDocElement("AllAttrTypes", {
        stringAttr: "str",
        numberAttr: 42,
        booleanAttr: true,
        nullAttr: null,
        arrayAttr: [1, 2, 3],
        objectAttr: { foo: "bar" },
        elementAttr: createDocElement("Div"),
      }),
    ],
  });
});
