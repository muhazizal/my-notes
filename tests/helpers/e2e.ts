import type { Page } from '@playwright/test'

export async function loginViaUI(page: Page) {
  await page.goto('/sign-in')
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle')

  const emailInput = page.getByTestId('login-email-input')
  const passwordInput = page.getByTestId('login-password-input')
  await emailInput.fill('a@b.com')
  await passwordInput.fill('P@ssw0rd!')

  const loginButton = page.getByTestId('login-button')
  await loginButton.click()

  // Wait for redirect to notes without relying on expect in helper
  await page.waitForURL('**/notes')
}

