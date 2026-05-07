---
'@pandacss/node': minor
---

Drop the internal `libraryMode` gate so `designSystem` encoder hydration runs at every level of a design-system chain, not just on the terminal consumer.

Before, intermediate libs that extended a parent had to wire the parent's buildinfo by hand via `include: ['./node_modules/@parent/dist/panda.buildinfo.json']`. After this change, those intermediate libs can use `designSystem: '@parent'` for the same effect — one field replaces the path coordination at every level.

Same shape at depth 1 as at depth N.
