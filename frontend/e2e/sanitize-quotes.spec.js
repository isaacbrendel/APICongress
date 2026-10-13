const { test, expect } = require('@playwright/test');

test.describe('sanitizeArgumentText', () => {
  test('strips wrapping quotes and paren-quotes', async () => {
    const mod = await import('../src/utils/sanitizeText.js');
    const sanitize = mod.sanitizeArgumentText;

    expect(sanitize('("TikTok is a CCP data vacuum and banning it protects Americans.")')).toBe(
      'TikTok is a CCP data vacuum and banning it protects Americans.'
    );
    expect(sanitize('“Free speech still requires a sovereign platform for citizens.”')).toBe(
      'Free speech still requires a sovereign platform for citizens.'
    );
    expect(sanitize('Plain speech without packaging for the chamber floor today.')).toBe(
      'Plain speech without packaging for the chamber floor today.'
    );
  });
});
