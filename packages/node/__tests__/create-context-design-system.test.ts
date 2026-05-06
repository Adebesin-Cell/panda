import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { PandaContext } from '../src/create-context'

// Cross-package fixture path: the `lib-manifest` fixtures live in
// @pandacss/config's __tests__/fixtures/ (introduced in OSS-2355
// phase 2 task 1, when readLibManifest moved from node to config).
// If those fixtures relocate, this path needs to follow.
const fixturesRoot = join(__dirname, '../../config/__tests__/fixtures/lib-manifest')

let tmpRoot: string

beforeAll(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'panda-create-context-ds-'))
  const nm = join(tmpRoot, 'node_modules', '@panda-test')
  mkdirSync(nm, { recursive: true })

  for (const [name, dir] of [
    ['valid-lib', 'valid-pkg'],
    ['broken-buildinfo', 'broken-buildinfo-pkg'],
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

const makeConf = (designSystem: string): any => ({
  config: {
    cwd: tmpRoot,
    designSystem,
    include: [],
    outdir: 'styled-system',
  },
  tsconfig: {},
  hooks: {},
  dependencies: [],
  path: '',
  serialized: '',
  deserialize: () => ({}),
})

describe('createContext with designSystem', () => {
  test('hydrates encoder from manifest buildinfo', () => {
    const ctx = new PandaContext(makeConf('@panda-test/valid-lib'))

    const json = ctx.parserOptions.encoder.toJSON()
    expect(json.styles.atomic).toContain('color]___[value:libBrand')
  })

  test('warns gracefully when buildinfo is missing', () => {
    expect(() => new PandaContext(makeConf('@panda-test/broken-buildinfo'))).not.toThrow()
  })

  test('warns gracefully when designSystem package cannot be resolved', () => {
    const conf: any = {
      config: {
        cwd: tmpRoot,
        designSystem: '@panda-test/does-not-exist',
        include: [],
        outdir: 'styled-system',
      },
      tsconfig: {},
      hooks: {},
      dependencies: [],
      path: '',
      serialized: '',
      deserialize: () => ({}),
    }

    expect(() => new PandaContext(conf)).not.toThrow()
  })
})
