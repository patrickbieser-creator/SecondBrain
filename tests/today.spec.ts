import { test, expect } from "@playwright/test";

test.describe("Today page", () => {
  test("creates a task via dialog and it appears after recompute", async ({ page }) => {
    await page.goto("/today");

    // Wait for heading and initial recompute to settle
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
    await page.waitForTimeout(1500);

    const taskTitle = `PW Task ${Date.now()}`;

    // Open New Task dialog
    await page.getByRole("button", { name: "New Task" }).click();

    // Wait for dialog to be fully open
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Fill in title using id-linked label
    await page.getByLabel("Title *").fill(taskTitle);

    // Submit (don't bother changing selects — defaults are fine for it to appear)
    await page.getByRole("button", { name: "Create Task" }).click();

    // Dialog should close
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // Wait for recompute to finish and task to appear in NOW or NEXT
    // Task appears in both NOW and NEXT lists, so use first()
    await expect(page.getByText(taskTitle).first()).toBeVisible({ timeout: 10000 });
  });
});
