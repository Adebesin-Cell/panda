# Token Visibility Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the token visibility filter (private/public token marking via `internal:` block on `designSystem`-reached presets) from the older `v2-token-visibility` branch onto the current `feat/token-visibility` branch, which sits on top of the latest design-system resolution flow.

**Architecture:** Two-layer split. `getResolvedConfig` (in `@pandacss/config`) tags presets reached via `config.designSystem` (and their transitive `presets:` chain) as **external** on a `WeakSet<object>` attached to the merged config. A `createVisibilityFilter` factory (in `@pandacss/core`) consumes that side-channel set to produce a `(field, path) => boolean` predicate, which the generator applies at type-emission time to strip filtered entries from the public type surface. CSS output is unchanged — only the type union narrows.

**Tech Stack:** TypeScript, Vitest, `@pandacss/types` / `@pandacss/shared` / `@pandacss/config` / `@pandacss/core` / `@pandacss/generator`.

**Reference commits on `v2-token-visibility`:** `0e6dc6e8` (foundation), `d9de9e60` (token filter), `6d27054d` (extend to recipes/patterns/conditions/semanticTokens). These do not apply cleanly onto current HEAD because `get-resolved-config.ts` was refactored after they were written; this plan re-implements the same intent against the new flow.

---

## File Structure

**New files:**
- `packages/shared/src/match-token-path.ts` — dot-path matcher with `*` single-segment wildcard
- `packages/shared/__tests__/match-token-path.test.ts`
- `packages/core/src/visibility.ts` — `createVisibilityFilter` factory + `VisibilityFilter` type
- `packages/core/__tests__/visibility.test.ts`

**Modified files:**
- `packages/types/src/config.ts` — add `InternalVisibility` interface and `internal?` field on `Preset` / `Config`
- `packages/shared/src/index.ts` — re-export `matchTokenPath`
- `packages/config/src/get-resolved-config.ts` — thread `externalPresets` WeakSet through the stack walk; attach to merged config as `_externalPresets`
- `packages/config/__tests__/get-resolved-config.test.ts` — cover external tagging across `designSystem` + `presets:[]` mixing
- `packages/core/src/index.ts` — export visibility module
- `packages/generator/src/artifacts/types/token-types.ts` — apply filter to per-category union, drop empty categories
- `packages/generator/src/artifacts/setup-artifacts.ts` — skip filtered recipe/pattern barrel re-exports
- `packages/generator/src/artifacts/js/conditions.ts` — strip filtered keys from `Conditions` interface (preserve `base`)

**No-op fields:** `keyframes` has no per-name TS union today (`CssKeyframes` is `[name: string]`), so the filter is wired but a no-op. Documented in code.

---

## Phase 1 — Foundation

### Task 1: Add `InternalVisibility` types

**Files:**
- Modify: `packages/types/src/config.ts`

- [ ] **Step 1: Locate the `Preset` interface and find `presets?:` field**

Run: `grep -n "presets?:" packages/types/src/config.ts`
Expected: a line near `designSystem?: string` showing `presets?: (string | Preset | Promise<Preset>)[]`

- [ ] **Step 2: Add `internal?` field on the same interface, immediately below `designSystem?`**

```ts
  /** Resolves a panda design-system library by package name (reads its `panda.lib.json`). */
  designSystem?: string
  /**
   * Marks specific preset entries as internal — usable by the lib's own code but stripped
   * from the public type surface seen by consumers.
   *
   * Filter applies only to presets reached via `designSystem` (external). Presets reached
   * via `presets:[]` (user-imported directly) are unaffected.
   *
   * Each value is a list of dot-paths with optional single-segment `*` wildcard.
   * @example
   * internal: {
   *   tokens: ['colors.gray.*'],
   *   recipes: ['internalBase.*'],
   * }
   */
  internal?: InternalVisibility
```

- [ ] **Step 3: Add the `InternalVisibility` interface immediately after the surrounding interface block**

```ts
export interface InternalVisibility {
  tokens?: string[]
  semanticTokens?: string[]
  recipes?: string[]
  patterns?: string[]
  conditions?: string[]
  keyframes?: string[]
}
```

- [ ] **Step 4: Verify the file still typechecks**

Run: `pnpm --filter @pandacss/types build` (or `pnpm -w typecheck` if faster)
Expected: PASS, no errors referencing `InternalVisibility`.

