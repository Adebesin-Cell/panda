import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { PandaContext } from '../src/create-context'
import { buildLib } from '../src/lib-build'

let tmpRoot: string

const FIXTURE_SRC = `
export const styles = { color: 'primary', padding: '4' }
`

const FIXTURE_PRESET = `
const testPreset = { name: 'my-design-system', theme: { tokens: {} } }
exports.testPreset = testPreset
`

function makeCtx(cwd: string, extraConfig?: Record<string, unknown>): PandaContext {
  const conf: any = {
    config: {
      cwd,
      include: ['./src/**/*.{ts,tsx}'],
      outdir: 'styled-system',
      importMap: '@panda-test/orchestrator-lib/styled-system',
      ...extraConfig,
    },
    tsconfig: {},
    hooks: {},
    dependencies: [],
    path: '',
    serialized: '',
    deserialize: () => ({}),
  }
  return new PandaContext(conf)
}

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'panda-lib-build-'))
  mkdirSync(join(tmpRoot, 'src'), { recursive: true })
  writeFileSync(
    join(tmpRoot, 'package.json'),
    JSON.stringify({
      name: '@panda-test/orchestrator-lib',
      version: '0.1.0',
      devDependencies: { '@pandacss/dev': '^1.10.0' },
    }),
  )
  writeFileSync(join(tmpRoot, 'src/index.ts'), FIXTURE_SRC)
})

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true })
})

describe('buildLib', () => {
  test('produces manifest, buildinfo, and updated package.json exports', async () => {
    const ctx = makeCtx(tmpRoot)
    await buildLib(ctx, { outdir: 'dist' })

    // panda.lib.json
    expect(existsSync(join(tmpRoot, 'dist', 'panda.lib.json'))).toBe(true)
    const manifest = JSON.parse(readFileSync(join(tmpRoot, 'dist', 'panda.lib.json'), 'utf-8'))
    expect(manifest.schemaVersion).toBe(1)
    expect(manifest.name).toBe('@panda-test/orchestrator-lib')

    // panda.buildinfo.json
    expect(existsSync(join(tmpRoot, 'dist', 'panda.buildinfo.json'))).toBe(true)
    const buildinfo = JSON.parse(readFileSync(join(tmpRoot, 'dist', 'panda.buildinfo.json'), 'utf-8'))
    expect(buildinfo).toHaveProperty('styles')

    // package.json updated with exports
    const pkg = JSON.parse(readFileSync(join(tmpRoot, 'package.json'), 'utf-8'))
    expect(pkg.exports['./panda.lib.json']).toBe('./dist/panda.lib.json')
    expect(pkg.exports['./panda.buildinfo.json']).toBe('./dist/panda.buildinfo.json')
  })

  test('is idempotent — running twice produces no new diff', async () => {
    const ctx1 = makeCtx(tmpRoot)
    await buildLib(ctx1, { outdir: 'dist' })

    const firstManifest = readFileSync(join(tmpRoot, 'dist', 'panda.lib.json'), 'utf-8')
    const firstPkg = readFileSync(join(tmpRoot, 'package.json'), 'utf-8')

    const ctx2 = makeCtx(tmpRoot)
    await buildLib(ctx2, { outdir: 'dist' })

    expect(readFileSync(join(tmpRoot, 'dist', 'panda.lib.json'), 'utf-8')).toBe(firstManifest)
    expect(readFileSync(join(tmpRoot, 'package.json'), 'utf-8')).toBe(firstPkg)
  })

  test('writes presetExport when the preset file uses named exports', async () => {
    // Write a CommonJS preset file with a named export `testPreset`
    writeFileSync(join(tmpRoot, 'preset.js'), FIXTURE_PRESET)

    // Create a context where the resolved config includes the lib's preset object
    const ctx = makeCtx(tmpRoot, {
      presets: [{ name: 'my-design-system', theme: { tokens: {} } }],
    })

    // Point preset option to the preset.js we just wrote (relative to cwd)
    await buildLib(ctx, { outdir: 'dist', preset: './preset.js' })

    const manifest = JSON.parse(readFileSync(join(tmpRoot, 'dist', 'panda.lib.json'), 'utf-8'))
    expect(manifest.presetExport).toBe('testPreset')
  })

  test('writes presetExport=default when the preset file has a default export', async () => {
    // Override the fixture's preset to use module.exports (default export style for CJS).
    // Avoid external imports so the bundle step resolves cleanly inside the tmp dir.
    const presetWithDefault = `
module.exports = {
  name: 'my-design-system',
  theme: { extend: { tokens: { colors: { primary: { value: '#3b82f6' } } } } },
}
`
    writeFileSync(join(tmpRoot, 'preset.js'), presetWithDefault)

    // Create a context where the resolved config includes the lib's preset object
    const ctx = makeCtx(tmpRoot, {
      presets: [{ name: 'my-design-system', theme: { tokens: {} } }],
    })

    // Point preset option to the preset.js we just wrote (relative to cwd)
    await buildLib(ctx, { outdir: 'dist', preset: './preset.js' })

    const manifest = JSON.parse(readFileSync(join(tmpRoot, 'dist', 'panda.lib.json'), 'utf-8'))
    expect(manifest.presetExport).toBe('default')
  })
})

