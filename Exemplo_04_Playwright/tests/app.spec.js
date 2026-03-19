const { test, expect } = require("@playwright/test")

test("carrega a aplicacao na homepage", async ({ page }) => {
  await page.goto("/vanilla-js-web-app-example/")
  await expect(page.locator("body")).toBeVisible()
  await expect(page).toHaveTitle("TDD Frontend Example")
  await expect(page.getByRole("textbox", { name: "Image Title" })).toBeVisible()
  await expect(page.getByRole("textbox", { name: "Image URL" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Submit Form" })).toBeVisible()
})
