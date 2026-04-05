import { expect, test } from '@playwright/test';

test.describe('Stayvora partner production smoke', () => {
  test('partner login route loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/Stayvora/i)).toBeVisible();
  });

  test('partner payouts route is reachable after auth redirect', async ({ page }) => {
    await page.goto('/payouts');
    await expect(page).toHaveURL(/login|payouts/);
  });
});
