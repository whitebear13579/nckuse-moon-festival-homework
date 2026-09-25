import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { rules: { 'react-hooks/set-state-in-effect': 'off' } },
  { files: ['src/components/pixel-swap-source.tsx'], rules: { 'react-hooks/refs': 'off' } },
  globalIgnores(['.next/**', 'node_modules/**', 'playwright-report/**', 'test-results/**']),
])
