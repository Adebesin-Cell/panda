import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { PandaContext } from '../src/create-context'

// Cross-package fixture path — see create-context-design-system.test.ts for context.
// The lib-manifest fixtures live in @pandacss/config's __tests__/fixtures/ (introduced
// in OSS-2355 phase 2 task 1, when readLibManifest moved from node to config).
const fixturesRoot = join(__dirname, '../../config/__tests__/fixtures/lib-manifest')

let tmpRoot: string

beforeAll(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'panda-library-mode-'))
  const nm = join(tmpRoot, 'node_modules', '@panda-test')
  mkdirSync(nm, { recursive: true })

  try {
    symlinkSync(join(fixturesRoot, 'valid-pkg'), join(nm, 'valid-lib'), 'dir')
  } catch (e: any) {
    if (e.code !== 'EEXIST') throw e
  }
})

afterAll(() => {
  rmSync(tmpRoot, { recursive: true, force: true })
})

const makeConf = (extra: Record<string, unknown>): any => ({
  config: {
    cwd: tmpRoot,
    include: [],
    outdir: 'styled-system',
    ...extra,
  },
  tsconfig: {},
  hooks: {},
  dependencies: [],
  path: '',
  serialized: '',
  deserialize: () => ({}),
})

describe('libraryMode', () => {
  test('false (default): designSystem buildinfo is hydrated', () => {
    const ctx = new PandaContext(makeConf({ designSystem: '@panda-test/valid-lib' }))
    const json = ctx.parserOptions.encoder.toJSON()
    expect(json.styles.atomic).toContain('color]___[value:libBrand')
  })

  test('true: designSystem buildinfo is NOT hydrated', () => {
    const ctx = new PandaContext(makeConf({ designSystem: '@panda-test/valid-lib', libraryMode: true }))
    const json = ctx.parserOptions.encoder.toJSON()
    expect(json.styles.atomic).not.toContain('color]___[value:libBrand')
  })
})
