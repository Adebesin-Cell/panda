/**
 * Schema for `panda.lib.json` — the manifest a panda-based design system
 * library publishes. Lives in the library's `dist/` and is exposed via
 * the package's `exports` map under `./panda.lib.json`.
 *
 * All paths inside the manifest are relative to the manifest file itself.
 */
export interface LibManifest {
  /**
   * Integer schema version. Unrelated to the panda package version. Bump
   * when the manifest's shape changes in a way consumers must understand.
   */
  schemaVersion: number

  /** The library's npm name, e.g. `@acme/ds`. */
  name: string

  /** The library's npm version, e.g. `1.2.3`. */
  version: string

  /**
   * Semver range of `@pandacss/dev` the library was built against. The
   * consumer's panda will compare its own version to this range and warn
   * or fall back when ranges don't overlap.
   */
  panda: string

  /**
   * Path to the serialized preset module, relative to the manifest. The
   * preset carries tokens, semantic tokens, recipes, conditions, patterns,
   * and keyframes. One preset per design system.
   */
  preset: string

  /**
   * The `importMap` entry the library expects consumers to wire. Consumers
   * concatenate this into their effective importMap; the manifest reader
   * does not apply it directly.
   */
  importMap: {
    css?: string
    recipes?: string
    patterns?: string
    jsx?: string
    tokens?: string
  }

  /**
   * Path to `panda.buildinfo.json`, relative to the manifest. Consumers
   * hydrate their encoder from this file to skip re-extracting the library's
   * source.
   */
  buildinfo: string

  /**
   * Optional fallback re-extract globs. When the consumer's panda can't
   * hydrate the buildinfo (schema mismatch, missing file), it falls back
   * to extracting these paths from the published package. Globs are
   * relative to the package root.
   */
  files?: string[]
}
