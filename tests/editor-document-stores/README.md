# Native PostgreSQL checks

These checks use TCP, verified TLS, and the `pg` driver. PGlite cannot run these
checks.

## Prerequisites

Install workspace dependencies with Bun. Install Node.js for the bundled Node
check.

Supply a running PostgreSQL server on `127.0.0.1`. Create the `editor_fixture`
role and the `postgres` database. The role must have permission to create
schemas. Use a test database with no production data.

Set `EDITOR_PG_FIXTURE` to an absolute directory with these files:

- `port`: PostgreSQL TCP port.
- `password`: generated test password for `editor_fixture`. Set file permissions
  to `0600`.
- `cluster/server.crt`: trusted PEM certificate with `127.0.0.1` in its subject
  alternative names.
- `cluster/server.key`: matching PEM private key. Set file permissions to
  `0600`.

The server must support TLS with this certificate. Keep fixture files outside
tracked source. The test also uses this certificate for an ephemeral HTTPS
server. It serves generated ES256 public keys through a local HTTP issuer. No
external authentication service is used.

## Run

Run these commands from the repository root. Use a different artifact path for
each runtime.

```sh
EDITOR_PG_FIXTURE=/absolute/private/fixture EDITOR_PG_ARTIFACT=/absolute/private/bun.json bun run test:postgres-native
EDITOR_PG_FIXTURE=/absolute/private/fixture EDITOR_PG_ARTIFACT=/absolute/private/node.json bun run test:postgres-native:node
```

Both commands must exit with status zero. Check that each artifact has
`status: "passed"` and `cleaned: true`. The artifact records backend PIDs,
PostgreSQL version, TLS version, runtime versions, and completed checks. It does
not contain passwords, tokens, or connection strings.

The Node command bundles owned TypeScript source with Bun. Node runs emitted
JavaScript with installed dependencies. It does not use native TypeScript
stripping. Ordinary unit collection does not run this integration entry.

Each run creates one random schema and applies the canonical migration with an
explicit transaction-local `search_path`. Each run drops only that schema,
closes its pools, and closes its HTTP servers. It does not stop PostgreSQL or
change server configuration.

The checks cover independent connections, CAS races, receipts, actor binding,
tombstones, generations, and signed64 revisions. HTTPS checks cover signed
authentication, policy, Origin, CSRF, expired credentials, and GET/PUT/DELETE.
Deadline checks block the event loop after actual driver responses and check
later SQL dispatch. They also check query and acquisition cancellation,
remaining query budgets, and subsequent pool use.

A COMMIT response can arrive after the deadline. The write can be durable
despite an uncertain result. Retry with unchanged input, precondition,
authentication provider, and user ID to resolve the receipt. Local TLS checks do
not prove deployed PostgreSQL or Hyperdrive behavior.
