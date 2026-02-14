# Skill: ISCE Auth Mobile — Security & Frontend Practices

## Description

This skill defines the mandatory security patterns, architectural rules, and coding practices for the **isce-auth-mobile** Next.js frontend — the centralised auth UI for the ISCE ecosystem.

---

## Security Rules

### CSRF Protection (Double Submit Cookie)

- **Middleware** (`middleware.ts`) runs on every request. It validates CSRF tokens on state-changing requests and sets `csrf_token` cookies on all responses.
- **Server-side** (`lib/csrf.ts`):
    - `setCsrfCookie(response)` — generates a 32-byte hex token, sets `csrf_token` cookie (non-httpOnly, `sameSite: lax`, 24h expiry).
    - `validateCsrf(request)` — compares `X-CSRF-Token` header with `csrf_token` cookie on POST/PUT/PATCH/DELETE to `/api/*` routes.
    - **Exempt paths:** `/api/auth/set-token`
- **Client-side** (`lib/csrf-client.ts`):
    - `getCsrfToken()` — reads token from `document.cookie`.
    - `csrfFetch(input, init)` — drop-in replacement for `fetch()` that auto-attaches `X-CSRF-Token` on POST/PUT/PATCH/DELETE.

#### CSRF Rules for Developers:

1. **All client components** making POST/PUT/PATCH/DELETE calls **must** use `csrfFetch()` from `@/lib/csrf-client`.
2. **Never use raw `fetch()`** for state-changing requests in client components.
3. **Server-side API routes** (in `app/api/`) do not need `csrfFetch` — they make server-to-server calls.
4. When creating a **new API route** that accepts POST/PUT/PATCH/DELETE, CSRF is validated automatically by the middleware. Only add to exempt paths if the route must accept requests without a CSRF token (rare).

### Open Redirect Prevention

- `lib/safe-redirect.ts` provides `getSafeRedirect(url)` — validates redirect URLs.
- **Always call `getSafeRedirect()`** before using any redirect URL from query params, form data, or session storage.
- Never construct redirect URLs by concatenating user input without validation.
- Only same-origin or explicitly allowlisted URLs are permitted.

### Token Security

- Access and refresh tokens are stored in **httpOnly cookies** only.
- The `/api/auth/set-token` route accepts tokens from the client (after auth) and stores them as httpOnly cookies.
- The `/api/auth/launch` route redirects to external URLs using server-side token injection, avoiding client-side token exposure.
- **Never store tokens in `localStorage`, `sessionStorage`, or non-httpOnly cookies.**
- **Never log tokens or include them in URLs visible to users.**

### Input Validation

- All forms use `react-hook-form` with `zod` schemas for validation.
- Schemas are defined in `schemas/` directory.
- **Always validate user input** both client-side (zod) and server-side (in API routes).
- OTP codes must be validated for length and format before submission.

---

## Architecture Rules

### Component Structure

```
components/
├── <feature>context.tsx        # Client context/page component
├── forms/
│   ├── auth/
│   │   ├── desktop/           # Desktop-specific form components
│   │   └── mobile/            # Mobile-specific form components
│   └── <feature>/             # Feature-specific forms
├── shared/                    # Reusable shared components
└── ui/                        # shadcn/ui base components
```

### API Routes

```
app/api/
├── auth/
│   ├── set-token/route.ts     # Token → httpOnly cookie
│   ├── session/route.ts       # Session check
│   └── launch/route.ts        # SSO redirect
├── logout/route.ts            # Logout handler
├── sign-up/route.ts           # Proxied signup
├── request-verification-code/ # OTP request proxy
├── verify-code/               # OTP verify proxy
└── upload/                    # File upload
```

- API routes proxy requests to the `isce-auth` backend.
- They add auth headers, validate input, and handle errors before forwarding.
- **API routes make server-to-server calls** — they do not need `csrfFetch`.

### Auth Service

- `lib/auth-service.ts` (`AuthService`) is the centralised client for `isce-auth` backend.
- All auth operations (sign-in, sign-up, OTP, password reset) go through this service.
- The service handles error responses and returns typed results.

### Routes Configuration

- `routes.ts` defines public, auth, and protected route patterns.
- The middleware uses these to determine access control.

---

## Coding Standards

1. **"use client"** directive — required on all interactive components. Server components by default.
2. **csrfFetch()** — mandatory for all client-side POST/PUT/PATCH/DELETE calls.
3. **Zod schemas** — all form validation uses zod.
4. **Sonner toast** — use `toast.success()`, `toast.error()` for user feedback.
5. **No `any`** types — use proper TypeScript types.
6. **Safe redirects** — always use `getSafeRedirect()` for redirect URLs from user input.
7. **Error boundaries** — wrap async operations in try/catch with proper error toast messages.
8. **Loading states** — all forms must have loading/disabled states during async operations.
9. **Ref guards** — use `useRef` flags to prevent duplicate API calls (e.g., OTP double-submit).

---

## Testing Checklist

Before merging any PR:

- [ ] Client components use `csrfFetch()` for all POST/PUT/PATCH/DELETE calls
- [ ] Redirect URLs pass through `getSafeRedirect()`
- [ ] Tokens are never stored in localStorage/sessionStorage
- [ ] Forms have proper zod validation schemas
- [ ] Loading states prevent duplicate submissions
- [ ] Error messages are user-friendly (no raw error objects)
- [ ] New API routes handle errors gracefully
