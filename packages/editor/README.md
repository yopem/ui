# Yopem UI editor

## Server authentication

This private workspace supplies server helpers for existing OpenAuth and Better
Auth services. It does not create accounts, login routes, or a session database.

Use the server-only workspace entry:

```ts
import { createOpenAuthAuthentication } from "@yopem-ui/editor/server"

export function authenticationFor(audience: string) {
  return createOpenAuthAuthentication({ audience })
}
```

OpenAuth defaults to https://auth.yopem.com. Set an explicit accepted audience.
The adapter checks ES256 signatures, issuer, audience, expiry, and user
subjects. Identity uses properties.id, not the mutable subject hash.

Pass the host session getter to createBetterAuthAuthentication for Better Auth.
The adapter disables cookie caching. The host controls storage and cookie
refresh.

Call authorizeEditorRequest with a separate document policy. Only an explicit
true result grants access. Invalid identity returns 401. Denial returns 403.
Unavailable authentication or policy returns 503.

Check route origins and CSRF tokens separately. Keep tokens out of URLs and
logs. JWT verification does not guarantee immediate revocation. These helpers do
not deploy AI, upload, persistence, or collaboration services.

All editor tests live under the repository's root tests/ directory.