- [ ] **Step 5: Commit**

```bash
git add packages/types/src/config.ts
git commit -m "feat(types): add InternalVisibility interface and internal? field on Preset/Config"
```

---

### Task 2: Add `matchTokenPath` helper + tests

**Files:**
- Create: `packages/shared/src/match-token-path.ts`
- Create: `packages/shared/__tests__/match-token-path.test.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/shared/__tests__/match-token-path.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { matchTokenPath } from '../src/match-token-path'

describe('matchTokenPath', () => {
  test('exact match', () => {
    expect(matchTokenPath('colors.brand', ['colors.brand'])).toBe(true)
    expect(matchTokenPath('colors.brand', ['colors.accent'])).toBe(false)
  })

  test('single-segment wildcard', () => {
    expect(matchTokenPath('colors.gray.500', ['colors.gray.*'])).toBe(true)
    expect(matchTokenPath('colors.gray', ['colors.gray.*'])).toBe(false)
    expect(matchTokenPath('colors.gray.500.alpha', ['colors.gray.*'])).toBe(false)
  })

  test('wildcard does not cross dot boundary', () => {
    expect(matchTokenPath('colors.gray.500', ['colors.*'])).toBe(false)
    expect(matchTokenPath('colors.gray', ['colors.*'])).toBe(true)
  })

  test('OR across patterns', () => {
    expect(matchTokenPath('spacing.4', ['colors.*', 'spacing.*'])).toBe(true)
  })

  test('empty patterns array returns false', () => {
    expect(matchTokenPath('anything', [])).toBe(false)
  })

  test('escapes regex specials in literal path segments', () => {
    expect(matchTokenPath('colors.brand+special', ['colors.brand+special'])).toBe(true)
    expect(matchTokenPath('colors.brandXspecial', ['colors.brand+special'])).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/shared/__tests__/match-token-path.test.ts`
Expected: FAIL with `Cannot find module '../src/match-token-path'`.

- [ ] **Step 3: Implement the matcher**

Create `packages/shared/src/match-token-path.ts`:

```ts
/**
 * Matches a dot-path against an array of patterns. `*` in a pattern matches a
 * single segment (anything except `.`). Multiple patterns are OR-ed; matching
 * ANY pattern returns true.
 *
 * Used by the visibility filter to decide whether a token / recipe / etc.
 * path should be hidden from a consumer's type surface.
 *
 * `**` (multi-segment wildcard) is NOT supported. A literal `**` is treated
 * as two consecutive `*`s.
 */
export function matchTokenPath(path: string, patterns: string[]): boolean {
  if (patterns.length === 0) return false
  for (const pattern of patterns) {
    if (patternToRegex(pattern).test(path)) return true
  }
  return false
}

const cache = new Map<string, RegExp>()

function patternToRegex(pattern: string): RegExp {
  const cached = cache.get(pattern)
  if (cached) return cached
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^.]+')
  const regex = new RegExp(`^${escaped}$`)
  cache.set(pattern, regex)
  return regex
}
```

- [ ] **Step 4: Re-export from shared barrel**

Edit `packages/shared/src/index.ts` — add the line in alphabetical position among existing exports:

```ts
export * from './match-token-path'
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test packages/shared/__tests__/match-token-path.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/match-token-path.ts packages/shared/src/index.ts packages/shared/__tests__/match-token-path.test.ts
git commit -m "feat(shared): add matchTokenPath helper with single-segment wildcard"
```

---

### Task 3: Thread `externalPresets` through `getResolvedConfig`

**Files:**
- Modify: `packages/config/src/get-resolved-config.ts`
- Modify: `packages/config/__tests__/get-resolved-config.test.ts`

- [ ] **Step 1: Write the failing test** (append to existing test file)

Add to `packages/config/__tests__/get-resolved-config.test.ts`:

