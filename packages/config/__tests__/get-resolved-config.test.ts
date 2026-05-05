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
    expect(resolved.presets!.length).toBeGreaterThan(0)
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
})
