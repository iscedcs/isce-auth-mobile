import type { NextConfig } from "next";


function domain(url?: string) { 
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

const API_DOMAINS = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_LIVE_ISCEAUTH_BACKEND_URL,
  process.env.NEXT_PUBLIC_URL,
  process.env.NEXT_PUBLIC_ALLOWED_APP_ORIGINS,
].map(domain).filter(Boolean).join(" ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
        port: "",
      },
    ],
    domains: [
      "encrypted-tbn0.gstatic.com",
      "isce-image-uploader.s3.us-east-1.amazonaws.com",
      "isce-image.fra1.digitaloceanspaces.com",
      "i.ytimg.com",
      "hebbkx1anhila5yf.public.blob.vercel-storage.com",
      "flagcdn.com",
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(self), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://*.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              `connect-src 'self' ${API_DOMAINS} https://*.googleapis.com https://*.google.com https://*.sanity.io https://*.amazonaws.com https://*.digitaloceanspaces.com https://*.vercel-storage.com https://flagcdn.com"`,
              "frame-src 'self' https://*.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
