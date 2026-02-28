import { test, expect } from "@playwright/test";

test.describe("Focus mode", () => {
  test("timer starts, increments, and can be paused", async ({ page }) => {
    // Get a task ID from /today NOW list
    await page.goto("/today");
    await page.waitForTimeout(2000); // wait for recompute

    // Find first Focus link in NOW section
    const nowSection = page.locator("section").filter({ hasText: "NOW — Top 3" });
    const focusLink = nowSection.getByRole("link").first();
    const href = await focusLink.getAttribute("href");

    // Navigate to focus page with taskId
    const focusUrl = href?.startsWith("/focus") ? href : "/focus?taskId=dummy";
    await page.goto(focusUrl);

    // Should see the Start button
    const startButton = page.getByRole("button", { name: /Start/i });
    await expect(startButton).toBeVisible({ timeout: 5000 });

    // Timer starts at 0:00
    const timerEl = page.locator(".tabular-nums");
    await expect(timerEl).toHaveText("0:00");

    // Click Start
    await startButton.click();

    // Wait ~1.5 seconds — timer should be non-zero
    await page.waitForTimeout(1500);
    const timerText = await timerEl.textContent();
    expect(timerText).not.toBe("0:00");

    // Pause
    const pauseButton = page.getByRole("button", { name: /Pause/i });
    await expect(pauseButton).toBeVisible();
    await pauseButton.click();

    // Timer should stop incrementing — value stays fixed
    const stoppedAt = await timerEl.textContent();
    await page.waitForTimeout(500);
    expect(await timerEl.textContent()).toBe(stoppedAt);
  });
});
