import { test, expect } from "@playwright/test";

test.describe("Inbox", () => {
  test("captures a new item and it appears in the list", async ({ page }) => {
    await page.goto("/inbox");

    // Wait for page to load
    await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();

    const unique = `Test capture ${Date.now()}`;

    // Type into the capture textarea
    const textarea = page.getByPlaceholder(/What's on your mind/i);
    await textarea.fill(unique);

    // Click Capture
    await page.getByRole("button", { name: "Capture" }).click();

    // The new item should appear in the list
    await expect(page.getByText(unique)).toBeVisible({ timeout: 5000 });
  });
});
