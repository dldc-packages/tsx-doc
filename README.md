# @dldc/tsx-doc

> Using TypeScript and JSX as markup languages

## What is this?

`@dldc/tsx-doc` is a parser that turns TypeScript + JSX into a structured document tree. Unlike traditional JSX
frameworks, **the code is never executed**—instead, it's parsed into a data structure you can inspect, validate, and
serialize.

Use it to:

- Author documents, APIs, or configurations in familiar JSX syntax
- Get full IDE support: syntax highlighting, autocomplete, type checking
- Leverage LLMs that understand TypeScript/JSX
- Validate and transform the output into whatever you need

## Why use JSX as markup?

JSX is a well-known syntax with decades of tooling support:

- **IDE support**: VS Code, TypeScript, and other editors provide syntax highlighting, autocomplete, and
  go-to-definition for JSX out of the box
- **Type checking**: TypeScript catches mistakes before parsing (invalid attributes, wrong child types, etc.)
- **LLM friendly**: Models trained on code understand JSX conventions and patterns
- **Existing ecosystem**: Developers already know the syntax; no new language to learn

## Installation

```bash
deno add jsr:@dldc/tsx-doc
```

## Configuration

In your `deno.json` (or `tsconfig.json`), set the JSX compiler options to use `@dldc/tsx-doc` as the import source:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@dldc/tsx-doc"
  }
}
```

This tells TypeScript to use the JSX factory from `@dldc/tsx-doc` instead of React. The parser ships with `jsx.ts` that
satisfies this interface.

## Usage

Create a `.tsx` file with your document:

```tsx
// doc.tsx
import type { Element } from "@dldc/tsx-doc/jsx";

interface HeaderProps {
  title: string;
}

declare function Header(props: HeaderProps): Element;
declare function Section(props: { children?: Element }): Element;

<Header title="Getting Started" />;

<Section>
  Learn how to use this library.
</Section>;
```

Then parse it:

```typescript
import { parse } from "@dldc/tsx-doc";

const content = await Deno.readTextFile("./doc.tsx");
const doc = parse(content);

console.log(doc.children);
// Output: [
//   {
//     [Symbol(isDocElement)]: true,
//     name: "Header",
//     attributes: { title: "Getting Started" },
//     children: []
//   },
//   { ... }
// ]
```

## Validating and using the result

The parser returns an unknown tree structure. Use `isDocElement()` to validate nodes and enforce your schema:

```typescript
import { isDocElement, parse } from "@dldc/tsx-doc";

const doc = parse(content);

for (const node of doc.children) {
  if (isDocElement(node)) {
    console.log(`Element: ${node.name}`);
    if (node.name === "Header" && typeof node.attributes?.title === "string") {
      // Process header
    }
  } else if (typeof node === "string") {
    console.log(`Text: ${node}`);
  } else if (Array.isArray(node)) {
    console.log(`Array: ${node}`);
  }
}
```

### Defining a strict schema

It's recommended to validate the parsed output against a schema using a library like Zod or io-ts:

```typescript
import { z } from "zod";
import { isDocElement, parse } from "@dldc/tsx-doc";

const ElementSchema = z.object({
  name: z.string(),
  attributes: z.record(z.unknown()).optional(),
  children: z.array(z.unknown()).optional(),
});

const doc = parse(content);

for (const node of doc.children) {
  if (isDocElement(node)) {
    const result = ElementSchema.safeParse(node);
    if (!result.success) {
      throw new Error(`Invalid element: ${result.error}`);
    }
  }
}
```

## Important notes

- **No code execution**: The parser never evaluates functions, variables, or expressions. It only reads and transforms
  the syntax tree.
- **Declarations are metadata**: `declare function` and `interface` statements are parsed as type hints for your
  document but don't appear in the output.
- **Imports are skipped**: `import` and `export` statements are ignored by the parser.
