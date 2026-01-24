import { test, expect } from '@playwright/test';

test('User kann sich registrieren', async ({ page }) => {
  await page.goto('http://http://localhost:5173');

  await page.click('button[name="btn-switch-signup"]');

  await page.fill('#signup-username', 'testuser_playwright');
  await page.fill('#signup-password', 'secret123');

  const submitButton = page.locator('button[name="btn-signup-submit"]');

  await expect(submitButton).toBeDisabled();

  await page.fill('#signup-password-repeat', 'secret123');

  await expect(submitButton).toBeEnabled();

  await submitButton.click();

  await expect(page.locator('form[name="form-login"]')).toBeVisible();
});
