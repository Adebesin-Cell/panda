---
'@pandacss/dev': major
'@pandacss/node': major
'@pandacss/types': major
'@pandacss/config': major
---

First-class design system support. One config field for consumers (`designSystem`), one CLI command for lib authors (`panda lib`). Works at every level of a chain composition.

**Lib author flow.** `panda lib` produces a complete `dist/`:

- `panda.buildinfo.json` (replaces `panda ship`)
- `panda.lib.json` (new — design-system manifest)
- `preset.mjs` (new — compiled preset; consumers no longer need source `.ts` shipped)
- patched `package.json` exports including `./preset` → `./dist/preset.mjs`

`panda lib --watch` rebuilds on `src/` changes.

**Migration:**

```bash
# v1
panda codegen && panda ship && panda emit-pkg

# v2
panda lib
```

`panda ship` and `panda emit-pkg` are removed.

**Consumer flow.** Point at the lib via:

```ts
designSystem: '@acme/ds'
```

One field replaces the prior `presets` + `importMap` + `outdir` + `include`-with-buildinfo coordination.

**Smart include.** Bare specifiers in `include` resolve via Node module resolution. Libs with a `panda.lib.json` are skipped (manifest carries the buildinfo path); libs without a manifest get auto-globbed via their `package.json#files`.

**Chain composition.** Intermediate libs in a chain use the same `designSystem: '@parent'` declaration — same shape at depth 1 as at depth N.