```ts
test('tags designSystem preset chain as external on _externalPresets WeakSet', async () => {
  // Build a 2-deep designSystem chain + a user-imported preset.
  const subPreset = { name: 'sub' } as any
  const dsPreset = { name: 'ds', presets: [subPreset] } as any
  const userPreset = { name: 'user' } as any

  // Mock readLibManifest + bundle so the designSystem path resolves to dsPreset.
  // (Use the same mocking pattern other tests in this file use; copy from
  // the nearest existing designSystem test.)

  const resolved = await getResolvedConfig(
    { designSystem: '@x/ds', presets: [userPreset] } as any,
    process.cwd(),
  )

  const externals = (resolved as any)._externalPresets as WeakSet<object>
  expect(externals).toBeInstanceOf(WeakSet)
  expect(externals.has(dsPreset)).toBe(true)
  expect(externals.has(subPreset)).toBe(true)
  expect(externals.has(userPreset)).toBe(false)
})
```

Note: copy the mock setup from the existing `designSystem` tests in the same file (search for `designSystem:` to find them). Do not invent fresh mocks.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/config/__tests__/get-resolved-config.test.ts`
Expected: FAIL — `externals` is `undefined`.

- [ ] **Step 3: Modify `getResolvedConfig` to track external presets**

Edit `packages/config/src/get-resolved-config.ts`:

a. After line 22 (function opening, before `const root`), allocate the WeakSet:

```ts
  // Tracks presets reached through `config.designSystem` (and their transitive
  // `presets:` chain). The visibility filter applies `internal:` blocks only on
  // these. Presets reached via `config.presets:[]` directly stay user-controlled.
  const externalPresets = new WeakSet<object>()
```

b. In the `if (root.designSystem)` block, immediately after `root.presets = [designSystemPreset, ...]` (around line 46), tag the designSystem preset:

```ts
    if (typeof designSystemPreset === 'object' && designSystemPreset !== null) {
      externalPresets.add(designSystemPreset as object)
    }
```

c. In the stack walk, between `const current = stack.pop()!` and `const subPresets = current.presets ?? []`, capture the parent's external-ness:

```ts
    const currentIsExternal =
      typeof current === 'object' && current !== null && externalPresets.has(current as object)
```

d. Inside the inner `for (const subPreset of subPresets)` loop, after the dedup check (`seenRefs.has(presetConfig)`), propagate the tag to sub-presets when the parent is external:

```ts
      if (currentIsExternal && typeof presetConfig === 'object' && presetConfig !== null) {
        externalPresets.add(presetConfig as object)
      }
```

e. At the end (after `merged.presets = ...` on line 111, before `return merged`), attach the WeakSet non-enumerably:

```ts
  Object.defineProperty(merged, '_externalPresets', {
    value: externalPresets,
    enumerable: false,
    writable: false,
    configurable: false,
  })
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/config/__tests__/get-resolved-config.test.ts`
Expected: PASS, including the new external-tagging test and all pre-existing tests.

- [ ] **Step 5: Run the broader config test suite**

Run: `pnpm test packages/config`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/config/src/get-resolved-config.ts packages/config/__tests__/get-resolved-config.test.ts
git commit -m "feat(config): tag designSystem preset chain as external on resolved config"
```

---

## Phase 2 — Token visibility filter

### Task 4: Build `createVisibilityFilter` + tests

**Files:**
- Create: `packages/core/src/visibility.ts`
- Create: `packages/core/__tests__/visibility.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/__tests__/visibility.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { createVisibilityFilter } from '../src/visibility'

describe('createVisibilityFilter', () => {
  test('returns a no-op when config has no _externalPresets', () => {
    const isHidden = createVisibilityFilter({ presets: [] } as any)
    expect(isHidden('tokens', 'colors.gray.500')).toBe(false)
  })

  test('returns a no-op when no external preset has an internal block', () => {
    const preset = { name: 'ds' } as any
    const externals = new WeakSet<object>([preset])
    const config = { presets: [preset] } as any
    Object.defineProperty(config, '_externalPresets', { value: externals })

    const isHidden = createVisibilityFilter(config)
    expect(isHidden('tokens', 'colors.gray.500')).toBe(false)
  })

  test('hides paths matched by an external preset internal block', () => {
    const preset = {
      name: 'ds',
      internal: { tokens: ['colors.gray.*'] },
    } as any
    const externals = new WeakSet<object>([preset])
    const config = { presets: [preset] } as any
    Object.defineProperty(config, '_externalPresets', { value: externals })

    const isHidden = createVisibilityFilter(config)
    expect(isHidden('tokens', 'colors.gray.500')).toBe(true)
    expect(isHidden('tokens', 'colors.brand')).toBe(false)
  })

  test('does not hide paths from non-external presets even when they declare internal', () => {
    const userPreset = {
      name: 'user',
      internal: { tokens: ['colors.gray.*'] },
    } as any
    const externals = new WeakSet<object>() // userPreset NOT in set
    const config = { presets: [userPreset] } as any
    Object.defineProperty(config, '_externalPresets', { value: externals })

    const isHidden = createVisibilityFilter(config)
    expect(isHidden('tokens', 'colors.gray.500')).toBe(false)
  })

  test('OR-merges internal blocks across multiple external presets', () => {
    const dsA = { internal: { tokens: ['colors.gray.*'] } } as any
    const dsB = { internal: { tokens: ['colors.red.*'] } } as any
    const externals = new WeakSet<object>([dsA, dsB])
    const config = { presets: [dsA, dsB] } as any
    Object.defineProperty(config, '_externalPresets', { value: externals })

    const isHidden = createVisibilityFilter(config)
    expect(isHidden('tokens', 'colors.gray.500')).toBe(true)
    expect(isHidden('tokens', 'colors.red.500')).toBe(true)
    expect(isHidden('tokens', 'colors.brand')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/core/__tests__/visibility.test.ts`
