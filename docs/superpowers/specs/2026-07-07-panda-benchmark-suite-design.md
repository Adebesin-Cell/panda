# Panda Benchmark Suite — Design

**Date:** 2026-07-07 · **Status:** draft — pending user review · **Owner:** bench/

## Goal

One benchmark harness that is a *true reflection* of Panda v2 performance across every mode it runs in, comparable
against v1 and against the competitive field, from a single entry point. Own it in-repo (`bench/`); do not fork the
methodology out to an external project.

Four modes are in scope (all confirmed as headline):

1. **Build-time extraction** — cold + incremental/HMR compile over realistic corpora. v2's biggest win (Rust/Oxc).
2. **Runtime / SSR cost** — `css()` / `styled` / `cva` per-call and SSR render cost.
3. **Transformer output** — correctness + how much the transformer compiles away to static strings, and the resulting
   runtime/bundle savings.
4. **CSS output size** — generated stylesheet size vs competitors. **Label-and-gated** (see §6).

## Approach (chosen: A — unified matrix harness)

A single runner drives a **corpus × mode × target** matrix. The existing scripts become the mode *implementations*; the
new code is a thin runner, a shared fixture/fairness layer, and a JSON result schema. We are not building a benchmark
framework — the runner is a loop, the fairness rules are a shared helper, the reporting is a JSON file plus a table
printer.

Rejected alternatives:

- **B — keep scripts separate, add a competitor axis + aggregator.** Fairness rules stay copy-pasted per script and
  drift; weakest as a "source of truth."
- **C — external-first.** Ruled out — we own the methodology in `bench/`.

## Architecture

```
bench/
  src/
    index.ts            # NEW single entry: `pnpm bench [--mode] [--target] [--corpus] [--json]`
    runner.ts           # NEW matrix loop + fairness harness (timing, warm/cold, gc, repeats)
    schema.ts           # NEW result JSON schema + table printer
    fixtures/           # NEW shared corpora (see §3), generated or checked-in
    modes/
      extraction.ts     # from extract-compare.ts / perf.test.ts
      runtime.ts        # from runtime-css.ts
      transformer.ts    # NEW (starts as correctness + compile-away ratio; see §4.3)
      css-size.ts       # NEW, label-and-gated
    targets/            # NEW adapter per comparison target (v1, v2, competitors)
  src/bin/*.rs          # existing Rust benches, invoked by extraction mode where a native number is wanted
  __tests__/            # existing vitest harnesses stay as correctness/parity guards
```

**Target adapter contract.** Each target exposes only the capabilities it has: `{ name, kind: 'build'|'runtime'|'both',
extract?(corpus), runtime?(corpus), cssSize?(corpus) }`. A mode iterates only over targets that implement its
capability. v1 and v2 implement build + runtime; most competitors implement a subset. This is why the matrix is sparse,
not a full cross-product — the runner records `n/a` for unsupported cells rather than faking a number.

## 3. Corpora (shared, one definition per corpus)

| Corpus            | Source                              | Purpose                                        |
| ----------------- | ----------------------------------- | ---------------------------------------------- |
| `sandbox-vite-ts` | checked-in `sandbox/vite-ts`        | small real app, normal extraction              |
| `synth-100`       | generated (as in `perf.test.ts`)    | scales past tiny sandboxes; deterministic      |
| `jsx-heavy`       | generated (as in `jsx-heavy-*`)     | style-prop / factory heavy                     |
| `large-generated` | generated, N configurable           | stress cold-build + memory                     |
| `scale-curve`     | generated at 100 / 1k / 10k sites   | CSS-size + build-time **curve**, not a point   |

Corpus rules: deterministic generation (seeded, no `Date.now`/random drift), in-memory or checked-in, **never writes
tracked files** (existing bench rule). Every target receives byte-identical source strings keyed by identical paths.

**Report curves, not points.** The `scale-curve` corpus exists because the atomic-CSS "plateau" claim (StyleX's whole
pitch) and build-time scaling are only visible across call-site counts. A single synthetic point (the "22 buttons" hole
in existing public benchmarks) is not credible. Corpora should lean realistic (a real component library / large sandbox
app), not micro-benches.

## 4. Modes

### 4.1 Build-time extraction
Publish **three build numbers, not one**, mirroring how Tailwind v4 tells its story (and labeling each so we're not
accused of the "192µs cache-hit presented as build speed" sleight-of-hand):

1. **Cold full build** — caches nuked (a `--prepare` hook clears `crates/cache` state / node caches before the run).
2. **Incremental, new styles** — one file changed introducing new atoms.
3. **Incremental, no new styles** — one file changed, cache hit (where `crates/cache` should shine; the big multipliers
   live here — label them cache-hit explicitly).

