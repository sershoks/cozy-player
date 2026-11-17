// Downloads the prebuilt go-librespot binary for the target platform/arch
// into resources/bin/<platform>-<arch>/ so it can be spawned by the main
// process (dev) or bundled by electron-builder (extraResources, see
// electron-builder.yml).
//
// On Windows, go-librespot's release is a bare .exe dynamically linked
// against a handful of MinGW-built audio codec DLLs (libogg/libvorbis/
// flac/mpg123 + the gcc runtime + winpthread) that MSYS2 users would
// normally get via `pacman -S mingw-w64-x86_64-...`. Since we don't want end
// users to have to install MSYS2 just to run this app, we fetch those DLLs
// straight from the MSYS2 mirror and drop them next to the exe.
import { createWriteStream, existsSync, mkdirSync, chmodSync, writeFileSync, copyFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'
import * as tar from 'tar'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const VERSION = process.env.GOLIBRESPOT_VERSION || 'v0.9.0'

const ASSET_BY_TARGET = {
  'win32-x64': 'go-librespot_windows_amd64.tar.gz',
  'linux-x64': 'go-librespot_linux_x86_64.tar.gz',
  'linux-arm64': 'go-librespot_linux_arm64.tar.gz'
}

// Pinned MSYS2 mingw64 package versions providing the codec/runtime DLLs
// go-librespot.exe needs. Bump these if a fresh Windows build ever
// complains about a missing DLL that isn't in this list, or reports one
// of these filenames has moved. (Exit code 3221225781 = STATUS_DLL_NOT_FOUND.)
const MSYS2_PACKAGES = [
  { name: 'libogg', file: 'mingw-w64-x86_64-libogg-1.3.6-1-any.pkg.tar.zst', dlls: ['libogg-0.dll'] },
  {
    name: 'libvorbis',
    file: 'mingw-w64-x86_64-libvorbis-1.3.7-3-any.pkg.tar.zst',
    dlls: ['libvorbis-0.dll', 'libvorbisenc-2.dll', 'libvorbisfile-3.dll']
  },
  { name: 'flac', file: 'mingw-w64-x86_64-flac-1.5.0-2-any.pkg.tar.zst', dlls: ['libFLAC.dll'] },
  { name: 'mpg123', file: 'mingw-w64-x86_64-mpg123-1.33.7-1-any.pkg.tar.zst', dlls: ['libmpg123-0.dll'] },
  {
    name: 'gcc-libs',
    file: 'mingw-w64-x86_64-gcc-libs-16.2.0-3-any.pkg.tar.zst',
    dlls: ['libgcc_s_seh-1.dll', 'libstdc++-6.dll']
  },
  {
    name: 'libwinpthread',
    file: 'mingw-w64-x86_64-libwinpthread-14.0.0.r353.g6df76fa52-2-any.pkg.tar.zst',
    dlls: ['libwinpthread-1.dll']
  }
]

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { all: args.includes('--all') }
  const platIdx = args.indexOf('--platform')
  const archIdx = args.indexOf('--arch')
  opts.platform = platIdx >= 0 ? args[platIdx + 1] : process.platform
  opts.arch = archIdx >= 0 ? args[archIdx + 1] : process.arch
  return opts
}

async function fetchWindowsAudioDeps(destDir) {
  const pending = MSYS2_PACKAGES.filter((p) => !p.dlls.every((d) => existsSync(path.join(destDir, d))))
  if (pending.length === 0) {
    console.log('[fetch-librespot] windows audio runtime DLLs already present, skipping')
    return
  }

  const tmpDir = path.join(destDir, '_msys2_tmp')
  mkdirSync(tmpDir, { recursive: true })

  try {
    for (const pkg of pending) {
      const url = `https://mirror.msys2.org/mingw/mingw64/${pkg.file}`
      console.log(`[fetch-librespot] downloading ${url}`)
      const res = await fetch(url, { redirect: 'follow' })
      if (!res.ok) {
        throw new Error(`[fetch-librespot] failed to download ${url}: ${res.status} ${res.statusText}`)
      }
      const zstBuf = Buffer.from(await res.arrayBuffer())
      const tarBuf = zlib.zstdDecompressSync(zstBuf)
      const tarPath = path.join(tmpDir, `${pkg.name}.tar`)
      writeFileSync(tarPath, tarBuf)

      const extractDir = path.join(tmpDir, pkg.name)
      mkdirSync(extractDir, { recursive: true })
      await tar.x({ file: tarPath, cwd: extractDir })

      for (const dll of pkg.dlls) {
        const src = path.join(extractDir, 'mingw64', 'bin', dll)
        if (!existsSync(src)) {
          throw new Error(`[fetch-librespot] expected ${dll} inside ${pkg.file} at ${src}, but it was missing`)
        }
        copyFileSync(src, path.join(destDir, dll))
      }
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }

  console.log('[fetch-librespot] windows audio runtime DLLs ready')
}

async function fetchOne(platform, arch) {
  const target = `${platform}-${arch}`
  const asset = ASSET_BY_TARGET[target]
  if (!asset) {
    console.warn(`[fetch-librespot] no known go-librespot asset for ${target}, skipping`)
    return
  }

  const destDir = path.join(ROOT, 'resources', 'bin', target)
  const binName = platform === 'win32' ? 'go-librespot.exe' : 'go-librespot'
  const binPath = path.join(destDir, binName)

  mkdirSync(destDir, { recursive: true })

  if (!existsSync(binPath)) {
    const url = `https://github.com/devgianlu/go-librespot/releases/download/${VERSION}/${asset}`
    console.log(`[fetch-librespot] downloading ${url}`)

    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok || !res.body) {
      throw new Error(`[fetch-librespot] failed to download ${url}: ${res.status} ${res.statusText}`)
    }

    const tmpTar = path.join(destDir, 'download.tar.gz')
    await pipeline(res.body, createWriteStream(tmpTar))
    await tar.x({ file: tmpTar, cwd: destDir })
    await rm(tmpTar)

    if (!existsSync(binPath)) {
      // The archive may contain the binary under a different exact name/case;
      // fail loudly rather than silently shipping a broken build.
      throw new Error(
        `[fetch-librespot] expected binary at ${binPath} after extracting ${asset}, but it was not found`
      )
    }

    if (platform !== 'win32') {
      chmodSync(binPath, 0o755)
    }

    console.log(`[fetch-librespot] ready: ${binPath}`)
  } else {
    console.log(`[fetch-librespot] already have ${target} binary, skipping`)
  }

  if (platform === 'win32') {
    await fetchWindowsAudioDeps(destDir)
  }
}

const opts = parseArgs()

if (opts.all) {
  for (const target of Object.keys(ASSET_BY_TARGET)) {
    const [platform, arch] = target.split('-')
    await fetchOne(platform, arch)
  }
} else {
  await fetchOne(opts.platform, opts.arch)
}