Expected: FAIL — `Cannot find module '../src/visibility'`.

- [ ] **Step 3: Implement the filter**

Create `packages/core/src/visibility.ts`:

```ts
import { matchTokenPath } from '@pandacss/shared'
import type { Config, InternalVisibility, Preset } from '@pandacss/types'

type VisibilityField = keyof InternalVisibility

/**
 * Resolved config carrying the side-channel set of presets reached through
 * `config.designSystem`. Set by `getResolvedConfig` in @pandacss/config.
 * Non-enumerable so it doesn't leak into snapshots or serialization.
 */
interface ResolvedConfigWithVisibility extends Config {
  _externalPresets?: WeakSet<object>
}

/**
 * Builds a predicate that, given a (field, path) pair, returns true when the
 * path should be hidden from the public type/runtime surface.
 *
 * The filter applies only to entries owned by **external** presets — those
 * reached via `config.designSystem` (and transitively their `presets:` chain).
 * Presets reached via `config.presets:[]` directly are user-controlled and
 * never filtered.
 */
export function createVisibilityFilter(config: Config) {
  const { _externalPresets: externalPresets } = config as ResolvedConfigWithVisibility
  const presets = (config.presets ?? []) as Preset[]

  if (!externalPresets) {
    return () => false
  }

  const matchingPresets: Preset[] = []
  for (const preset of presets) {
    if (!externalPresets.has(preset as object)) continue
    if (!(preset as Preset).internal) continue
    matchingPresets.push(preset)
  }

  if (matchingPresets.length === 0) {
    return () => false
  }

  return function isHidden(field: VisibilityField, path: string): boolean {
    for (const preset of matchingPresets) {
      const patterns = preset.internal?.[field]
      if (!patterns || patterns.length === 0) continue
      if (matchTokenPath(path, patterns)) return true
    }
    return false
  }
}

export type VisibilityFilter = ReturnType<typeof createVisibilityFilter>
```

- [ ] **Step 4: Export from core barrel**

Edit `packages/core/src/index.ts` — append (or insert in alphabetical position):

```ts
export * from './visibility'
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test packages/core/__tests__/visibility.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/visibility.ts packages/core/src/index.ts packages/core/__tests__/visibility.test.ts
git commit -m "feat(core): add createVisibilityFilter for external preset internal blocks"
```

---

### Task 5: Apply visibility filter to token type generation

**Files:**
- Modify: `packages/generator/src/artifacts/types/token-types.ts`

- [ ] **Step 1: Read the current `token-types.ts` to find the categoryMap walk**

Run: `grep -n "categoryMap\|isHidden\|baseName" packages/generator/src/artifacts/types/token-types.ts`
Note the lines where per-category token paths are emitted (look for where `colors`, `spacing` etc. become `ColorToken`, `SpacingToken` type unions).

- [ ] **Step 2: Reference the original implementation**

Run: `git show d9de9e60 -- packages/generator/src/artifacts/types/token-types.ts`
Read the diff. Port the same insertion points onto the current file. Key shape:

