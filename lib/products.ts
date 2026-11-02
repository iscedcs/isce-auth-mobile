// lib/products.ts

/**
 * Which deployment this build serves.
 *
 * Test and local show every product, including the ones that have not
 * launched yet; production shows only the ones that are live. It is derived
 * from this app's own public URL, so the test stack needs no extra
 * configuration — isce-infra builds it with
 * NEXT_PUBLIC_URL=https://test-auth.isce.app — and NEXT_PUBLIC_APP_ENV is an
 * explicit override. Anything unrecognised counts as production, so a
 * misconfigured build shows fewer products rather than more.
 */
export type AppEnv = "local" | "test" | "production";

export function getAppEnv(): AppEnv {
  const override = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase();
  if (
    override === "local" ||
    override === "test" ||
    override === "production"
  ) {
    return override;
  }

  let host: string;
  try {
    host = new URL(process.env.NEXT_PUBLIC_URL ?? "").hostname.toLowerCase();
  } catch {
    return "production";
  }

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".localhost")
  ) {
    return "local";
  }
  if (host.startsWith("test-")) return "test";
  return "production";
}

export const APP_ENV: AppEnv = getAppEnv();

export interface Product {
  id: string;
  name: string;
  url: string;
  icon: string;
  active: boolean;
}

/**
 * Every product, with where it lives in each environment and which
 * environments show it. Test hostnames are the ones isce-infra's nginx map
 * serves (nginx/conf.d/default.conf); local ports match the compose stack.
 *
 * These URLs are also the origins /api/auth/launch will hand an auth code to
 * (see getAllowedAppOrigins in lib/safe-redirect.ts), so a product that is
 * hidden in production is not a launch target there either.
 */
const CATALOGUE: {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  shownIn: AppEnv[];
  urls: Record<AppEnv, string>;
}[] = [
  {
    id: "gada",
    name: "Gada",
    icon: "calendar",
    active: true,
    shownIn: ["local", "test", "production"],
    urls: {
      local: "http://localhost:3323",
      test: "https://test-events.isce.app",
      production: "https://gada.isce.tech",
    },
  },
  {
    id: "connect",
    name: "LYNCON",
    url: "https://isce.app/dashboard",
    // url: "http://localhost:3154",
    icon: "contact",
    active: true,
    shownIn: ["local", "test", "production"],
    urls: {
      local: "http://localhost:3154",
      test: "https://test-connect.isce.app",
      production: "https://isce.app/dashboard",
    },
  },
  {
    id: "store",
    name: "LYDYA",
    icon: "shopping-bag",
    active: true,
    // Not launched — visible on test and local only.
    shownIn: ["local", "test"],
    urls: {
      local: "http://localhost:7867",
      test: "https://test-lydya.isce.app",
      production: "https://lydya.isce.app",
    },
  },
  {
    id: "wallet",
    name: "Fiscus Wallet",
    icon: "wallet",
    active: true,
    // Deployed but not launched — visible on test and local only.
    shownIn: ["local", "test"],
    urls: {
      local: "http://localhost:3004",
      test: "https://test-wallet.isce.app",
      production: "https://wallet.isce.app",
    },
  },
];

export const PRODUCTS: Product[] = CATALOGUE.filter((product) =>
  product.shownIn.includes(APP_ENV),
).map(({ id, name, icon, active, urls }) => ({
  id,
  name,
  icon,
  active,
  url: urls[APP_ENV],
}));