Cold pass parses every file once; warm pass re-parses the largest file N times (steady-state µs/file). File I/O excluded
from timers. Reuses the `extract-compare.ts` / `perf.test.ts` methodology. v2 via `@pandacss/compiler`; v1 via
`@pandacss/node@1.11.3` (npm, not workspace — per bench legacy-pinning rule). Competitors via their own build APIs where
they expose one; otherwise `n/a`. Also record **peak RSS** during cold build — rarely measured publicly, so an easy
differentiator for large monorepos.

### 4.2 Runtime / SSR
Port `runtime-css.ts`: shop-page SSR (plain floor vs `css()` vs `styled`), scale sweep (1/100/400/1000 tiles), per-call
cached-vs-cold cost, and the cache guard (cached must be ≥2× cheaper than cold — the weakMemo regression tripwire).
Keep the guard as a hard assertion, not just a printed number. Add client re-render cost alongside SSR.

This mode must tell the **honest dual story** the research flagged as Panda's documented soft spot (runtime `cva`
measured ~2–3× slower than Tailwind+cva, discussion #1982):

- the **build-inlined path is effectively free** (static extraction → no runtime serialization), and
- the **memoized runtime path** (recent `memo()` work) closed the gap versus the weakMemo regression.

When comparing `cva` across tools, **match feature scope or footnote it** — the #1982 comparison was uneven because
Panda's `cva` merges *and* dedupes while the other side used separate libs.

### 4.3 Transformer output
The `pandacss_transformer` crate is design-only today (`design-notes/transformer/`). So this mode ships in two stages:

- **Now:** correctness + compile-away ratio against the prototype logic — for each call site in a fixture, does it
  compile to a plain string literal, inline concat, or a `cn` helper call? Report the ratio of fully-erased sites and
  the residual runtime surface.
- **After the crate lands:** add before/after runtime cost and shipped-bundle-size deltas (transformed vs untransformed
  app) as additional target cells.

### 4.4 CSS output size — **label-and-gated**
Emit generated stylesheet for each target over each corpus, report **gzipped byte size and its growth curve** across
the `scale-curve` corpus (100 / 1k / 10k sites) — the curve is what substantiates the atomic "plateau" claim against
StyleX; the absolute point does not. **Every v2 size/emit-speed number is labeled `raw / unminified`** because v2 emits
raw strings with no optimizer (lightningcss/minify parity is the open follow-up). The fair, publishable comparison is
**gated on that follow-up** — until then the runner prints the raw number with the label and a one-line note; it does
not present a v2-vs-competitor size verdict. (Confirmed with owner: gate, don't exclude — keep the raw number visible so
the gap to minified is trackable.)

## 5. Fairness rules (shared harness, applied uniformly)

- Setup/construction cost measured and reported separately from steady-state (v2 native construction dominates trivial
  corpora — do not fold it into per-file numbers).
- Cold vs warm always distinguished and labeled; the three build modes (§4.1) each carry their own label so a cache-hit
  number is never presented as general build speed.
- Same corpus, same source strings, same paths across all targets.
- Legacy/competitor deps pinned to published npm versions, resolved as installed (no `--conditions source`); v2 packages
  on `workspace:*`. (Existing bench rule.)
- **Statistical rigor (hyperfine pattern):** repeated runs reporting min/mean/median/stddev with outlier detection, not
  a single sample; `--prepare` cache-nuke hook for cold runs; force GC between phases where the runtime allows. Document
  that CI should pin the CPU governor to `performance` and run isolated (background processes add 5–15% noise).
