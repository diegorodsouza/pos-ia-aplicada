import { test, expect } from "@playwright/test"

test.describe("Form behavior", () => {
  test("submits a valid form and updates the list", async ({ page }) => {
    await page.goto("/vanilla-js-web-app-example/")

    const listItems = page.locator("main article")
    const initialCount = await listItems.count()

    const uniqueTitle = `Playwright Item ${Date.now()}`
    const imageUrl = "https://erickwendel.github.io/vanilla-js-web-app-example/img/ai-alien.jpeg"

    await page.getByRole("textbox", { name: "Image Title" }).fill(uniqueTitle)
    await page.getByRole("textbox", { name: "Image URL" }).fill(imageUrl)
    await page.getByRole("button", { name: "Submit Form" }).click()

    await expect(page.getByRole("heading", { level: 4, name: uniqueTitle })).toBeVisible()
    await expect(listItems).toHaveCount(initialCount + 1)
  })

  test("validates required fields before submitting", async ({ page }) => {
    await page.goto("/vanilla-js-web-app-example/")

    const listItems = page.locator("main article")
    const initialCount = await listItems.count()

    await page.getByRole("button", { name: "Submit Form" }).click()

    const titleInput = page.getByRole("textbox", { name: "Image Title" })
    const urlInput = page.getByRole("textbox", { name: "Image URL" })

    await expect(titleInput).toBeFocused()
    await expect
      .poll(async () => {
        return titleInput.evaluate((el) => (el as HTMLInputElement).validity.valueMissing)
      })
      .toBeTruthy()
    await expect
      .poll(async () => {
        return titleInput.evaluate((el) => (el as HTMLInputElement).validationMessage)
      })
      .toMatch(/^(Preencha este campo\.|Please fill out this field\.)$/)
    await expect
      .poll(async () => {
        return urlInput.evaluate((el) => (el as HTMLInputElement).validity.valueMissing)
      })
      .toBeTruthy()
    await expect
      .poll(async () => {
        return urlInput.evaluate((el) => (el as HTMLInputElement).validationMessage)
      })
      .toMatch(/^(Preencha este campo\.|Please fill out this field\.)$/)

    await titleInput.fill("Only title")
    await page.getByRole("button", { name: "Submit Form" }).click()

    await expect(urlInput).toBeFocused()
    await expect
      .poll(async () => {
        return urlInput.evaluate((el) => (el as HTMLInputElement).validity.valueMissing)
      })
      .toBeTruthy()
    await expect
      .poll(async () => {
        return urlInput.evaluate((el) => (el as HTMLInputElement).validationMessage)
      })
      .toMatch(/^(Preencha este campo\.|Please fill out this field\.)$/)

    await expect(listItems).toHaveCount(initialCount)
  })

  test("validates invalid URL message before submitting", async ({ page }) => {
    await page.goto("/vanilla-js-web-app-example/")

    const listItems = page.locator("main article")
    const initialCount = await listItems.count()

    const titleInput = page.getByRole("textbox", { name: "Image Title" })
    const urlInput = page.getByRole("textbox", { name: "Image URL" })

    await titleInput.fill("Only title")
    await urlInput.fill("abc")
    await page.getByRole("button", { name: "Submit Form" }).click()

    await expect(urlInput).toBeFocused()
    await expect
      .poll(async () => {
        return urlInput.evaluate((el) => (el as HTMLInputElement).validity.typeMismatch)
      })
      .toBeTruthy()
    await expect
      .poll(async () => {
        return urlInput.evaluate((el) => (el as HTMLInputElement).validationMessage)
      })
      .toMatch(/^(Insira um URL\.|Please enter a URL\.|Please type a valid URL\.)$/)

    await expect(listItems).toHaveCount(initialCount)
  })
})
