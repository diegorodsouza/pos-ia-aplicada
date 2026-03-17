const { test, expect } = require("@playwright/test")

test("carrega a aplicacao na homepage", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("body")).toBeVisible()
  await expect(page).toHaveTitle(/.+/)
})
