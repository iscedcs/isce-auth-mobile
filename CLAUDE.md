# isce-auth-mobile — LYNCON/ISCE sign-in, sign-up & SSO UI

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · axios · zod + react-hook-form. Package manager **pnpm**. Dev: `pnpm dev` → http://localhost:725.
Front door for the ecosystem: it talks to the `../isce-auth` identity service, sets HttpOnly session cookies, and redirects users into `../connect-web` and other apps via SSO. It issues no tokens itself.

## Working agreement
1. Read the nearest `CLAUDE.md` before editing in a folder; module files override this one.
2. Spec first — features are specced in `docs/specs/<feature>.md` and reviewed before code.
3. **Never commit or push.** Provide a proposed commit message at the end; include the harness attribution line.
4. `app/api/**`, `lib/` (csrf, jwt, safe-redirect, auth-flow, auth-service) and `app/sso/**` are **STRICT** (see their files).

## Commands
`pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm tsc --noEmit`.

## Rules
- Pages under `app/(auth)/**`: sign-in, sign-up/signup, register, forgot/reset-password, dashboard, superadmin; `manage-account`; `sso/logout`.
- All state-changing requests carry the CSRF double-submit header (`proxy.ts`); keep it.
- Any redirect target (`redirect`, `next`, SSO return URL) must pass `lib/safe-redirect.ts` (exact-origin allowlist). Never redirect to a raw query param.
- Business (Connect Plus) sign-in launches `BUSINESS_URL` from `lib/const.tsx`; product launch targets come from `lib/products.ts`.
- No secrets in `NEXT_PUBLIC_*`. No logging of passwords, OTPs or tokens (use `lib/auth-logger.ts`, which must stay redaction-safe).
