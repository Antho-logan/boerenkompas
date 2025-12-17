import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: [
      "src/app/**/*.{js,jsx,ts,tsx,mjs,cjs}",
      "app/**/*.{js,jsx,ts,tsx,mjs,cjs}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/components/layout/dashboard-shell",
              message:
                "Legacy dashboard shell is not allowed in app routes. Use the single AppShell from app/(app)/layout.tsx.",
            },
            {
              name: "@/components/layout/AppShell",
              message:
                "Legacy shell is not allowed in app routes. Use the single AppShell from app/(app)/layout.tsx.",
            },
          ],
          patterns: [
            {
              group: [
                "**/components/layout/dashboard-shell",
                "**/components/layout/AppShell",
              ],
              message:
                "Legacy shell components are not allowed in app routes. Use the single AppShell from app/(app)/layout.tsx.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
