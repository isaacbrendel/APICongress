const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const PROOF_DIR = path.join(__dirname, '../../test-proof');
const UTIL = fs.readFileSync(path.join(__dirname, '../src/utils/verdictCard.js'), 'utf8');

test.describe('Verdict card layout (Strava-level, site aesthetic)', () => {
  test.beforeAll(() => {
    fs.mkdirSync(PROOF_DIR, { recursive: true });
  });

  test('APICONGRESS brand fits; site one-liner; 1200×630 PNG', async ({ page }) => {
    await page.route('**/__test__/verdictCard.js', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        headers: { 'Cache-Control': 'no-store' },
        body: UTIL
      });
    });

    await page.goto('/');
    await page
      .waitForFunction(() => document.fonts?.status === 'loaded', null, { timeout: 10000 })
      .catch(() => {});

    const result = await page.evaluate(async () => {
      const mod = await import('/__test__/verdictCard.js');
      const measured = await mod.measureVerdictCard({
        topic: 'Should the US ban TikTok?',
        winnerName: 'ChatGPT',
        party: 'Democrat',
        logoSrc: '/logos/chatgpt.png',
        site: 'congressai.app'
      });
      return {
        width: measured.width,
        height: measured.height,
        brandWidth: measured.brandWidth,
        brandMaxWidth: measured.brandMaxWidth,
        brandFits: measured.brandFits,
        siteLine: measured.siteLine,
        dataUrl: measured.dataUrl,
        SITE_LINE: mod.SITE_LINE
      };
    });

    expect(result.width).toBe(1200);
    expect(result.height).toBe(630);
    expect(result.brandFits).toBe(true);
    expect(result.brandWidth).toBeLessThanOrEqual(result.brandMaxWidth + 0.5);
    // Same plain line as the home kicker — not a quote / marketing punch
    expect(result.siteLine).toBe('Five models. Random parties. One verdict.');
    expect(result.SITE_LINE).toBe(result.siteLine);
    expect(result.siteLine).not.toMatch(/TikTok|CCP| ban /i);
    expect(result.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(result.dataUrl.length).toBeGreaterThan(20000);

    const b64 = result.dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path.join(PROOF_DIR, '07-card-layout-proof.png'), Buffer.from(b64, 'base64'));

    fs.writeFileSync(
      path.join(PROOF_DIR, 'card-layout-metrics.json'),
      JSON.stringify(
        {
          brandWidth: result.brandWidth,
          brandMaxWidth: result.brandMaxWidth,
          brandFits: result.brandFits,
          siteLine: result.siteLine,
          dimensions: `${result.width}x${result.height}`,
          pngChars: result.dataUrl.length
        },
        null,
        2
      )
    );
  });
});
