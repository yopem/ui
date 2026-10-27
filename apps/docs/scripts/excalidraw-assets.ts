import {
  constants,
  copyFileSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmdirSync,
  unlinkSync,
} from "node:fs"
import { createRequire } from "node:module"
import { dirname, isAbsolute, relative, resolve, sep } from "node:path"

import { interFontBySdkFile } from "./excalidraw-font-map"

const require = createRequire(import.meta.url)

const fontDirectory = resolve(
  dirname(require.resolve("@excalidraw/excalidraw")),
  "fonts",
)

const interPackageDirectory = dirname(
  require.resolve("@fontsource-variable/inter/package.json"),
)

const interFontDirectory = resolve(interPackageDirectory, "files")

const interLicense = resolve(interPackageDirectory, "LICENSE")

function lstatIfPresent(path: string) {
  try {
    return lstatSync(path)
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return undefined

    throw error
  }
}

function isInside(directory: string, path: string) {
  const pathFromDirectory = relative(directory, path)

  return (
    pathFromDirectory !== "" &&
    pathFromDirectory !== ".." &&
    !pathFromDirectory.startsWith(`..${sep}`) &&
    !isAbsolute(pathFromDirectory)
  )
}

function listFiles(directory: string, root = directory): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) =>
      left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
    )
    .flatMap((entry) => {
      const path = resolve(directory, entry.name)

      if (entry.isDirectory()) return listFiles(path, root)

      if (entry.isFile()) return [relative(root, path)]

      throw new Error(`Unsupported Excalidraw font asset: ${path}`)
    })
}

function ensureDirectory(path: string, createdDirectories: string[]) {
  const stats = lstatIfPresent(path)

  if (stats) {
    if (!stats.isDirectory() || stats.isSymbolicLink())
      throw new Error(`Unsafe Excalidraw asset directory: ${path}`)

    return
  }

  mkdirSync(path)
  createdDirectories.push(path)
}

function hasSafeDirectoryPath(directory: string, root: string) {
  let current = directory

  while (current !== root) {
    if (!isInside(root, current)) return false

    const stats = lstatIfPresent(current)

    if (!stats?.isDirectory() || stats.isSymbolicLink()) return false

    current = dirname(current)
  }

  const rootStats = lstatIfPresent(root)

  return !!rootStats?.isDirectory() && !rootStats.isSymbolicLink()
}

function removeCreatedAssets(
  publicRoot: string,
  createdFiles: { destination: string; source: string }[],
  createdDirectories: string[],
) {
  for (const file of createdFiles.reverse()) {
    const stats = lstatIfPresent(file.destination)

    if (
      hasSafeDirectoryPath(dirname(file.destination), publicRoot) &&
      stats?.isFile() &&
      !stats.isSymbolicLink() &&
      readFileSync(file.destination).equals(readFileSync(file.source))
    )
      unlinkSync(file.destination)
  }

  for (const directory of createdDirectories.reverse()) {
    const stats = lstatIfPresent(directory)

    if (
      hasSafeDirectoryPath(dirname(directory), publicRoot) &&
      stats?.isDirectory() &&
      !stats.isSymbolicLink() &&
      readdirSync(directory).length === 0
    )
      rmdirSync(directory)
  }
}

export function prepareExcalidrawAssets(publicDirectory: string) {
  const publicRoot = resolve(publicDirectory)
  const publicStats = lstatIfPresent(publicRoot)

  if (!publicStats?.isDirectory() || publicStats.isSymbolicLink())
    throw new Error(`Invalid docs public directory: ${publicRoot}`)

  const assetDirectory = resolve(publicRoot, "assets")
  const excalidrawDirectory = resolve(assetDirectory, "excalidraw")
  const outputFontDirectory = resolve(excalidrawDirectory, "fonts")

  const sdkFontFiles = listFiles(fontDirectory)

  const sdkNunitoFiles = sdkFontFiles.filter((file) =>
    file.startsWith(`Nunito${sep}`),
  )

  if (
    sdkNunitoFiles.length !== interFontBySdkFile.size ||
    sdkNunitoFiles.some((file) => !interFontBySdkFile.has(file))
  )
    throw new Error(`Unsupported Excalidraw Nunito font map: ${fontDirectory}`)

  const outputAssets = [
    ...sdkFontFiles.map((file) => {
      const interFile = interFontBySdkFile.get(file)

      return {
        file,
        source: interFile
          ? resolve(interFontDirectory, interFile)
          : resolve(fontDirectory, file),
      }
    }),
    { file: "Inter-OFL.txt", source: interLicense },
  ].sort((left, right) =>
    left.file < right.file ? -1 : left.file > right.file ? 1 : 0,
  )

  const existingFontDirectory = lstatIfPresent(outputFontDirectory)
  const createdFiles: { destination: string; source: string }[] = []
  const createdDirectories: string[] = []
  let cleaned = false

  function cleanup() {
    if (cleaned) return

    removeCreatedAssets(publicRoot, createdFiles, createdDirectories)
    cleaned = true
  }

  for (const path of [assetDirectory, excalidrawDirectory]) {
    if (!isInside(publicRoot, path))
      throw new Error(
        `Excalidraw asset path escapes docs public directory: ${path}`,
      )

    const stats = lstatIfPresent(path)

    if (stats && (!stats.isDirectory() || stats.isSymbolicLink()))
      throw new Error(`Unsafe Excalidraw asset directory: ${path}`)
  }

  if (existingFontDirectory) {
    if (
      !existingFontDirectory.isDirectory() ||
      existingFontDirectory.isSymbolicLink()
    )
      throw new Error(
        `Unsafe Excalidraw asset directory: ${outputFontDirectory}`,
      )

    const outputFiles = listFiles(outputFontDirectory)

    const matchesSource =
      outputFiles.length === outputAssets.length &&
      outputAssets.every(
        (asset, index) =>
          outputFiles[index] === asset.file &&
          readFileSync(resolve(outputFontDirectory, asset.file)).equals(
            readFileSync(asset.source),
          ),
      )

    if (!matchesSource)
      throw new Error(`Conflicting Excalidraw assets: ${outputFontDirectory}`)

    return cleanup
  }

  try {
    ensureDirectory(assetDirectory, createdDirectories)
    ensureDirectory(excalidrawDirectory, createdDirectories)
    ensureDirectory(outputFontDirectory, createdDirectories)

    for (const asset of outputAssets) {
      const { file, source } = asset
      const destination = resolve(outputFontDirectory, file)

      if (
        (!isInside(fontDirectory, source) &&
          !isInside(interPackageDirectory, source)) ||
        !isInside(outputFontDirectory, destination)
      )
        throw new Error(`Excalidraw font path escapes asset directory: ${file}`)

      const relativeDirectory = relative(
        outputFontDirectory,
        dirname(destination),
      )

      if (relativeDirectory) {
        let currentDirectory = outputFontDirectory

        for (const segment of relativeDirectory.split(sep)) {
          currentDirectory = resolve(currentDirectory, segment)
          ensureDirectory(currentDirectory, createdDirectories)
        }
      }

      copyFileSync(source, destination, constants.COPYFILE_EXCL)
      createdFiles.push({ destination, source })
    }
  } catch (error) {
    cleanup()
    throw error
  }

  return cleanup
}
