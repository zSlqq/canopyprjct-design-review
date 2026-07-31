import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
const eslintConfig = defineConfig([
    globalIgnores([
        ".next/**", "out/**", "build/**", "dist/**", "coverage/**",
        ".cache/**", ".stage*/**", ".stage35-backups/**",
        ".stage35-reports/**", ".stage35-work/**",
        "public/_downloads/**", "public/_archive-downloads/**",
        "public/_curated-archive/**", "lib/data/generated/curated-archive/**",
        "next-env.d.ts",
    ]),
    ...nextVitals,
    ...nextTs,
]);
export default eslintConfig;
