# ISCE Auth Web — Project Instructions

> **Note:** The repository is named `isce-auth-mobile` for historical reasons, but this is the **web-based** authentication frontend — not a mobile app. Treat it as **isce-auth-web** in all documentation and discussions.

## Overview

**isce-auth-mobile** (a.k.a. **isce-auth-web**) is the centralised authentication frontend for the ISCE ecosystem. It provides sign-in, sign-up, OTP verification, password reset, and SSO flows. Users authenticate here and are redirected back to the appropriate ISCE product (Connect, Events, etc.) with tokens.

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Default branch:** `main`
- **Port:** 725 (dev, with Turbopack)
- **Auth provider:** Custom JWT via `isce-auth` backend
- **Package manager:** pnpm

---

## Architecture

```
app/
├── page.tsx                    # Landing / redirect
├── layout.tsx                  # Root layout
├── (auth)/                     # Auth group routes
│   ├── dashboard/              # Post-login dashboard
│   └── layout.tsx              # Auth layout wrapper
├── api/
│   ├── auth/
│   │   ├── set-token/          # Stores JWT in httpOnly cookies
│   │   ├── session/            # Session check endpoint
│   │   └── launch/             # SSO redirect launcher
│   ├── logout/                 # Logout handler
│   ├── sign-up/                # Sign-up API proxy
│   ├── request-verification-code/  # OTP request proxy
│   ├── verify-code/            # OTP verify proxy
│   └── upload/                 # File upload handler
├── sso/                        # SSO logout flow
└── site.webmanifest
components/
├── signincontext.tsx            # Desktop sign-in client component
├── signupcontext.tsx            # Desktop sign-up client component
├── forms/
│   ├── auth/
│   │   ├── desktop/            # Desktop auth forms
│   │   ├── mobile/             # Mobile auth forms
│   │   └── password-reset-modal.tsx
│   ├── sign-up/                # Mobile sign-up forms
│   └── password-reset-steps/
├── shared/                     # Shared UI components
└── ui/                         # shadcn/ui base components
lib/
├── auth-service.ts             # AuthService — API client for isce-auth backend
├── csrf.ts                     # Server-side CSRF utilities
├── csrf-client.ts              # Client-side csrfFetch() wrapper
├── safe-redirect.ts            # Open redirect prevention
├── verify-jwt.ts               # JWT verification (if exists)
└── utils.ts                    # General utilities
proxy.ts                        # CSRF validation proxy (Next.js 16 — replaces middleware.ts)
routes.ts                       # Route definitions (public, auth, protected)
```

---

## Security Practices (MANDATORY)

### 1. CSRF Protection

- **Proxy** (`proxy.ts`) validates CSRF on all state-changing requests to `/api/*` routes.
- **Server-side** (`lib/csrf.ts`): `validateCsrf()` checks `X-CSRF-Token` header matches `csrf_token` cookie. `setCsrfCookie()` sets new 32-byte hex tokens.
- **Client-side** (`lib/csrf-client.ts`): `csrfFetch()` wrapper auto-attaches `X-CSRF-Token` header on POST/PUT/PATCH/DELETE.
- **Exempt path:** `/api/auth/set-token` (called during same-origin redirect flows).
- **Rule:** All client components making POST/PUT/PATCH/DELETE calls must use `csrfFetch()` from `@/lib/csrf-client`, never raw `fetch()`.

### 2. Safe Redirects

- `lib/safe-redirect.ts` validates all redirect URLs to prevent open redirect attacks.
- All callback URLs are validated before redirecting.
- Only same-origin or explicitly allowlisted URLs are permitted.
- SSO flows use `getSafeRedirect()` to sanitise `redirect` query parameters.

### 3. Token Storage

- Access and refresh tokens are stored in **httpOnly cookies** via the `/api/auth/set-token` server route.
- Tokens are **never stored in localStorage or sessionStorage**.
- Tokens are **never exposed to client-side JavaScript** after the initial auth flow.
- The `/api/auth/launch` route handles SSO redirects server-side to avoid token exposure.

### 4. Input Validation

- All forms use `react-hook-form` with `zod` schemas for client-side validation.
- Server-side API routes validate input before proxying to `isce-auth`.

### 5. Password Security

- Password strength requirements are enforced client-side (8+ chars, uppercase, lowercase, number).
- Passwords are only sent over HTTPS to the `isce-auth` backend.
- Never log or display passwords.

---

## Auth Flow

### Sign-In

1. User submits credentials → `AuthService.signIn()` calls `isce-auth` backend
2. On success → `csrfFetch('/api/auth/set-token')` stores tokens in httpOnly cookies
3. Redirect to callback URL via `/api/auth/launch` or `/dashboard`

### Sign-Up

1. Multi-step form: account type → user details → password → OTP verification
2. OTP sent via `/api/request-verification-code` → verified via `/api/verify-code`
3. On verification → auto sign-in → same token storage flow as sign-in

### SSO (Cross-Product Auth)

1. Product redirects to `isce-auth-mobile` with `redirect_uri` + `prompt=login`
2. User authenticates
3. Redirected back with tokens via `/api/auth/launch`

---

## Coding Conventions

1. **"use client"** — mark all interactive components. Server components are the default.
2. **csrfFetch()** — use for all client-side API calls (POST/PUT/PATCH/DELETE). Import from `@/lib/csrf-client`.
3. **AuthService** — centralised API client for `isce-auth` backend. All auth API calls go through this service.
4. **Zod schemas** — all form validation uses zod schemas in `schemas/` directory.
5. **No raw fetch()** — client components must use `csrfFetch()` for state-changing requests.
6. **Safe redirects** — always use `getSafeRedirect()` for redirect URLs.
7. **Toast notifications** — use `sonner` for user feedback.

---

## Environment Variables

| Variable                                | Purpose                                             |
| --------------------------------------- | --------------------------------------------------- |
| `AUTH_API_URL`                          | Base URL of the isce-auth backend (server-side)     |
| `NEXT_PUBLIC_AUTH_API_URL`              | Base URL of the isce-auth backend (client)          |
| `NEXT_PUBLIC_URL`                       | This app's public URL (also used for metadata/SEO)  |
| `NEXT_PUBLIC_ALLOWED_APP_ORIGINS`       | Comma-separated allowed redirect origins for SSO    |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`       | Google Maps API key                                 |
| `NODE_ENV`                              | `development` / `production`                        |
| `ACCESS_KEY_ID`                         | S3-compatible storage access key                    |
| `SECRET_KEY`                            | S3-compatible storage secret key                    |
| `S3_ENDPOINT`                           | S3-compatible storage endpoint                      |

---

## Commands

```bash
pnpm install            # Install dependencies
pnpm run dev            # Start dev server (port 725, Turbopack)
pnpm run build          # Production build
pnpm run lint           # Run ESLint
```
