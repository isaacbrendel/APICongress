const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { mockChamberApis, stubShareApis } = require('./helpers/mockApi');

const PROOF_DIR = path.join(__dirname, '../../test-proof');

test.describe('APICONGRESS verdict share (graphic-first)', () => {
  test.beforeAll(() => {
    fs.mkdirSync(PROOF_DIR, { recursive: true });
  });

  test('debate → crown → graphic card → LinkedIn/X do NOT dump ?topic= URLs', async ({
    page
  }) => {
    await stubShareApis(page);
    await mockChamberApis(page);

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'APICONGRESS' })).toBeVisible();
    await page.screenshot({ path: path.join(PROOF_DIR, '01-home.png'), fullPage: true });

    // Start a bout
    await page.getByPlaceholder(/topic|fight|drop/i).fill('Should the US ban TikTok?');
    await page.getByRole('button', { name: /open floor|begin|debate/i }).click();

    await expect(page.locator('.cast-label')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(PROOF_DIR, '02-casting.png'), fullPage: true });

    // Wait until debating starts, then advance through speakers (skip reading auto-timer)
    await expect(page.locator('.argument-feed, .continue-btn, .skip-all-btn').first()).toBeVisible({
      timeout: 15000
    });

    for (let i = 0; i < 8; i += 1) {
      if (await page.getByText(/you pick the winner/i).isVisible().catch(() => false)) break;
      const next = page.getByRole('button', { name: /next speaker|proceed to crown winner/i });
      if (await next.isVisible().catch(() => false)) {
        await next.click();
        continue;
      }
      await page.waitForTimeout(400);
    }

    // Voting / crown
    await expect(page.getByText(/you pick the winner/i)).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: path.join(PROOF_DIR, '03-voting.png'), fullPage: true });

    // Prove quote wrappers were stripped from feed text
    const feed = page.locator('.argument-feed, .voting-feed');
    const feedText = await feed.first().innerText();
    expect(feedText).not.toMatch(/^\s*\("/m);
    expect(feedText).toContain('TikTok');
    // Should not show the wrapping paren-quote packaging from the mock payload
    expect(feedText).not.toContain('("TikTok');

    // Crown first available model
    const crownBtn = page.locator('button.vote-name').first();
    await expect(crownBtn).toBeVisible();
    await crownBtn.click();
    await page.getByRole('button', { name: /confirm winner/i }).click();

    // Result + graphic
    await expect(page.getByText(/you crowned the winner/i)).toBeVisible({ timeout: 20000 });
    const graphic = page.locator('img.verdict-graphic');
    await expect(graphic).toBeVisible({ timeout: 20000 });
    const src = await graphic.getAttribute('src');
    expect(src).toMatch(/^data:image\/png;base64,/);
    expect((src || '').length).toBeGreaterThan(20000);

    // Crop just the graphic for visual proof of the redesigned card
    await graphic.screenshot({ path: path.join(PROOF_DIR, '04b-card-only.png') });
    await page.screenshot({ path: path.join(PROOF_DIR, '04-verdict-graphic.png'), fullPage: true });

    // Brand must appear fully in the card (no "APICONGRE" clip)
    const cardMetrics = await page.evaluate(async (dataUrl) => {
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = dataUrl;
      });
      return { w: img.naturalWidth, h: img.naturalHeight };
    }, src);
    expect(cardMetrics.w).toBe(1200);
    expect(cardMetrics.h).toBe(630);

    // LinkedIn: Start a post composer — never share-offsite / ?topic= dumps
    await page.getByRole('button', { name: /post to linkedin/i }).click();
    await expect(page.locator('.share-coach')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(PROOF_DIR, '05-linkedin-coach.png'), fullPage: true });

    const openedAfterLi = await page.evaluate(() => window.__openedUrls.slice());
    const clipboardAfterLi = await page.evaluate(() => window.__clipboardWrites.slice());

    expect(
      openedAfterLi.some(
        (u) => u.includes('linkedin.com') && u.includes('shareActive=true')
      )
    ).toBeTruthy();
    expect(openedAfterLi.some((u) => u.includes('share-offsite'))).toBeFalsy();
    expect(openedAfterLi.some((u) => u.includes('?topic='))).toBeFalsy();

    const textWrites = clipboardAfterLi.filter((w) => w.type === 'text').map((w) => w.text);
    expect(textWrites.some((t) => t.includes('?topic='))).toBeFalsy();
    expect(textWrites.some((t) => /APICONGRESS/.test(t))).toBeTruthy();
    // No quote-wall dump
    expect(textWrites.some((t) => t.includes('CCP-controlled') || t.includes('data vacuum sucking'))).toBeFalsy();

    await page.getByRole('button', { name: /got it/i }).click();

    // X: same guarantees
    await page.getByRole('button', { name: /post to x/i }).click();
    await expect(page.locator('.share-coach')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(PROOF_DIR, '06-x-coach.png'), fullPage: true });

    const openedAfterX = await page.evaluate(() => window.__openedUrls.slice());
    expect(openedAfterX.some((u) => /twitter\.com|x\.com/i.test(u))).toBeTruthy();
    expect(openedAfterX.some((u) => u.includes('?topic='))).toBeFalsy();

    // Save proof JSON
    fs.writeFileSync(
      path.join(PROOF_DIR, 'share-assertions.json'),
      JSON.stringify(
        {
          openedUrls: openedAfterX,
          clipboardWrites: await page.evaluate(() => window.__clipboardWrites),
          graphicIsPngDataUrl: /^data:image\/png;base64,/.test(src || ''),
          feedHadWrappedQuotes: feedText.includes('("TikTok')
        },
        null,
        2
      )
    );
  });

  test('Android LinkedIn uses app intent (not browser sign-in tab)', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const page = await context.newPage();
    await stubShareApis(page, { mobileUa: true });
    // Force intent path (no Web Share sheet in this proof)
    await page.addInitScript(() => {
      navigator.share = undefined;
      navigator.canShare = undefined;
    });
    await mockChamberApis(page);
    await page.goto('/');

    await page.getByPlaceholder(/topic|fight|drop/i).fill('Should the US ban TikTok?');
    await page.getByRole('button', { name: /open floor|begin|debate/i }).click();

    await expect(page.locator('.argument-feed, .continue-btn, .skip-all-btn').first()).toBeVisible({
      timeout: 15000
    });

    for (let i = 0; i < 12; i += 1) {
      if (await page.getByText(/you pick the winner/i).isVisible().catch(() => false)) break;
      const next = page.getByRole('button', { name: /next speaker|proceed to crown winner/i });
      if (await next.isVisible().catch(() => false)) {
        await next.click();
        continue;
      }
      await page.waitForTimeout(500);
    }

    await expect(page.getByText(/you pick the winner/i)).toBeVisible({ timeout: 25000 });
    await page.locator('button.vote-name').first().click();
    await page.getByRole('button', { name: /confirm winner/i }).click();
    await expect(page.locator('img.verdict-graphic')).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: /post to linkedin/i }).click();
    await expect(page.locator('.share-coach')).toBeVisible({ timeout: 10000 });

    const opened = await page.evaluate(() => window.__openedUrls.slice());
    const intentHit = opened.find(
      (u) => u.startsWith('intent://') && u.includes('linkedin') && u.includes('shareActive=true')
    );
    expect(intentHit).toBeTruthy();
    expect(intentHit).toContain('com.linkedin.android');
    expect(opened.some((u) => u.includes('share-offsite'))).toBeFalsy();

    await page.screenshot({ path: path.join(PROOF_DIR, '07-android-linkedin-intent.png'), fullPage: true });
    fs.writeFileSync(
      path.join(PROOF_DIR, 'android-linkedin-intent.json'),
      JSON.stringify({ openedUrls: opened, intentHit }, null, 2)
    );
    await context.close();
  });
});
