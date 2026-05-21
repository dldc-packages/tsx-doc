import type { Doc } from "@dldc/tsx-doc";
import {
  type Expression,
  type JsxAttributeLike,
  type JsxChild,
  type JsxElement,
  type JsxExpression,
  type JsxFragment,
  type JsxSelfClosingElement,
  type ObjectLiteralExpression,
  Project,
  type StringLiteral,
  SyntaxKind,
  type ts,
} from "ts-morph";
import { createDocElement } from "./element.ts";

export function parse(content: string): Doc {
  const project = new Project();
  const sourceFile = project.createSourceFile("file.tsx", content);

  const skipKinds = new Set([
    SyntaxKind.ImportDeclaration,
    SyntaxKind.InterfaceDeclaration,
  ]);

  const elements: unknown[] = [];

  sourceFile.getStatements().forEach((node) => {
    if (skipKinds.has(node.getKind())) {
      return;
    }
    if (node.isKind(SyntaxKind.FunctionDeclaration)) {
      const isDeclare = node.getModifiers().some((m) => m.getKind() === SyntaxKind.DeclareKeyword);
      if (isDeclare) {
        return;
      }
      throw new Error(`Unexpected function declaration: ${node.getName()}`);
    }
    if (node.isKind(SyntaxKind.ExpressionStatement)) {
      const expression = node.getExpression();
      if (expression.isKind(SyntaxKind.JsxFragment)) {
        elements.push(parseJsxFragment(expression));
        return;
      }
      elements.push(parseExpression(expression));
      return;
    }
    throw new Error(`Node kind: ${node.getKindName()}`);
  });

  return {
    children: elements,
  };
}

function parseExpression(expr: Expression<ts.Expression>): unknown {
  if (expr.isKind(SyntaxKind.JsxSelfClosingElement)) {
    return parseJsxElement(expr);
  }
  if (expr.isKind(SyntaxKind.JsxElement)) {
    return parseJsxElement(expr);
  }
  if (expr.isKind(SyntaxKind.JsxFragment)) {
    return parseJsxFragment(expr);
  }
  if (expr.isKind(SyntaxKind.NumericLiteral)) {
    return Number(expr.getText());
  }
  if (expr.isKind(SyntaxKind.StringLiteral)) {
    return expr.getLiteralValue();
  }
  if (expr.isKind(SyntaxKind.TrueKeyword)) {
    return true;
  }
  if (expr.isKind(SyntaxKind.FalseKeyword)) {
    return false;
  }
  if (expr.isKind(SyntaxKind.NullKeyword)) {
    return null;
  }
  if (expr.isKind(SyntaxKind.ArrayLiteralExpression)) {
    return expr.getElements().map((element) => parseExpression(element));
  }
  if (expr.isKind(SyntaxKind.ObjectLiteralExpression)) {
    return parseObjectLiteral(expr);
  }
  if (expr.isKind(SyntaxKind.ParenthesizedExpression)) {
    return parseExpression(expr.getExpression());
  }

  throw new Error(`Unsupported expression kind: ${expr.getKindName()}`);
}

function parseJsxElement(element: JsxElement | JsxSelfClosingElement): unknown {
  const openingElement = element.isKind(SyntaxKind.JsxElement) ? element.getOpeningElement() : element;
  const tagNameNode = openingElement.getTagNameNode();
  if (!tagNameNode.isKind(SyntaxKind.Identifier)) {
    throw new Error(`Unsupported tag name kind: ${tagNameNode.getKindName()}`);
  }
  const tagName = tagNameNode.getText();
  const attributes = openingElement.getAttributes();
  const children = element.isKind(SyntaxKind.JsxElement) ? parseJsxChildren(element.getJsxChildren()) : undefined;
  return createDocElement(tagName, parseAttributes(attributes), children);
}

function parseJsxFragment(fragment: JsxFragment): unknown {
  return createDocElement("Fragment", undefined, parseJsxChildren(fragment.getJsxChildren()));
}

function parseJsxChildren(
  children: JsxChild[],
): unknown[] {
  const result: unknown[] = [];
  for (const child of children) {
    if (child.isKind(SyntaxKind.JsxText)) {
      const text = parseJsxText(child.getText());
      if (text !== undefined) {
        result.push(text);
      }
      continue;
    }
    if (child.isKind(SyntaxKind.JsxExpression)) {
      const expr = child.getExpression();
      if (!expr) {
        continue;
      }
      result.push(parseExpression(expr));
      continue;
    }
    if (child.isKind(SyntaxKind.JsxFragment)) {
      result.push(parseJsxFragment(child));
      continue;
    }
    if (child.isKind(SyntaxKind.JsxElement) || child.isKind(SyntaxKind.JsxSelfClosingElement)) {
      result.push(parseJsxElement(child));
      continue;
    }
    throw new Error("Unsupported JSX child kind");
  }
  return result;
}

function parseJsxText(text: string): string | undefined {
  if (text.trim() === "") {
    return undefined;
  }
  if (!text.includes("\n") && !text.includes("\r")) {
    return text;
  }
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseObjectLiteral(expr: ObjectLiteralExpression): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  expr.getProperties().forEach((prop) => {
    if (prop.isKind(SyntaxKind.PropertyAssignment)) {
      const nameNode = prop.getNameNode();
      if (!nameNode.isKind(SyntaxKind.Identifier) && !nameNode.isKind(SyntaxKind.StringLiteral)) {
        throw new Error(`Unsupported object literal property name kind: ${nameNode.getKindName()}`);
      }
      const name = nameNode.getText();
      const initializer = prop.getInitializer();
      if (!initializer) {
        throw new Error("Object literal property must have an initializer");
      }
      result[name] = parseExpression(initializer);
      return;
    }
    throw new Error(`Unsupported object literal property kind: ${prop.getKindName()}`);
  });
  return result;
}

function parseAttributes(attributes: JsxAttributeLike[]): Record<string, unknown> | undefined {
  if (attributes.length === 0) {
    return undefined;
  }
  const result: Record<string, unknown> = {};
  for (const attr of attributes) {
    if (attr.isKind(SyntaxKind.JsxAttribute)) {
      const nameNode = attr.getNameNode();
      if (!nameNode.isKind(SyntaxKind.Identifier)) {
        throw new Error(`Unsupported attribute name kind: ${nameNode.getKindName()}`);
      }
      const name = nameNode.getText();
      const initializer = attr.getInitializer();
      result[name] = parseJsxValue(initializer);
      continue;
    }
    if (attr.isKind(SyntaxKind.JsxSpreadAttribute)) {
      throw new Error("Spread attributes are not supported yet");
    }
    throw new Error(`Unsupported attribute kind: ${(attr as any).getKindName()}`);
  }
  return result;
}

function parseJsxValue(
  initializer: JsxSelfClosingElement | JsxElement | JsxExpression | JsxFragment | StringLiteral | undefined,
): unknown {
  if (!initializer) {
    return true; // boolean attribute
  }
  if (initializer.isKind(SyntaxKind.StringLiteral)) {
    return initializer.getLiteralValue();
  }
  if (initializer.isKind(SyntaxKind.JsxExpression)) {
    const expr = initializer.getExpression();
    if (!expr) {
      throw new Error("Empty JSX expression is not supported");
    }
    return parseExpression(expr);
  }
  throw new Error(`Unsupported attribute value kind: ${initializer.getKindName()}`);
}
