import { resolve } from "node:path";
import { defineConfig } from "vite-plus";

const root = import.meta.dirname;

export default defineConfig({
  // Tests exercise the package through its own public entrypoints. The only
  // self-reference in the code is the type-only `import type { Doc } from
  // "@dldc/tsx-doc"` in src/parse.ts; the alias points it at the real entry so
  // it resolves to source.
  resolve: {
    alias: {
      "@dldc/tsx-doc": resolve(root, "mod.ts"),
    },
  },

  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.types.ts"],
    },
  },

  fmt: {
    // Prose docs and CI files are kept untouched by the formatter to avoid
    // unrelated churn.
    ignorePatterns: [
      "**/__snapshots__/**",
      "**/*.md",
      ".github/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
    ],
  },

  lint: {
    ignorePatterns: [
      // tests/data/demo.doc.tsx is a document fixture consumed as text; it was
      // never part of the Deno-checked program (`deno check **/*.ts` does not
      // match .tsx) and its JSX only type-checks against a runtime this stub
      // package does not ship.
      "tests/data/**",
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      // `any` was the only excluded rule in the previous Deno lint config.
      "no-explicit-any": "off",
    },
  },

  // Library build (tsdown). The entry map mirrors the export map in
  // package.json so every public subpath has its own emitted module and types.
  pack: {
    entry: {
      mod: "mod.ts",
      // `./jsx` and `./jsx-runtime` both alias `jsx.ts`; tsdown dedups two
      // entries with the same source and drops one .d.mts, so build a single
      // `jsx` module and point both exports at it (mirroring the source map).
      jsx: "jsx.ts",
    },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
  },
});
