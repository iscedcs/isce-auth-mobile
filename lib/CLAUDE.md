# STRICT — auth libs (`csrf`, `jwt`, `safe-redirect`, `auth-flow`, `auth-service`, `signup-draft`)

**STRICT**: do not change public interfaces, security behaviour or data handling without stating the change and the reason in the plan / PR description.

- `safe-redirect.ts`: exact-origin allowlist only (scheme+host+port). No prefix/suffix/wildcard matching; non-http(s) origins rejected. Adding an app origin = a reviewed change to `PRODUCTS`/`BUSINESS_URL`/env.
- `csrf.ts` / `csrf-client.ts`: double-submit cookie. Don't relax validation for any state-changing method.
- `jwt.ts`: decode/verify helpers — verification must pin algorithms; never trust an unverified payload for authorization.
- Session cookies are HttpOnly, `secure` in production, `sameSite: lax`; keep those flags.
- `signup-draft.ts` must not persist passwords or OTPs.
- Never log credentials, OTPs or tokens.
