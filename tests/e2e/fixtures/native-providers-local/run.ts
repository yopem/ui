import { spawn } from "node:child_process"
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises"
import { homedir, tmpdir } from "node:os"
import { join, resolve } from "node:path"

import {
  startNativeProviderFixture,
  type NativeProviderFixture,
} from "./server"

const repositoryRoot = resolve(import.meta.dirname, "../../../..")

const fixtureDirectory = join(tmpdir(), "yopem-native-provider-local-")

const trustName = "Yopem native provider local acceptance"

const playwrightTimeoutMs = 180_000

const cleanupTimeoutMs = 5000

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolveCommand, rejectCommand) => {
    const child = spawn(command, args, { stdio: "ignore" })

    child.once("error", () =>
      rejectCommand(new Error(`Required command is unavailable: ${command}`)),
    )
    child.once("exit", (code) => {
      if (code === 0) resolveCommand()
      else rejectCommand(new Error(`Required command failed: ${command}`))
    })
  })
}

function wait(timeoutMs: number) {
  return new Promise<void>((resolveWait) => {
    const timer = setTimeout(resolveWait, timeoutMs)
    timer.unref()
  })
}

function killProcessTree(
  child: ReturnType<typeof spawn>,
  signal: NodeJS.Signals,
) {
  if (process.platform !== "win32" && child.pid) {
    try {
      process.kill(-child.pid, signal)
    } catch {
      child.kill(signal)
    }

    return
  }

  child.kill(signal)
}

