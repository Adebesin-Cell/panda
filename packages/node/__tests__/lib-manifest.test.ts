import { mkdirSync, rmSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { readLibManifest } from '../src/lib-manifest'

const fixtureCwd = join(__dirname, 'fixtures/lib-manifest')
const nodeModules = join(fixtureCwd, 'node_modules', '@panda-test')

beforeAll(() => {
  mkdirSync(nodeModules, { recursive: true })
  const link = (pkg: string, target: string) => {
    const dest = join(nodeModules, pkg)
    try {
      symlinkSync(join(fixtureCwd, target), dest)
    } catch {
      // already exists — fine
    }
  }
  link('valid-lib', 'valid-pkg')
  link('no-manifest', 'no-manifest-pkg')
  link('malformed', 'malformed-pkg')
  link('incomplete', 'incomplete-pkg')
  link('wrong-type', 'wrong-type-pkg')
})

afterAll(() => {
  rmSync(join(fixtureCwd, 'node_modules'), { recursive: true, force: true })
})

describe('readLibManifest', () => {
  test('resolves a valid manifest from a package', () => {
    const result = readLibManifest('@panda-test/valid-lib', fixtureCwd)
    expect(result.manifest.name).toBe('@panda-test/valid-lib')
    expect(result.manifest.schemaVersion).toBe(1)
    expect(result.manifest.preset).toBe('./preset.js')
    expect(result.manifestPath).toMatch(/valid-pkg\/dist\/panda\.lib\.json$/)
  })

  test('throws when the package cannot be resolved', () => {
    expect(() => readLibManifest('@panda-test/does-not-exist', fixtureCwd)).toThrow(
      /Cannot resolve '@panda-test\/does-not-exist\/panda\.lib\.json'/,
    )
  })

  test('throws when the package has no panda.lib.json export', () => {
    expect(() => readLibManifest('@panda-test/no-manifest', fixtureCwd)).toThrow(/Cannot resolve/)
  })

  test('throws on malformed json', () => {
    expect(() => readLibManifest('@panda-test/malformed', fixtureCwd)).toThrow(/Invalid JSON/)
  })

  test('throws when required fields are missing', () => {
    expect(() => readLibManifest('@panda-test/incomplete', fixtureCwd)).toThrow(/missing required field 'version'/)
  })

  test("throws when 'schemaVersion' is not an integer", () => {
    expect(() => readLibManifest('@panda-test/wrong-type', fixtureCwd)).toThrow(/'schemaVersion' must be an integer/)
  })
})
