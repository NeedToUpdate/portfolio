import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // CommonJS config files that Node and Next load with require().
    files: ["*.config.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    // Satori renders the social card and only understands a plain <img>;
    // next/image and alt text have no meaning inside an ImageResponse.
    files: ["app/**/opengraph-image.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "backup/**",
    "scratchpad/**",
    ".claude/**",
    "next-env.d.ts",
  ]),
]);