describe('buildLib — preset compilation', () => {
  test('compiles preset.ts to dist/preset.mjs when source exists at default location', async () => {
    const presetTs = `
type Tokens = { colors: { brand: { value: string } } }
const theme: { extend: { tokens: Tokens } } = {
  extend: { tokens: { colors: { brand: { value: '#ff5722' } } } },
}
export const myPreset = { name: 'my-design-system', theme }
`
    writeFileSync(join(tmpRoot, 'preset.ts'), presetTs)

    const ctx = makeCtx(tmpRoot, { presets: [{ name: 'my-design-system', theme: { tokens: {} } }] })
    await buildLib(ctx, { outdir: 'dist' })

    const presetMjs = join(tmpRoot, 'dist', 'preset.mjs')
    expect(existsSync(presetMjs)).toBe(true)

    const manifest = JSON.parse(readFileSync(join(tmpRoot, 'dist', 'panda.lib.json'), 'utf-8'))
    expect(manifest.preset).toBe('./preset.mjs')

    // TS-only syntax (type aliases, type annotations) is stripped
    const compiled = readFileSync(presetMjs, 'utf-8')
    expect(compiled).not.toContain('type Tokens')
    expect(compiled).toContain('myPreset')
  })

  test('package.json gains ./preset export when compile succeeds', async () => {
    writeFileSync(
      join(tmpRoot, 'preset.ts'),
      `export const myPreset = { name: 'my-design-system', theme: { extend: { tokens: {} } } }`,
    )

    const ctx = makeCtx(tmpRoot, { presets: [{ name: 'my-design-system', theme: { tokens: {} } }] })
    await buildLib(ctx, { outdir: 'dist' })

    const pkg = JSON.parse(readFileSync(join(tmpRoot, 'package.json'), 'utf-8'))
    expect(pkg.exports['./preset']).toBe('./dist/preset.mjs')
  })

  test('falls back gracefully when preset source is missing', async () => {
    // No preset.ts written. compilePreset warns + returns false; manifest references the source path as-is.
    const ctx = makeCtx(tmpRoot, { presets: [{ name: 'my-design-system', theme: { tokens: {} } }] })
    await buildLib(ctx, { outdir: 'dist' })

    expect(existsSync(join(tmpRoot, 'dist', 'preset.mjs'))).toBe(false)

    const manifest = JSON.parse(readFileSync(join(tmpRoot, 'dist', 'panda.lib.json'), 'utf-8'))
    expect(manifest.preset).toBe('../preset.ts')

    const pkg = JSON.parse(readFileSync(join(tmpRoot, 'package.json'), 'utf-8'))
    expect(pkg.exports['./preset']).toBeUndefined()
  })

  test('preserves npm-package imports as external in compiled output', async () => {
    const presetTs = `
import { foo } from 'some-npm-pkg'
export const myPreset = { name: 'my-design-system', theme: foo() }
`
    writeFileSync(join(tmpRoot, 'preset.ts'), presetTs)

    const ctx = makeCtx(tmpRoot, { presets: [{ name: 'my-design-system', theme: { tokens: {} } }] })
    await buildLib(ctx, { outdir: 'dist' })

    const compiled = readFileSync(join(tmpRoot, 'dist', 'preset.mjs'), 'utf-8')
    // npm import stays as a real import (not inlined)
    expect(compiled).toMatch(/from\s+['"]some-npm-pkg['"]/)
  })

  test('inlines relative imports into compiled output', async () => {
    const presetTs = `
import { tokens } from './tokens'
export const myPreset = { name: 'my-design-system', theme: { extend: { tokens } } }
`
    const tokensTs = `export const tokens = { colors: { brand: { value: '#ff5722' } } }`
    writeFileSync(join(tmpRoot, 'preset.ts'), presetTs)
    writeFileSync(join(tmpRoot, 'tokens.ts'), tokensTs)

    const ctx = makeCtx(tmpRoot, { presets: [{ name: 'my-design-system', theme: { tokens: {} } }] })
    await buildLib(ctx, { outdir: 'dist' })

    const compiled = readFileSync(join(tmpRoot, 'dist', 'preset.mjs'), 'utf-8')
    // tokens.ts content got inlined — not a real `from './tokens'` import anymore
    expect(compiled).toContain('#ff5722')
    expect(compiled).not.toMatch(/from\s+['"]\.\/tokens['"]/)
  })

  test('compiled output is stable across runs (idempotent)', async () => {
    writeFileSync(
      join(tmpRoot, 'preset.ts'),
      `export const myPreset = { name: 'my-design-system', theme: { extend: { tokens: {} } } }`,
    )

    const ctx1 = makeCtx(tmpRoot, { presets: [{ name: 'my-design-system', theme: { tokens: {} } }] })
    await buildLib(ctx1, { outdir: 'dist' })
    const first = readFileSync(join(tmpRoot, 'dist', 'preset.mjs'), 'utf-8')

    const ctx2 = makeCtx(tmpRoot, { presets: [{ name: 'my-design-system', theme: { tokens: {} } }] })
    await buildLib(ctx2, { outdir: 'dist' })
    const second = readFileSync(join(tmpRoot, 'dist', 'preset.mjs'), 'utf-8')

    expect(second).toBe(first)
  })
})

describe('buildLib — chain composition', () => {
  // The valid-pkg fixture's buildinfo contains exactly one atomic hash:
  // `color]___[value:libBrand`. Any child that hydrates this parent should
  // see that hash propagate into its own buildinfo output.
  const parentFixture = join(__dirname, '../../config/__tests__/fixtures/lib-manifest/valid-pkg')
  const PARENT_HASH = 'color]___[value:libBrand'

  function linkParent(name = 'valid-lib') {
    const nm = join(tmpRoot, 'node_modules', '@panda-test')
    mkdirSync(nm, { recursive: true })
    try {
      symlinkSync(parentFixture, join(nm, name), 'dir')
    } catch (e: any) {
      if (e.code !== 'EEXIST') throw e
    }
  }

  test("child's buildinfo includes parent's hashes when child uses designSystem", async () => {
    linkParent()
    const ctx = makeCtx(tmpRoot, { designSystem: '@panda-test/valid-lib' })
    await buildLib(ctx, { outdir: 'dist' })

    const buildinfo = JSON.parse(readFileSync(join(tmpRoot, 'dist', 'panda.buildinfo.json'), 'utf-8'))
    expect(buildinfo.styles.atomic).toContain(PARENT_HASH)
  })

  test('child without its own styles still emits parent hashes (chain pass-through)', async () => {
    linkParent()
    // Replace the default src that emits styles — child has no styles of its own.
    writeFileSync(join(tmpRoot, 'src/index.ts'), `// no panda usage`)

    const ctx = makeCtx(tmpRoot, { designSystem: '@panda-test/valid-lib' })
    await buildLib(ctx, { outdir: 'dist' })

    const buildinfo = JSON.parse(readFileSync(join(tmpRoot, 'dist', 'panda.buildinfo.json'), 'utf-8'))
    expect(buildinfo.styles.atomic).toContain(PARENT_HASH)
  })

  test('does not throw when designSystem references a missing parent — falls back to own styles', async () => {
    // No symlink — parent doesn't exist in node_modules.
    const ctx = makeCtx(tmpRoot, { designSystem: '@panda-test/missing' })
    await expect(buildLib(ctx, { outdir: 'dist' })).resolves.not.toThrow()

    const buildinfo = JSON.parse(readFileSync(join(tmpRoot, 'dist', 'panda.buildinfo.json'), 'utf-8'))
    expect(buildinfo.styles.atomic).not.toContain(PARENT_HASH)
  })
})
