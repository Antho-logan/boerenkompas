#!/usr/bin/env node
/**
 * BoerenKompas Environment Doctor
 * 
 * Validates .env.local configuration without exposing secrets.
 * Run: npm run doctor:env
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envLocalPath = path.join(rootDir, '.env.local');
const packageJsonPath = path.join(rootDir, 'package.json');

// ANSI colors for terminal output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function safe(label, value) {
  if (!value) return `${RED}MISSING${RESET}`;
  const len = value.length;
  const first6 = value.slice(0, 6);
  const last6 = value.slice(-6);
  const dots = (value.match(/\./g) || []).length;
  return `len=${len}, first6="${first6}", last6="${last6}", dots=${dots}`;
}

function isPlaceholderUrl(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('your-project-id') ||
    lower.includes('jouw-project-id') ||
    lower.includes('project-ref') ||
    lower.includes('placeholder') ||
    lower.includes('example') ||
    lower.includes('xxx') ||
    lower === 'https://.supabase.co' ||
    // Detect empty project ref: https://.supabase.co
    /https:\/\/\.?supabase\.co/i.test(lower)
  );
}

function isPlaceholderKey(key) {
  if (!key) return false;
  const lower = key.toLowerCase();
  // Real anon keys are JWTs with 3 parts, typically 200+ chars
  // Placeholder detection:
  return (
    lower === 'your-anon-key' ||
    lower === 'jouw_anon_public_key' ||
    lower.includes('placeholder') ||
    lower.includes('your_') ||
    lower.includes('your-') ||
    key.length < 50  // Real JWTs are much longer
  );
}

function looksLikeValidSupabaseUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    // Must be https and end with .supabase.co
    if (parsed.protocol !== 'https:') return false;
    if (!parsed.host.endsWith('.supabase.co')) return false;
    // Must have a project ref before .supabase.co
    const parts = parsed.host.split('.');
    if (parts.length < 3) return false;
    const projectRef = parts[0];
    // Project refs are typically alphanumeric, 20+ chars
    if (projectRef.length < 10) return false;
    return true;
  } catch {
    return false;
  }
}

function looksLikeValidAnonKey(key) {
  if (!key) return false;
  // Supabase anon keys are JWTs: header.payload.signature
  const parts = key.split('.');
  if (parts.length !== 3) return false;
  // Each part should be base64url encoded
  // Total length is typically 200-300 chars
  if (key.length < 100) return false;
  return true;
}

function checkParentEnvFiles() {
  const warnings = [];
  let dir = path.dirname(rootDir);
  const checked = [];
  
  while (dir !== '/' && dir !== path.dirname(dir)) {
    const envLocal = path.join(dir, '.env.local');
    const envFile = path.join(dir, '.env');
    const packageLock = path.join(dir, 'package-lock.json');
    
    if (fs.existsSync(envLocal)) {
      warnings.push(`⚠️  Found .env.local in parent: ${envLocal}`);
    }
    if (fs.existsSync(envFile)) {
      warnings.push(`⚠️  Found .env in parent: ${envFile}`);
    }
    if (fs.existsSync(packageLock)) {
      warnings.push(`⚠️  Found package-lock.json in parent: ${packageLock}`);
      warnings.push(`   This may cause Next.js to infer wrong workspace root!`);
    }
    
    checked.push(dir);
    dir = path.dirname(dir);
    
    // Only check up to 5 levels
    if (checked.length > 5) break;
  }
  
  return warnings;
}

console.log(`\n${BOLD}${CYAN}🏥 BoerenKompas Environment Doctor${RESET}`);
console.log('='.repeat(50));

// 1. Confirm working directory and paths
console.log(`\n${BOLD}1. Project Paths${RESET}`);
console.log(`   cwd:              ${process.cwd()}`);
console.log(`   Script root:      ${rootDir}`);
console.log(`   package.json:     ${packageJsonPath}`);
console.log(`   .env.local path:  ${envLocalPath}`);

// Verify package.json exists (confirms we're in the right directory)
if (!fs.existsSync(packageJsonPath)) {
  console.error(`\n${RED}❌ ERROR: package.json not found at expected location!${RESET}`);
  console.error(`   Expected: ${packageJsonPath}`);
  console.error(`   This script must be run from the project root.`);
  process.exit(1);
}
console.log(`   package.json:     ${GREEN}EXISTS${RESET}`);

// 2. Check for parent directory issues
console.log(`\n${BOLD}2. Parent Directory Check${RESET}`);
const parentWarnings = checkParentEnvFiles();
if (parentWarnings.length > 0) {
  parentWarnings.forEach(w => console.log(`   ${YELLOW}${w}${RESET}`));
  console.log(`   ${YELLOW}Consider removing stray files to avoid workspace confusion.${RESET}`);
} else {
  console.log(`   ${GREEN}✓ No conflicting env/lock files in parent directories${RESET}`);
}

// 3. Check .env.local existence
console.log(`\n${BOLD}3. Environment File${RESET}`);
if (!fs.existsSync(envLocalPath)) {
  console.error(`   ${RED}❌ .env.local NOT FOUND${RESET}`);
  console.error(`\n   Create ${envLocalPath} with:`);
  console.error(`   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co`);
  console.error(`   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY`);
  process.exit(1);
}
console.log(`   ${GREEN}✓ .env.local exists${RESET}`);

// 4. Parse and validate env vars
console.log(`\n${BOLD}4. Environment Variables${RESET}`);

let url = null;
let key = null;
let hasIssues = false;
let stripeSecretKey = null;
let stripeWebhookSecret = null;
let stripePriceProMonthly = null;
let stripePriceProAnnual = null;
let appUrl = null;
let appUrlFallback = null;

try {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    
    const eqIndex = trimmed.indexOf('=');
    const name = trimmed.slice(0, eqIndex);
    let value = trimmed.slice(eqIndex + 1).trim();
    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    if (name === 'NEXT_PUBLIC_SUPABASE_URL') url = value;
    if (name === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') key = value;
    if (name === 'STRIPE_SECRET_KEY') stripeSecretKey = value;
    if (name === 'STRIPE_WEBHOOK_SECRET') stripeWebhookSecret = value;
    if (name === 'STRIPE_PRICE_PRO_MONTHLY') stripePriceProMonthly = value;
    if (name === 'STRIPE_PRICE_PRO_ANNUAL') stripePriceProAnnual = value;
    if (name === 'NEXT_PUBLIC_APP_URL') appUrl = value;
    if (name === 'APP_URL') appUrlFallback = value;
  }

  // Check URL
  console.log(`\n   NEXT_PUBLIC_SUPABASE_URL:`);
  if (!url) {
    console.log(`   ${RED}❌ MISSING${RESET}`);
    hasIssues = true;
  } else if (isPlaceholderUrl(url)) {
    console.log(`   ${RED}❌ PLACEHOLDER VALUE DETECTED${RESET}`);
    console.log(`      Current: ${url}`);
    console.log(`      ${YELLOW}Replace with your real Supabase project URL${RESET}`);
    hasIssues = true;
  } else if (!looksLikeValidSupabaseUrl(url)) {
    console.log(`   ${YELLOW}⚠️  URL format looks unusual${RESET}`);
    console.log(`      Value: ${url}`);
    console.log(`      Expected: https://YOUR_PROJECT_REF.supabase.co`);
    // Extract host safely
    try {
      console.log(`      Host: ${new URL(url).host}`);
    } catch {
      console.log(`      ${RED}Could not parse URL${RESET}`);
      hasIssues = true;
    }
  } else {
    try {
      const host = new URL(url).host;
      console.log(`   ${GREEN}✓ Valid${RESET} (host: ${host})`);
    } catch {
      console.log(`   ${RED}❌ Invalid URL format${RESET}`);
      hasIssues = true;
    }
  }

  // Check Anon Key (safe output only)
  console.log(`\n   NEXT_PUBLIC_SUPABASE_ANON_KEY:`);
  if (!key) {
    console.log(`   ${RED}❌ MISSING${RESET}`);
    hasIssues = true;
  } else if (isPlaceholderKey(key)) {
    console.log(`   ${RED}❌ PLACEHOLDER OR INVALID VALUE${RESET}`);
    console.log(`      ${safe('key', key)}`);
    console.log(`      ${YELLOW}Replace with your real Supabase anon key (a JWT, typically 200+ chars)${RESET}`);
    hasIssues = true;
  } else if (!looksLikeValidAnonKey(key)) {
    console.log(`   ${YELLOW}⚠️  Key format looks unusual${RESET}`);
    console.log(`      ${safe('key', key)}`);
    console.log(`      ${YELLOW}Anon keys are JWTs (header.payload.signature), typically 200+ chars${RESET}`);
    hasIssues = true;
  } else {
    console.log(`   ${GREEN}✓ Valid JWT format${RESET}`);
    console.log(`      ${safe('key', key)}`);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const resolvedAppUrl = appUrl || appUrlFallback;

  if (isProduction) {
    console.log(`\n   STRIPE_SECRET_KEY:`);
    if (!stripeSecretKey) {
      console.log(`   ${RED}❌ MISSING${RESET}`);
      hasIssues = true;
    } else {
      console.log(`   ${GREEN}✓ Present${RESET}`);
      console.log(`      ${safe('key', stripeSecretKey)}`);
    }

    console.log(`\n   STRIPE_WEBHOOK_SECRET:`);
    if (!stripeWebhookSecret) {
      console.log(`   ${RED}❌ MISSING${RESET}`);
      hasIssues = true;
    } else {
      console.log(`   ${GREEN}✓ Present${RESET}`);
      console.log(`      ${safe('key', stripeWebhookSecret)}`);
    }

    console.log(`\n   STRIPE_PRICE_PRO_MONTHLY:`);
    if (!stripePriceProMonthly) {
      console.log(`   ${RED}❌ MISSING${RESET}`);
      hasIssues = true;
    } else {
      console.log(`   ${GREEN}✓ Present${RESET} (${stripePriceProMonthly})`);
    }

    console.log(`\n   STRIPE_PRICE_PRO_ANNUAL:`);
    if (!stripePriceProAnnual) {
      console.log(`   ${RED}❌ MISSING${RESET}`);
      hasIssues = true;
    } else {
      console.log(`   ${GREEN}✓ Present${RESET} (${stripePriceProAnnual})`);
    }

    console.log(`\n   NEXT_PUBLIC_APP_URL / APP_URL:`);
    if (!resolvedAppUrl) {
      console.log(`   ${RED}❌ MISSING${RESET}`);
      hasIssues = true;
    } else {
      console.log(`   ${GREEN}✓ Present${RESET} (${resolvedAppUrl})`);
    }
  } else {
    console.log(`\n   Stripe checks skipped (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
  }

} catch (error) {
  console.error(`   ${RED}❌ Failed to read .env.local: ${error.message}${RESET}`);
  process.exit(1);
}

// 5. Summary
console.log(`\n${BOLD}5. Summary${RESET}`);
console.log('='.repeat(50));

if (hasIssues) {
  console.log(`\n${RED}${BOLD}❌ CONFIGURATION INCOMPLETE${RESET}`);
  console.log(`\nTo fix:`);
  console.log(`1. Get your Supabase project URL and anon key from:`);
  console.log(`   ${CYAN}https://supabase.com/dashboard/project/_/settings/api${RESET}`);
  console.log(`2. Update ${envLocalPath} with the real values`);
  console.log(`3. Restart the dev server: ${CYAN}npm run dev${RESET}`);
  console.log('');
  process.exit(1);
} else {
  console.log(`\n${GREEN}${BOLD}✅ CONFIGURATION LOOKS GOOD!${RESET}`);
  console.log(`\nNext steps:`);
  console.log(`1. Clear Next.js cache: ${CYAN}rm -rf .next${RESET}`);
  console.log(`2. Start dev server:   ${CYAN}npm run dev${RESET}`);
  console.log(`3. Open:               ${CYAN}http://127.0.0.1:3001/login${RESET}`);
  console.log('');
  process.exit(0);
}
