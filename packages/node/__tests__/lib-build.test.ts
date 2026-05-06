import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { PandaContext } from '../src/create-context'
import { buildLib } from '../src/lib-build'

let tmpRoot: string

const FIXTURE_SRC = `
export const styles = { color: 'primary', padding: '4' }
`

function makeCtx(cwd: string): PandaContext {
  const conf: any = {
    config: {
      cwd,
      include: ['./src/**/*.{ts,tsx}'],
      outdir: 'styled-system',
      importMap: '@panda-test/orchestrator-lib/styled-system',
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
})
