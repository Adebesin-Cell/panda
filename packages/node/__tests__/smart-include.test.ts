import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { PandaContext } from '../src/create-context'

const fixturesRoot = join(__dirname, 'fixtures/smart-include')

let tmpRoot: string

beforeAll(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'panda-smart-include-'))
  const nm = join(tmpRoot, 'node_modules', '@panda-test')
  mkdirSync(nm, { recursive: true })

  for (const [name, dir] of [
    ['smart-with-manifest', 'with-manifest-pkg'],
    ['smart-no-manifest', 'no-manifest-pkg'],
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

const makeConf = (include: string[]): any => ({
  config: {
    cwd: tmpRoot,
    include,
    outdir: 'styled-system',
  },
  tsconfig: {},
  hooks: {},
  dependencies: [],
  path: '',
  serialized: '',
  deserialize: () => ({}),
})

describe('smart include — bare specifiers', () => {
  test('package with panda.lib.json is skipped from glob (no error, empty files for that entry)', () => {
    const ctx = new PandaContext(makeConf(['@panda-test/smart-with-manifest']))
    const files = ctx.getFiles()
    expect(files.find((f) => f.includes('with-manifest-pkg/dist'))).toBeUndefined()
  })

  test('package without panda.lib.json globs its dist files', () => {
    const ctx = new PandaContext(makeConf(['@panda-test/smart-no-manifest']))
    const files = ctx.getFiles()
    expect(files.some((f) => f.endsWith('no-manifest-pkg/dist/index.js'))).toBe(true)
  })

  test('mixed include: glob + bare specifier', () => {
    const ctx = new PandaContext(makeConf(['./src/**/*.{ts,tsx}', '@panda-test/smart-no-manifest']))
    const files = ctx.getFiles()
    expect(files.some((f) => f.endsWith('no-manifest-pkg/dist/index.js'))).toBe(true)
  })

  test('unresolvable bare specifier warns but does not throw', () => {
    expect(() => {
      new PandaContext(makeConf(['@panda-test/does-not-exist']))
    }).not.toThrow()
  })
})
