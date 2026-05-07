---
'@pandacss/dev': major
'@pandacss/node': major
'@pandacss/types': major
'@pandacss/config': major
---

OSS-2355: introduce `panda lib` for design-system authors. Removes `panda ship` and `panda emit-pkg`.

The new `panda lib` command produces a complete `dist/`:
- `panda.buildinfo.json` (from the old `panda ship`)
- `panda.lib.json` (new — design-system manifest)
- `preset.mjs` (new — compiled preset, so consumers don't need the source `preset.ts` shipped)
- updated `package.json` exports including `./preset` → `./dist/preset.mjs`

Migration:

```bash
# v1
panda codegen && panda ship && panda emit-pkg

# v2
panda lib
```

`panda lib --watch` rebuilds artifacts on `src/` changes.

Consumers point at the manifest with `designSystem: '@acme/ds'` (one config field replacing the old four-knob `presets` + `importMap` + `outdir` + `include`-with-buildinfo coordination).