async function runPlaywright(environment: NodeJS.ProcessEnv) {
  const command = resolve(repositoryRoot, "node_modules/.bin/playwright")

  const config = resolve(
    repositoryRoot,
    "tests/e2e/fixtures/native-providers-local/playwright.config.ts",
  )

  const child = spawn(
    command,
    [
      "test",
      "tests/e2e/docs/editor-native-providers.spec.ts",
      `--config=${config}`,
      "--project=chromium",
    ],
    {
      cwd: repositoryRoot,
      env: environment,
      stdio: "inherit",
      detached: process.platform !== "win32",
    },
  )

  const completion = new Promise<number>((resolveExit, rejectExit) => {
    child.once("error", rejectExit)
    child.once("exit", (code) => resolveExit(code ?? 1))
  })

  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    const result = await Promise.race([
      completion,
      new Promise<undefined>((resolveTimeout) => {
        timer = setTimeout(() => resolveTimeout(undefined), playwrightTimeoutMs)
      }),
    ])

    if (result !== undefined) return result

    killProcessTree(child, "SIGTERM")

    const stopped = await Promise.race([
      completion.then(() => true),
      wait(cleanupTimeoutMs).then(() => false),
    ])

    if (!stopped) {
      killProcessTree(child, "SIGKILL")

      const killed = await Promise.race([
        completion.then(() => true),
        wait(1000).then(() => false),
      ])

      if (!killed)
        throw new Error("Playwright process group did not exit after SIGKILL")
    }

    return 124
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function createLocalCertificateFiles(directory: string) {
  const caKey = join(directory, "ca.key")
  const caCertificate = join(directory, "ca.crt")
  const leafKey = join(directory, "localhost.key")
  const leafRequest = join(directory, "localhost.csr")
  const leafCertificate = join(directory, "localhost.crt")
  const extensions = join(directory, "localhost.ext")

  await writeFile(
    extensions,
    "basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=DNS:localhost,IP:127.0.0.1\n",
    { mode: 0o600 },
  )
  await runCommand("openssl", [
    "req",
    "-x509",
    "-newkey",
    "rsa:3072",
    "-nodes",
    "-days",
    "2",
    "-sha256",
    "-keyout",
    caKey,
    "-out",
    caCertificate,
    "-subj",
    "/CN=Yopem native provider local acceptance CA",
    "-addext",
    "basicConstraints=critical,CA:TRUE",
    "-addext",
    "keyUsage=critical,keyCertSign,cRLSign",
  ])
  await runCommand("openssl", [
    "req",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    leafKey,
    "-out",
    leafRequest,
    "-subj",
    "/CN=localhost",
  ])
  await runCommand("openssl", [
    "x509",
    "-req",
    "-in",
    leafRequest,
    "-CA",
    caCertificate,
    "-CAkey",
    caKey,
    "-CAcreateserial",
    "-out",
    leafCertificate,
    "-days",
    "2",
    "-sha256",
    "-extfile",
    extensions,
  ])
  await Promise.all([chmod(caKey, 0o600), chmod(leafKey, 0o600)])

  return { caCertificate, leafCertificate, leafKey }
}

async function requireBuiltDocsServer() {
  try {
    const response = await fetch("http://127.0.0.1:3100/components", {
      signal: AbortSignal.timeout(3000),
    })

    await response.body?.cancel()

    if (!response.ok) throw new Error("unavailable")
  } catch {
    throw new Error(
      "Built docs must already be reachable at http://127.0.0.1:3100. This fixture does not start or move that server.",
    )
  }
}

async function removeIsolatedTrust(
  nssDatabase: string,
  runtimeDirectory: string,
  trustInstalled: boolean,
) {
  if (trustInstalled) {
    try {
      await runCommand("certutil", [
        "-D",
        "-d",
        `sql:${nssDatabase}`,
        "-n",
        trustName,
      ])
    } catch {
      process.stderr.write("Could not remove isolated NSS trust entry.\n")
    }
  }

  await rm(runtimeDirectory, { recursive: true, force: true })
}

async function main() {
  const runtimeDirectory = await mkdtemp(fixtureDirectory)
  const isolatedHome = join(runtimeDirectory, "home")
  const tlsDirectory = join(runtimeDirectory, "tls")
  const nssDatabase = join(isolatedHome, ".pki", "nssdb")
  let fixture: NativeProviderFixture | undefined
  let trustInstalled = false
  let exitCode = 1

  try {
    await Promise.all([
      mkdir(isolatedHome, { recursive: true, mode: 0o700 }),
      mkdir(tlsDirectory, { recursive: true, mode: 0o700 }),
      mkdir(nssDatabase, { recursive: true, mode: 0o700 }),
    ])
    const certificates = await createLocalCertificateFiles(tlsDirectory)

    await runCommand("certutil", [
      "-N",
      "-d",
      `sql:${nssDatabase}`,
      "--empty-password",
    ])
    await runCommand("certutil", [
      "-A",
      "-d",
      `sql:${nssDatabase}`,
      "-n",
      trustName,
      "-t",
      "C,,",
      "-i",
      certificates.caCertificate,
    ])
    trustInstalled = true
    await requireBuiltDocsServer()
    fixture = await startNativeProviderFixture(
      await readFile(certificates.leafCertificate),
      await readFile(certificates.leafKey),
    )

    const originalHome = process.env.HOME ?? homedir()

    const environment: NodeJS.ProcessEnv = {
      ...process.env,
      ...fixture.environment,
      HOME: isolatedHome,
      XDG_CONFIG_HOME: join(isolatedHome, ".config"),
      XDG_CACHE_HOME: join(isolatedHome, ".cache"),
      PLAYWRIGHT_BROWSERS_PATH:
        process.env.PLAYWRIGHT_BROWSERS_PATH ??
        join(originalHome, ".cache", "ms-playwright"),
    }

    exitCode = await runPlaywright(environment)
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Native provider fixture failed."}\n`,
    )
  } finally {
    try {
      await fixture?.close()
    } catch {
      process.stderr.write("Native provider fixture cleanup failed.\n")
      exitCode = 1
    }

    await removeIsolatedTrust(nssDatabase, runtimeDirectory, trustInstalled)
  }

  process.exitCode = exitCode
}

await main()
