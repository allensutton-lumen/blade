import type { Page } from '@playwright/test';

export async function mockRuntimeConfig(page: Page): Promise<void> {
  await page.route('**/api/config', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tenantId: '00000000-0000-0000-0000-000000000000', clientId: '11111111-1111-1111-1111-111111111111', appName: 'BLADE' }) });
  });
}