- **Match feature scope across tools, or footnote the asymmetry** (the #1982 `cva` merge+dedupe vs separate-libs trap).
- Record repo commit + hardware + target versions in the result header (existing baseline rule).
- Minification state labeled on every size/emit number; on the css-size axis, both sides minified or both raw — never
  mixed (Tailwind v4 minifies via Lightning CSS; an unminified v2 vs minified competitor would look artificially large).
- Treat all vendor headline numbers as directional only — they are vendor-run on vendor templates. Our differentiator is
  that this harness is reproducible and cross-tool.

## 6. Result schema & CI

`results.json`: `{ meta: { commit, hardware, date, versions }, rows: [{ mode, corpus, target, metric, value, unit,
labels: ['cold'|'warm'|'raw-unminified'|...], na?: true }] }`. A table printer renders it for humans; `--json` emits it
raw. CI can diff `results.json` against a stored baseline to catch regressions (the runtime cache guard is the first
such gate; extraction cold-build time is the second).

## 7. Competitor axis

There is **no maintained, current, apples-to-apples build-time-extraction benchmark in the wild** that includes the
modern cohort (Panda, StyleX, vanilla-extract). The canonical matrix repos (`andreipfeiffer/css-in-js`,
`geeky-biz/css-in-js-benchmark`) are unmaintained and pre-date it. So there is nothing better to contribute *to* — owning
a reproducible cross-tool harness is itself the credibility story. (Publishing `bench/` as a PR-able open harness later
is an option, not current scope.)

Target set, grouped by why they're in the matrix:

| Target             | Category                          | Modes it implements        | Role in the story                                    |
| ------------------ | --------------------------------- | -------------------------- | ---------------------------------------------------- |
| **Panda v2**       | build-time extraction + runtime   | all four                   | subject                                              |
| **Panda v1**       | build-time extraction + runtime   | all four                   | our own baseline (regression + rewrite payoff)       |
| **StyleX**         | build-time atomic + small runtime | build, css-size            | closest ergonomic peer; owns the "CSS plateaus" claim |
| **vanilla-extract**| build-time zero-runtime           | build, css-size            | closest ergonomic peer                               |
| **Tailwind v4**    | build-time atomic (Rust/Oxide)    | build, css-size            | atomic-output + build-speed bar (has the headline numbers) |
| **UnoCSS**         | build-time on-demand atomic       | build, css-size            | build-speed bar                                      |
| **Emotion**        | runtime CSS-in-JS                 | runtime, css-size          | "runtime baseline you're beating"                    |
| **styled-components** | runtime CSS-in-JS              | runtime, css-size          | runtime baseline                                     |
| **CSS Modules**    | build-time, no runtime            | build, runtime (zero), css-size | zero-runtime reference point                    |

Sparse by design: pure-static competitors implement `build`/`cssSize` but not `runtime`; the runner records `n/a` for
unsupported cells (see the target adapter contract in §Architecture) rather than fabricating a number.

**Panda's public gap this axis must close (from the research):**

- Panda has **no public build-time numbers** while every competitor does — the Rust/Oxc rewrite is the reason to publish
  now.
- Panda's only concrete public perf data is *unfavorable*: runtime `cva` measured ~2–3× slower than Tailwind+cva
  (discussion #1982). The runtime mode (§4.2) must show both halves of the honest rebuttal: the build-inlined path is
  effectively free, and the memo work closed the runtime gap.
- StyleX owns "CSS plateaus at scale"; Panda emits atomic CSS too and should substantiate the same with the css-size
  *curve* (§4.4), not a single point.

## 8. Phasing

1. Runner + schema + shared fixtures + fairness harness; port extraction & runtime modes onto it (no behavior change,
   just unified). Ship `pnpm bench`.
2. Competitor adapters for the researched target set (build + size where applicable).
3. Transformer mode stage 1 (correctness + compile-away ratio).
4. CSS-size mode behind the label-and-gate; wire the CI regression diff.
5. (Gated) fair size/emit comparison once minify parity lands; transformer mode stage 2 once the crate lands.

## Non-goals

- Not a public/external benchmark project (owner chose in-repo).
- Not a benchmark framework — thin runner over existing scripts.
- No new runtime/build behavior; this is measurement only.
- Not replacing the `__tests__/` parity/correctness vitest suites — those stay as guards.

## References (competition research, 2026-07-07)

- [Tailwind v4 (Oxide) build numbers](https://tailwindcss.com/blog/tailwindcss-v4) · [UnoCSS "Why"](https://unocss.dev/guide/why)
  · [StyleX overview](https://renderlog.in/blog/meta-stylex-compile-time-styling/) · [vanilla-extract](https://vanilla-extract.style/)
- Independent runtime-cost evidence: [Pustelto CSS vs CSS-in-JS](https://pustelto.com/blog/css-vs-css-in-js-perf/)
- Methodology templates: [andreipfeiffer/css-in-js](https://github.com/andreipfeiffer/css-in-js) (matrix, stale) ·
  [geeky-biz/css-in-js-benchmark](https://github.com/geeky-biz/css-in-js-benchmark) (re-render, unmaintained) ·
  [hyperfine](https://github.com/sharkdp/hyperfine) (stat rigor)
- Panda's documented runtime soft spot: [discussion #1982](https://github.com/chakra-ui/panda/discussions/1982)
- Positioning: [pkgpulse State of CSS-in-JS 2026](https://www.pkgpulse.com/guides/state-of-css-in-js-2026) ·
  [pkgpulse Tailwind v4 vs UnoCSS vs Panda](https://www.pkgpulse.com/guides/tailwind-v4-vs-unocss-vs-pandacss-2026)
