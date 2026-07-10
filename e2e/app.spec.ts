import { expect, test } from '@playwright/test';
import { mockRuntimeConfig } from './helpers/auth-mock';

test('shows the login page before authentication', async ({ page }) => {
  await mockRuntimeConfig(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'BLADE' })).toBeVisible();
  await expect(page.getByRole('button', { name: /continue with lumen sso/i })).toBeVisible();
});