```ts
import { createVisibilityFilter } from '@pandacss/core'
// ...
const isHidden = createVisibilityFilter(ctx.config)
// In the per-category walk, skip tokens where:
//   isHidden('tokens', token.name) === true  (or token.path / baseName depending on the field exposed)
// If a category becomes empty, drop the category entry from the emitted Tokens shape.
```

Use the exact field that maps to the `path` in v1 reference commits (the original uses `token.name` for tokens; `token.extensions?.isSemantic` routes to `semanticTokens` field — but semantic-token handling lands in Phase 3, so for now only `tokens` field is wired).

- [ ] **Step 3: Write a snapshot or focused test**

If `packages/generator/__tests__/` has token-types snapshot tests, add a focused case: a fixture config with a designSystem preset declaring `internal: { tokens: ['colors.gray.*'] }`, assert the emitted `ColorToken` union does not contain `gray.*` entries. If no such test infra exists, add a small unit test that calls the relevant emitter helper directly.

Run: `pnpm test packages/generator` and observe the failure on the new test before implementing.

- [ ] **Step 4: Implement the filter application**

Make the edit identified in Step 2. Keep the change small and localized to the token union emission. Do not touch CSS variable emission (referenced internal tokens must still emit `--colors-gray-500`).

- [ ] **Step 5: Run tests**

Run: `pnpm test packages/generator`
Expected: PASS. If existing snapshot tests change, inspect — they should only change for configs that have `internal:` blocks. If snapshots change for unrelated fixtures, the filter is leaking; investigate before updating snapshots.

- [ ] **Step 6: Commit**

```bash
git add packages/generator/src/artifacts/types/token-types.ts packages/generator/__tests__/<test-files>
git commit -m "feat(generator): filter internal tokens from per-category type union"
```

---

## Phase 3 — Extend to other fields

### Task 6: Wire semanticTokens / recipes / patterns / conditions

**Files:**
- Modify: `packages/core/src/visibility.ts` (no change — filter is already field-agnostic)
- Modify: `packages/generator/src/artifacts/types/token-types.ts` (route semanticTokens to `semanticTokens` field)
- Modify: `packages/generator/src/artifacts/setup-artifacts.ts` (skip filtered recipe/pattern barrel re-exports)
- Modify: `packages/generator/src/artifacts/js/conditions.ts` (strip filtered keys from `Conditions` interface; preserve `base`)

- [ ] **Step 1: Reference the original implementation**

Run: `git show 6d27054d`
Read the diff for each of the 4 files. The shape:

- **semanticTokens (token-types.ts):** the token walk already iterates both regular and semantic tokens; use `token.extensions?.isSemantic` (or whatever the current Token type exposes — verify by reading the file) to choose the `semanticTokens` vs `tokens` field when calling `isHidden`.
- **recipes (setup-artifacts.ts):** find the recipes-index barrel emit; wrap each `export *` / `export {}` line with `if (!isHidden('recipes', recipeName))`. Per-recipe files still emit (CSS rules continue to work).
- **patterns (setup-artifacts.ts):** same shape for both patterns-index AND jsx-patterns-index barrels.
- **conditions (conditions.ts):** find the `Conditions` interface emit; skip filtered keys. `base` is intrinsic — never filter.

- [ ] **Step 2: Write tests for each field**

Extend `packages/core/__tests__/visibility.test.ts` to cover each `VisibilityField` value (`semanticTokens`, `recipes`, `patterns`, `conditions`, `keyframes`). The filter itself is already field-agnostic, but a coverage test pins the contract:

```ts
test('filters across all InternalVisibility fields', () => {
  const ds = {
    internal: {
      tokens: ['colors.gray.*'],
      semanticTokens: ['bg.surface.*'],
      recipes: ['internalCard'],
      patterns: ['internalStack'],
      conditions: ['_legacyHover'],
      keyframes: ['internalFade'],
    },
  } as any
  const externals = new WeakSet<object>([ds])
  const config = { presets: [ds] } as any
  Object.defineProperty(config, '_externalPresets', { value: externals })
  const isHidden = createVisibilityFilter(config)
  expect(isHidden('tokens', 'colors.gray.500')).toBe(true)
  expect(isHidden('semanticTokens', 'bg.surface.muted')).toBe(true)
  expect(isHidden('recipes', 'internalCard')).toBe(true)
  expect(isHidden('patterns', 'internalStack')).toBe(true)
  expect(isHidden('conditions', '_legacyHover')).toBe(true)
  expect(isHidden('keyframes', 'internalFade')).toBe(true)
})
```

