# v2-ds-example

depth-1 sandbox for the `designSystem` config key.

demonstrates how a consumer app references a design system package with a single config field — `designSystem: '@v2-ds-example/lib'` — instead of wiring `presets`, `importMap`, `outdir`, and `include`-with-buildinfo manually. also shows token override semantics: the consumer's `brand` color wins over the lib's.

## what's in here

three workspace packages:

- `packages/styled-system` — `@v2-ds-example/styled-system`, the shared runtime (generated code lives here)
- `packages/lib` — `@v2-ds-example/lib`, the design system. has a preset and one component
- `packages/app` — `@v2-ds-example/app`, the consumer. uses `designSystem` and overrides one token

a fourth package, `packages/charts`, simulates a non-panda npm dep that the consumer auto-globs via smart include.

chain composition (libs stacked) is covered in `sandbox/v2-ds-fixture/`.

## setup

from the repo root:

```bash
pnpm install --ignore-scripts
```

## run order

**step 1 — generate the shared runtime**

```bash
cd sandbox/v2-ds-example/packages/styled-system
pnpm panda codegen
```

**step 2 — build the lib's dist artifacts**

```bash
cd sandbox/v2-ds-example/packages/lib
pnpm panda lib
```

`panda lib` produces `dist/panda.lib.json` (manifest), `dist/panda.buildinfo.json`, `dist/preset.mjs` (compiled preset), and patches `package.json` exports.

**step 3 — generate the consumer's css**

```bash
cd sandbox/v2-ds-example/packages/app
pnpm panda
```

the consumer reads `designSystem: '@v2-ds-example/lib'`, resolves the manifest, pulls the preset, hydrates the encoder from buildinfo, and merges the consumer's own theme on top. the consumer's `brand: #ec4899` overrides the lib's `brand: #3b82f6`.

## what to look for

```bash
grep -E '\-\-colors\-(brand|surface):' \
  sandbox/v2-ds-example/packages/app/@v2-ds-example/styled-system/styles.css
```

expected:

```
--colors-brand: #ec4899;    ← consumer override wins
--colors-surface: #f8fafc;  ← from the lib preset
```

also check the recipe extracts:

```bash
grep 'example-button' \
  sandbox/v2-ds-example/packages/app/@v2-ds-example/styled-system/styles.css | head -3
```

`.example-button` classes confirm the recipe traveled from lib preset → consumer css.

## v1 config vs v2

**v1 — four manual fields:**

```ts
export default defineConfig({
  presets: ['@pandacss/dev/presets', examplePreset],
  importMap: '@v2-ds-example/styled-system',
  include: [
    './src/**/*.{ts,tsx}',
    './node_modules/@v2-ds-example/lib/dist/panda.buildinfo.json',
  ],
  outdir: '@v2-ds-example/styled-system',
})
```

**v2 — one field:**

```ts
export default defineConfig({
  designSystem: '@v2-ds-example/lib',
  include: ['./src/**/*.{ts,tsx}'],
  outdir: '@v2-ds-example/styled-system',
})
```

panda resolves the manifest, wires the preset, and hydrates the buildinfo automatically.

## smart include

`include` accepts bare package specifiers:

```ts
include: [
  './src/**/*.{ts,tsx}',
  '@v2-ds-example/lib',     // skipped — has panda.lib.json (designSystem handles it)
  '@v2-ds-example/charts',  // auto-globbed — no panda.lib.json, falls back to package.json#files
]
```
