# v2-ds-fixture

depth-3 chain composition fixture. four workspace packages:

- `styled-system/` — the shared runtime (`@v2-ds-fixture/styled-system`). all levels import from it.
- `lib/` — the base design system (`@v2-ds-fixture/lib`).
- `lib-mid/` — extends `lib` via `designSystem`.
- `lib-leaf/` — extends `lib-mid` via `designSystem`.
- `app/` — the consumer. wires only the leaf via `designSystem: '@v2-ds-fixture/lib-leaf'`.

run order:

```
cd packages/styled-system && pnpm panda codegen
cd ../lib && pnpm panda lib
cd ../lib-mid && pnpm panda lib
cd ../lib-leaf && pnpm panda lib
cd ../app && pnpm panda
```

each level's `panda lib` reads its parent's buildinfo through `designSystem`, hydrates the encoder, and ships its own union back out. the consumer hydrates the leaf only and gets the whole chain transitively.
