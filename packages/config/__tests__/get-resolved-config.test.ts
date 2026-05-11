import { mkdtempSync, mkdirSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { getResolvedConfig } from '../src/get-resolved-config'

const fixturesRoot = join(__dirname, 'fixtures/lib-manifest')

let tmpRoot: string

beforeAll(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'panda-resolved-config-'))
  const nm = join(tmpRoot, 'node_modules', '@panda-test')
  mkdirSync(nm, { recursive: true })

  // Symlink each fixture pkg by its package name
  for (const [name, dir] of [
    ['valid-lib', 'valid-pkg'],
    ['no-manifest', 'no-manifest-pkg'],
    ['with-preset-export', 'with-preset-export-pkg'],
    ['chain-lib', 'chain-pkg'],
  ] as const) {
    try {
      symlinkSync(join(fixturesRoot, dir), join(nm, name), 'dir')
    } catch (e: any) {
      if (e.code !== 'EEXIST') throw e
    }
  }
})

afterAll(() => {
  rmSync(tmpRoot, { recursive: true, force: true })
})

describe('getResolvedConfig with designSystem', () => {
  test('reads the manifest and pushes the preset onto the stack', async () => {
    const config = {
      designSystem: '@panda-test/valid-lib',
      include: [],
    }

    const resolved = await getResolvedConfig(config as any, tmpRoot)

    // The manifest's preset should appear in resolved.presets
    expect(resolved.presets).toBeDefined()
    expect(Array.isArray(resolved.presets)).toBe(true)
    // The manifest's preset must be in the resolved presets list
    const presetNames = resolved.presets!.map((p: any) => p.name).filter(Boolean)
    expect(presetNames).toContain('@panda-test/valid-lib/preset')
  })

  test('concatenates manifest importMap into the consumer config', async () => {
    const config = {
      designSystem: '@panda-test/valid-lib',
      importMap: '@consumer/styled-system',
      include: [],
    }

    const resolved = await getResolvedConfig(config as any, tmpRoot)

    expect(Array.isArray(resolved.importMap)).toBe(true)
    expect(resolved.importMap).toEqual([
      '@consumer/styled-system',
      {
        css: '@panda-test/valid-lib/css',
        recipes: '@panda-test/valid-lib/recipes',
      },
    ])
  })

  test('manifest preset tokens propagate to merged theme', async () => {
    const config = {
      designSystem: '@panda-test/valid-lib',
      include: [],
    }

    const resolved = await getResolvedConfig(config as any, tmpRoot)

    const tokens = resolved.theme?.extend?.tokens || resolved.theme?.tokens
    expect(tokens).toBeDefined()
    expect((tokens as any)?.colors?.libBrand?.value).toBe('#abc123')
  })

  test('consumer overrides win over manifest preset tokens', async () => {
    const config = {
      designSystem: '@panda-test/valid-lib',
      theme: {
        extend: {
          tokens: {
            colors: {
              libBrand: { value: '#ff00ff' },
            },
          },
        },
      },
      include: [],
    }

    const resolved = await getResolvedConfig(config as any, tmpRoot)

    const tokens = resolved.theme?.extend?.tokens || resolved.theme?.tokens
    expect((tokens as any)?.colors?.libBrand?.value).toBe('#ff00ff')
  })

  test('throws when designSystem points to a package without a manifest', async () => {
    const config = {
      designSystem: '@panda-test/no-manifest',
      include: [],
    }

    await expect(getResolvedConfig(config as any, tmpRoot)).rejects.toThrow(
      /Cannot resolve '@panda-test\/no-manifest\/panda\.lib\.json'/,
    )
  })

  test('extracts the named preset via manifest.presetExport instead of relying on heuristics', async () => {
    // Fixture has presetExport: 'examplePreset' in its manifest and exports
    // `{ examplePreset: {...} }` with no default — direct property lookup wins.
    const config = {
      designSystem: '@panda-test/with-preset-export',
      include: [],
    }

    const resolved = await getResolvedConfig(config as any, tmpRoot)

    const presetNames = resolved.presets!.map((p: any) => p.name).filter(Boolean)
    expect(presetNames).toContain('@panda-test/with-preset-export/preset')

    const tokens = resolved.theme?.extend?.tokens || resolved.theme?.tokens
    expect((tokens as any)?.colors?.namedBrand?.value).toBe('#aabbcc')
  })
})

describe('getResolvedConfig _externalPresets', () => {
  test('_externalPresets is a WeakSet attached non-enumerably', async () => {
    const config = {
      designSystem: '@panda-test/valid-lib',
      include: [],
    }

    const resolved = await getResolvedConfig(config as any, tmpRoot)

    expect((resolved as any)._externalPresets).toBeInstanceOf(WeakSet)
    expect(Object.keys(resolved).indexOf('_externalPresets')).toBe(-1)
  })

  test('tags the designSystem-loaded preset as external', async () => {
    const config = {
      designSystem: '@panda-test/valid-lib',
      include: [],
    }

    const resolved = await getResolvedConfig(config as any, tmpRoot)
    const externalPresets: WeakSet<object> = (resolved as any)._externalPresets

    const libPreset = resolved.presets!.find((p: any) => p?.name === '@panda-test/valid-lib/preset')
    expect(libPreset).toBeDefined()
    expect(externalPresets.has(libPreset as object)).toBe(true)
  })

  test('does not tag user-imported presets as external', async () => {
    const userPreset = { name: 'user-preset' }
    const config = {
      designSystem: '@panda-test/valid-lib',
      presets: [userPreset as any],
      include: [],
    }

    const resolved = await getResolvedConfig(config as any, tmpRoot)
    const externalPresets: WeakSet<object> = (resolved as any)._externalPresets

    expect(externalPresets.has(userPreset)).toBe(false)
  })

  test('returns a WeakSet that contains no resolved presets when designSystem is not set', async () => {
    const userPreset = { name: 'user' }
    const config = {
      presets: [userPreset as any],
      include: [],
    }

    const resolved = await getResolvedConfig(config as any, tmpRoot)
    const externalPresets: WeakSet<object> = (resolved as any)._externalPresets

    expect(externalPresets).toBeInstanceOf(WeakSet)
    for (const p of resolved.presets ?? []) {
      if (p && typeof p === 'object') {
        expect(externalPresets.has(p as object)).toBe(false)
      }
    }
  })

  test('propagates external tag transitively to sub-presets of designSystem preset', async () => {
    const config = {
      designSystem: '@panda-test/chain-lib',
      include: [],
    }

    const resolved = await getResolvedConfig(config as any, tmpRoot)
    const externalPresets: WeakSet<object> = (resolved as any)._externalPresets

    const outer = resolved.presets!.find((p: any) => p?.name === '@panda-test/chain-lib/preset')
    const inner = resolved.presets!.find((p: any) => p?.name === '@panda-test/chain-lib/inner-preset')

    expect(outer).toBeDefined()
    expect(inner).toBeDefined()
    expect(externalPresets.has(outer as object)).toBe(true)
    expect(externalPresets.has(inner as object)).toBe(true)
  })
})
