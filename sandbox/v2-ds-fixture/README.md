# v2-ds-fixture

flow 4 baseline for OSS-2355. three workspace packages:

- `styled-system/` — the shared runtime (`@v2-ds-fixture/styled-system`). lib and app both import from it.
- `lib/` — the design system (`@v2-ds-fixture/lib`). produces `panda.buildinfo.json` via `panda ship`.
- `app/` — the consumer. wires the lib via `presets`, `importMap`, and `include` with the buildinfo path.

run order:

```
cd packages/styled-system && pnpm panda codegen
cd ../lib && pnpm panda codegen && pnpm panda ship
cd ../app && pnpm panda codegen
```

friction lives in the consumer's `panda.config.ts` — see notes/04 for the count once this fixture has been driven.
