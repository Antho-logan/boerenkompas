import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envLocalPath = path.join(rootDir, '.env.local');

console.log('\n🏥 BoerenKompas Environment Doctor');
console.log('==================================');
console.log(`📂 Project Root: ${rootDir}`);
console.log(`📄 Checking:     ${envLocalPath}`);

if (!fs.existsSync(envLocalPath)) {
  console.error('❌ ERROR: .env.local file not found!');
  console.error('   Please create it in the project root with your Supabase credentials.');
  process.exit(1);
}

console.log('✅ .env.local file exists.');

try {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  const lines = content.split('\n');
  
  let url = null;
  let key = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed.length === 0) continue;

    if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      url = trimmed.split('=')[1].trim().replace(/^["']|["']$/g, '');
    }
    if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      key = trimmed.split('=')[1].trim().replace(/^["']|["']$/g, '');
    }
  }

  // Check URL
  if (!url) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  } else {
    const isPlaceholder = url.includes('your-project-id') || url.includes('jouw-project-id') || url.includes('placeholder');
    if (isPlaceholder) {
      console.error(`❌ NEXT_PUBLIC_SUPABASE_URL appears to be a placeholder: ${url}`);
    } else {
      let host = '(invalid)';
      try { host = new URL(url).host; } catch {}
      console.log(`✅ Supabase URL found. Host: ${host}`);
    }
  }

  // Check Key
  if (!key) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  } else {
    const isPlaceholder = key.includes('your-anon-key') || key.includes('placeholder');
    if (isPlaceholder) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be a placeholder.');
    } else {
      console.log(`✅ Supabase Anon Key found. Length: ${key.length} chars`);
    }
  }

  if (url && key && !url.includes('placeholder') && !key.includes('placeholder')) {
    console.log('\n🎉 Environment appears correctly configured on disk!');
    process.exit(0);
  } else {
    console.error('\n⚠️  Environment configuration is invalid or incomplete.');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Failed to read .env.local:', error.message);
  process.exit(1);
}
