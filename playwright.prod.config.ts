import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.STAYVORA_PARTNER_BASE_URL ?? 'https://partner-portal.vercel.app';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
