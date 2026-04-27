import { expect, test, type Page } from '@playwright/test'

function collectRuntimeErrors(page: Page) {
  const errors: string[] = []

  page.on('pageerror', (error) => {
    errors.push(error.message)
  })
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  return errors
}

test('paste, parse, switch tabs and copy without browser runtime errors', async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page)

  await page.goto('/')
  await page
    .getByPlaceholder(/Paste a TON BOC cell/i)
    .fill('te6cckEBAQEADwAAGgAAAABoZWxsbyB0b26l1xfu')

  await expect(page.getByText(/Parsed Result/i)).toBeVisible()
  await expect(page.locator('.status-badge')).toContainText(/success/i)
  await expect(page.getByText(/Buffer|ReferenceError|worker failed/i)).toHaveCount(0)

  await page.getByRole('tab', { name: /JSON/i }).click()
  await expect(page.locator('.monaco-shell[data-language="json"] .monaco-editor')).toBeVisible()

  await page.getByRole('tab', { name: /YAML/i }).click()
  await expect(page.locator('.monaco-shell[data-language="yaml"] .monaco-editor')).toBeVisible()

  await page.getByRole('button', { name: /^Copy$/ }).click()

  expect(runtimeErrors).toEqual([])
})
