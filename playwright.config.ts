import { defineConfig, devices } from '@playwright/test'

/**
 * E2E runs both apps against an isolated database (`aprendizajess_e2e`) that
 * is reset + seeded in global setup. Ports differ from dev (3000/3001) so a
 * running dev session is never touched.
 *
 * Requires MongoDB at MONGODB_URI (default mongodb://127.0.0.1:27017, e.g.
 * `pnpm db:local`) and built apps (`pnpm build`).
 */
const WEB_PORT = 3100
const ADMIN_PORT = 3101
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'

export const e2eEnv = {
  MONGODB_URI,
  MONGODB_DB_NAME: 'aprendizajess_e2e',
  PUBLIC_BASE_URL: `http://localhost:${WEB_PORT}`,
  ADMIN_BASE_URL: `http://localhost:${ADMIN_PORT}`,
  AUTH_SECRET: 'e2e-auth-secret-0123456789abcdefghijklmnop',
  REVALIDATION_SECRET: 'e2e-revalidation-secret-0123456789abcdefgh',
  PREVIEW_SECRET: 'e2e-preview-secret-0123456789abcdefghijklm',
  SEED_ADMIN_EMAIL: 'e2e-admin@example.com',
  SEED_ADMIN_PASSWORD: 'e2e-Password-123456',
  MEDIA_PROVIDER: 'local',
  LOCAL_MEDIA_DIR: '.media-e2e',
}

for (const [key, value] of Object.entries(e2eEnv)) process.env[key] = value

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  reporter: [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: {
    trace: 'retain-on-failure',
    locale: 'es-CL',
  },
  projects: [
    { name: 'setup', testMatch: /e2e\/setup\/.*\.setup\.ts$/, use: { baseURL: e2eEnv.PUBLIC_BASE_URL } },
    {
      name: 'web-desktop',
      dependencies: ['setup'],
      testMatch: /e2e\/web\/.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: e2eEnv.PUBLIC_BASE_URL },
    },
    {
      name: 'web-mobile',
      // Projects share one database and some specs mutate it temporarily:
      // run them strictly one after another, never interleaved.
      dependencies: ['web-desktop'],
      testMatch: /e2e\/web\/.*\.spec\.ts$/,
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', baseURL: e2eEnv.PUBLIC_BASE_URL },
    },
    {
      name: 'admin',
      dependencies: ['web-mobile'],
      testMatch: /e2e\/admin\/.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: e2eEnv.ADMIN_BASE_URL },
    },
  ],
  webServer: [
    {
      command: `pnpm --filter @repo/web exec next start --port ${WEB_PORT}`,
      url: `${e2eEnv.PUBLIC_BASE_URL}/api/health`,
      env: e2eEnv,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `pnpm --filter @repo/admin exec next start --port ${ADMIN_PORT}`,
      url: `${e2eEnv.ADMIN_BASE_URL}/login`,
      env: e2eEnv,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
