import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { writeFileSync } from "node:fs"

// This hook must pass Git credentials and disable nested Lefthook runs.
// oxlint-disable-next-line quality/no-environment-access
const env = { ...process.env, LEFTHOOK: "0" }

delete env.GIT_INDEX_FILE

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", env })
}

function createChangeset() {
  const commit = git("rev-parse", "HEAD").trim()
  const message = git("show", "-s", "--format=%B", commit).trim()
  const header = /^(\w+)(?:\([^\r\n]+\))?(!)?: .+/.exec(message.split("\n")[0])

  if (!header) return
  const breaking = header[2] || /^BREAKING[ -]CHANGE: /m.test(message)

  const bump =
    breaking || header[1] === "feat"
      ? "minor"
      : header[1] === "fix"
        ? "patch"
        : null

  if (!bump) return

  const files = git(
    "diff-tree",
    "--root",
    "--no-commit-id",
    "--name-only",
    "-r",
    "-z",
    commit,
  )
    .split("\0")
    .filter(Boolean)

  const manual = git(
    "diff-tree",
    "--root",
    "--no-commit-id",
    "--diff-filter=AM",
    "--name-only",
    "-r",
    "-z",
    commit,
  )
    .split("\0")
    .some(
      (file) =>
        file.startsWith(".changeset/") &&
        file.endsWith(".md") &&
        file !== ".changeset/README.md",
    )

  if (manual) return

  const manifests = new Set(
    git("ls-tree", "-r", "--name-only", "-z", commit, "--", "packages").split(
      "\0",
    ),
  )

  const directories = new Set(
    files.map((file) => /^packages\/[^/]+\//.exec(file)?.[0]).filter(Boolean),
  )

  const releases = []

  for (const directory of directories) {
    const manifest = `${directory}package.json`

    if (!manifests.has(manifest)) continue
    const pkg = JSON.parse(git("show", `${commit}:${manifest}`))

    if (pkg.private) continue
    assert.match(pkg.name, /\S/, `Missing package name: ${manifest}`)
    releases.push(`${JSON.stringify(pkg.name)}: ${bump}`)
  }

  if (!releases.length) return
  const path = `.changeset/commit-${commit}.md`
  writeFileSync(
    path,
    `---\n${releases.sort().join("\n")}\n---\n\n${message}\n`,
    { flag: "wx" },
  )
  git("add", "--", path)
  git(
    "commit",
    "--only",
    "-m",
    "ci(changesets): add commit release notes",
    "--",
    path,
  )
}

createChangeset()