For each generator integration, add or extend a focused test that asserts the relevant emitted artifact excludes the filtered name.

- [ ] **Step 3: Run the new tests, observe failures**

Run: `pnpm test packages/core packages/generator`
Expected: the core test passes (filter is already field-agnostic); the generator tests fail until the integrations land.

- [ ] **Step 4: Implement each integration**

Port the relevant diffs from `6d27054d` onto current file structure. One integration at a time. Run the corresponding test after each.

- [ ] **Step 5: Verify keyframes is a documented no-op**

In `visibility.ts` (or a code comment in `setup-artifacts.ts`), note that keyframes filtering has no TS-side effect today because `CssKeyframes` is open (`[name: string]`). CSS still emits referenced keyframes regardless. This is intentional — wired for forward-compat.

- [ ] **Step 6: Run the full generator suite + a sandbox sanity check**

```bash
pnpm test packages/core packages/generator
cd sandbox/v2-ds-fixture && find . -name dist -o -name styled-system -not -path "*/node_modules/*" | xargs rm -rf
# Build the lib chain manually with an `internal:` block declared on lib (the base preset), then codegen the app
# and inspect packages/app/@v2-ds-fixture/styled-system/types/tokens.gen.d.ts for the filtered entries.
```

Expected: filtered token paths absent from the consumer's `tokens.gen.d.ts`. CSS file at `@v2-ds-fixture/styled-system/styles.css` still contains the `--colors-*` variables for those paths if they were referenced from any source.

- [ ] **Step 7: Commit**

```bash
git add packages/core/__tests__/visibility.test.ts packages/generator/src/artifacts/types/token-types.ts packages/generator/src/artifacts/setup-artifacts.ts packages/generator/src/artifacts/js/conditions.ts
git commit -m "feat(generator): extend visibility filter to semanticTokens, recipes, patterns, conditions"
```

---

## Phase 4 — Verification

### Task 7: End-to-end sanity check

- [ ] **Step 1: Run the full test surface**

```bash
pnpm test packages/types packages/shared packages/config packages/core packages/generator
```

Expected: all pass. CSS-output snapshot tests in `packages/core/__tests__/atomic-rule.test.ts` MUST NOT change — visibility is a type-surface concern only.

- [ ] **Step 2: Validate the design-system sandboxes still work**

```bash
cd sandbox/v2-ds-example/packages/lib && ./node_modules/.bin/panda lib
cd ../app && ./node_modules/.bin/panda
```

Expected: success on both; output unchanged when no `internal:` block declared.

- [ ] **Step 3: Add an `internal:` block to one fixture and verify filtering**

Edit `sandbox/v2-ds-fixture/packages/lib/preset.ts` to declare `internal: { tokens: ['colors.gray.*'] }`. Re-run the lib + app build. Open the generated `tokens.gen.d.ts` in the app and confirm `colors.gray.*` paths are absent from `ColorToken`. Revert the fixture change before committing (or commit it as a documented example — author's call).

- [ ] **Step 4: Final commit if any fixture / sandbox additions land**

```bash
git add sandbox/<path>
git commit -m "test(sandbox): demonstrate token visibility on v2-ds-fixture"
```

---

## Notes

- **Spec alignment:** `a353f87c` on the design-system branch finalized the design as "the entry point IS the visibility signal — no new flag, presets via `presets:[]` are user-controlled, presets via `designSystem` are external." This plan implements exactly that. No additional config field is introduced.
- **CSS output stability:** Per `CLAUDE.md`, CSS output is sacred. This plan only narrows the TypeScript surface — `--colors-gray-*` vars still emit when referenced. The `atomic-rule.test.ts` snapshots must not change.
- **Why a WeakSet on the merged config:** the filter runs in a different package (`@pandacss/core`) than the resolver (`@pandacss/config`), and the merged config is the natural carrier. Non-enumerable so JSON serialization and snapshot tools ignore it.
- **No CHANGELOG entry yet:** this is an experiment branch off the design-system PR. Changeset comes when the feature is ready to ship under its own PR.
