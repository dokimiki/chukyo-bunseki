import { test, expect } from "@playwright/test";

test.describe("Portal Research Agent E2E", () => {
  test("should load the application", async ({ page }) => {
    await page.goto("/");

    // タイトルの確認
    await expect(page).toHaveTitle(/Portal Research Agent/);

    // ヘッダーの確認
    await expect(page.locator("h1")).toContainText("Portal Research Agent");

    // フォーム要素の確認
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="url"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator("button")).toContainText("調査開始");
  });

  test("should show validation message for empty form", async ({ page }) => {
    await page.goto("/");

    // 空のフォームで調査開始ボタンをクリック
    await page.click('button:text("調査開始")');

    // アラートダイアログの確認
    page.on("dialog", async dialog => {
      expect(dialog.message()).toContain(
        "ユーザー名とパスワードを入力してください"
      );
      await dialog.accept();
    });
  });
});
