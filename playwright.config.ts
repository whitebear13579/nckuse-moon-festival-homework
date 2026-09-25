import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && existsSync('.env.local')) process.loadEnvFile('.env.local')

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER ? undefined : {
    command: 'npm run dev -- -H 127.0.0.1', url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI, timeout: 120_000,
  },
})
