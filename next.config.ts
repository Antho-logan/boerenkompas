import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";

function logEnvStartupInfo() {
  if (process.env.NODE_ENV !== "development") return;

  const cwd = process.cwd();
  const envLocalPath = join(cwd, ".env.local");
  
  // Try to peek at process.env (loaded by Next.js)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let host = "(missing)";
  try {
    if (url) host = new URL(url).host;
  } catch {
    host = "(invalid url)";
  }

  console.log("\n--- BoerenKompas Dev Startup ---");
  console.log("Root (cwd):", cwd);
  console.log(".env.local path:", envLocalPath);
  console.log(".env.local exists:", existsSync(envLocalPath) ? "YES" : "NO");
  console.log("Loaded Supabase Host:", host);
  console.log("Loaded Anon Key:", anonKey ? `Present (len=${anonKey.length})` : "MISSING");
  console.log("--------------------------------\n");
}

logEnvStartupInfo();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fix for potential workspace/lockfile issues
  experimental: {
    // Force Next.js to respect the current directory as root for lockfile resolution if possible
    // (There isn't a direct 'lockfileRoot' config, but limiting search can help)
  },
};

export default nextConfig;