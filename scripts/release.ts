import { appendFile, readFile, writeFile } from "node:fs/promises"

const packages = ["cli", "oxlint-plugin"]

const dryRun = process.argv.includes("--dry-run")

if (process.env.CHANGESETS_OUTPUT) {
  await writeFile(process.env.CHANGESETS_OUTPUT, "")
}

for (const name of packages) {
  const cwd = new URL(`../packages/${name}/`, import.meta.url).pathname

  // SAFETY: Checked-in workspace manifests provide `name` and `version`.
  const manifest = JSON.parse(
    await readFile(`${cwd}/package.json`, "utf8"),
  ) as {
    name: string
    version: string
  }

  if (!dryRun) {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(manifest.name)}/${manifest.version}`,
    )

    if (response.ok) {
      console.info(`${manifest.name}@${manifest.version} already published`)
      continue
    }

    if (response.status !== 404) {
      throw new Error(`npm registry returned ${response.status}`)
    }
  }

  const command = dryRun
    ? ["bun", "pm", "pack", "--dry-run"]
    : ["bun", "publish", "--tolerate-republish"]

  const publish = Bun.spawn(command, {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  })

  if ((await publish.exited) !== 0) {
    throw new Error(`Failed to publish ${manifest.name}`)
  }

  if (dryRun) {
    console.info(`Packed ${manifest.name}`)
    continue
  }

  const tag = `${manifest.name}@${manifest.version}`

  const git = Bun.spawn(["git", "tag", "-a", tag, "-m", tag], {
    stdout: "inherit",
    stderr: "inherit",
  })

  if ((await git.exited) !== 0) throw new Error(`Failed to tag ${tag}`)

  if (process.env.CHANGESETS_OUTPUT) {
    await appendFile(
      process.env.CHANGESETS_OUTPUT,
      `${JSON.stringify({ type: "git-tag", tag, packageName: manifest.name })}\n`,
    )
  }
}
