import type { NextConfig } from "next";
const config: NextConfig = {
  serverExternalPackages: ["@libsql/client", "pdfkit"],
  outputFileTracingIncludes: {
    "/api/report": ["./public/fonts/**"],
    "/api/generate-pdf": ["./public/fonts/**"],
    "/api/send-pdf-email": ["./public/fonts/**"],
    "/api/cases/*/pdf": ["./public/fonts/**"],
  },
  async headers() {
    const frames = (process.env.EMBED_ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(s));
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors 'self' ${frames.join(" ")}`,
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};
export default config;
