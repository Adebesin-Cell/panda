import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import type { LibManifest } from '@pandacss/types'
import { writeLibManifest } from '../src/manifest-writer'

let tmpRoot: string

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'panda-manifest-writer-'))
  mkdirSync(join(tmpRoot, 'dist'), { recursive: true })
  writeFileSync(
    join(tmpRoot, 'package.json'),
    JSON.stringify({
      name: '@panda-test/example-lib',
      version: '1.2.3',
      devDependencies: { '@pandacss/dev': '^1.10.0' },
    }),
  )
})

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true })
})

describe('writeLibManifest', () => {
  test('writes a valid manifest with package metadata', () => {
    writeLibManifest({
      cwd: tmpRoot,
      outdir: 'dist',
      preset: './preset.js',
      buildinfo: './panda.buildinfo.json',
      importMap: { css: '@panda-test/example-lib/css' },
    })

    const written: LibManifest = JSON.parse(readFileSync(join(tmpRoot, 'dist', 'panda.lib.json'), 'utf-8'))

    expect(written.schemaVersion).toBe(1)
    expect(written.name).toBe('@panda-test/example-lib')
    expect(written.version).toBe('1.2.3')
    expect(written.panda).toBe('^1.10.0')
    expect(written.preset).toBe('./preset.js')
    expect(written.buildinfo).toBe('./panda.buildinfo.json')
    expect(written.importMap).toEqual({ css: '@panda-test/example-lib/css' })
  })

  test('normalizes workspace: protocol via installed version lookup', () => {
    // Create a fake node_modules/@pandacss/dev/package.json under the tmpRoot
    const pkgDir = join(tmpRoot, 'node_modules', '@pandacss', 'dev')
    mkdirSync(pkgDir, { recursive: true })
    writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({ version: '2.5.0' }))

    // Update the lib's package.json to use workspace:*
    writeFileSync(
      join(tmpRoot, 'package.json'),
      JSON.stringify({
        name: '@panda-test/workspace-lib',
        version: '0.0.1',
        devDependencies: { '@pandacss/dev': 'workspace:*' },
      }),
    )

    writeLibManifest({
      cwd: tmpRoot,
      outdir: 'dist',
      preset: './preset.js',
      buildinfo: './panda.buildinfo.json',
      importMap: {},
    })

    const written: LibManifest = JSON.parse(readFileSync(join(tmpRoot, 'dist', 'panda.lib.json'), 'utf-8'))

    expect(written.panda).toBe('^2.0.0')
  })

  test('throws when package.json is missing name', () => {
    writeFileSync(join(tmpRoot, 'package.json'), JSON.stringify({ version: '1.0.0' }))

    expect(() =>
      writeLibManifest({
        cwd: tmpRoot,
        outdir: 'dist',
        preset: './preset.js',
        buildinfo: './panda.buildinfo.json',
        importMap: {},
      }),
    ).toThrow(/missing 'name'/)
  })

  test('throws when package.json is missing version', () => {
    writeFileSync(join(tmpRoot, 'package.json'), JSON.stringify({ name: '@panda-test/no-version' }))

    expect(() =>
      writeLibManifest({
        cwd: tmpRoot,
        outdir: 'dist',
        preset: './preset.js',
        buildinfo: './panda.buildinfo.json',
        importMap: {},
      }),
    ).toThrow(/missing 'version'/)
  })

  test('uses provided pandaVersion when given', () => {
    writeFileSync(
      join(tmpRoot, 'package.json'),
      JSON.stringify({
        name: '@panda-test/provided-version',
        version: '0.1.0',
        devDependencies: { '@pandacss/dev': 'workspace:*' },
      }),
    )

    writeLibManifest({
      cwd: tmpRoot,
      outdir: 'dist',
      preset: './preset.js',
      buildinfo: './panda.buildinfo.json',
      importMap: {},
      pandaVersion: '3.7.1',
    })

    const written = JSON.parse(readFileSync(join(tmpRoot, 'dist', 'panda.lib.json'), 'utf-8'))
    expect(written.panda).toBe('^3.0.0')
  })

  test('writes presetExport when provided', () => {
    writeLibManifest({
      cwd: tmpRoot,
      outdir: 'dist',
      preset: './preset.js',
      buildinfo: './panda.buildinfo.json',
      importMap: {},
      presetExport: 'examplePreset',
    })

    const written = JSON.parse(readFileSync(join(tmpRoot, 'dist', 'panda.lib.json'), 'utf-8'))
    expect(written.presetExport).toBe('examplePreset')
  })

  test('omits presetExport when not provided', () => {
    writeLibManifest({
      cwd: tmpRoot,
      outdir: 'dist',
      preset: './preset.js',
      buildinfo: './panda.buildinfo.json',
      importMap: {},
    })

    const written = JSON.parse(readFileSync(join(tmpRoot, 'dist', 'panda.lib.json'), 'utf-8'))
    expect('presetExport' in written).toBe(false)
  })
})
