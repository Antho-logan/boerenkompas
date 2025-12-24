import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

/**
 * Log safe environment diagnostics at dev startup.
 * Never logs secrets - only hosts, lengths, and presence indicators.
 */
function logEnvStartupInfo() {
  if (process.env.NODE_ENV !== "development") return;

  const cwd = process.cwd();
  const envLocalPath = join(cwd, ".env.local");
  const packageJsonPath = join(cwd, "package.json");
  
  // Try to peek at process.env (loaded by Next.js)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let host = "(missing)";
  try {
    if (url) host = new URL(url).host;
  } catch {
    host = "(invalid url)";
  }

  // Safe key info (no secrets)
  let keyInfo = "MISSING";
  if (anonKey) {
    const dots = (anonKey.match(/\./g) || []).length;
    keyInfo = `Present (len=${anonKey.length}, dots=${dots})`;
  }

  console.log("\n┌─────────────────────────────────────────────────────────────┐");
  console.log("│              BoerenKompas Dev Startup                       │");
  console.log("├─────────────────────────────────────────────────────────────┤");
  console.log(`│ CWD:              ${cwd.slice(-40).padEnd(40)} │`);
  console.log(`│ package.json:     ${(existsSync(packageJsonPath) ? "✓ EXISTS" : "✗ MISSING").padEnd(40)} │`);
  console.log(`│ .env.local:       ${(existsSync(envLocalPath) ? "✓ EXISTS" : "✗ MISSING").padEnd(40)} │`);
  console.log("├─────────────────────────────────────────────────────────────┤");
  console.log(`│ Supabase Host:    ${host.slice(0, 40).padEnd(40)} │`);
  console.log(`│ Anon Key:         ${keyInfo.slice(0, 40).padEnd(40)} │`);
  console.log("└─────────────────────────────────────────────────────────────┘\n");
}

logEnvStartupInfo();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Fix Turbopack workspace root inference issue
  // This prevents Next.js from using a stray package-lock.json in a parent directory
  turbopack: {
    root: resolve(__dirname),
  },
};

export default nextConfig;
