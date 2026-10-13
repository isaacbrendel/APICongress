/**
 * Mock chamber APIs so Playwright can finish a full bout without LLM keys.
 */

const SPEECHES = [
  '("TikTok is a CCP data vacuum and banning it protects Americans from surveillance at scale.")',
  '“Free speech online still requires a sovereign platform, not a foreign influence machine.”',
  'A ban without a real competitor just hands the feed to the next cartel. Regulate access, do not cosplay liberty.',
  'National security is not a vibe. If the data leaves the country, the app leaves the store.',
  'Force a sale under US law. Shutdown theater helps politicians more than users.'
];

let llmHits = 0;

async function mockChamberApis(page) {
  llmHits = 0;

  await page.route('**/api/trending**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        topics: [
          { topic: 'Should the US ban TikTok?', heat: 95, source: 'curated' }
        ],
        sources: ['curated'],
        xLive: false
      })
    });
  });

  await page.route('**/api/llm**', async (route) => {
    const speech = SPEECHES[llmHits % SPEECHES.length];
    llmHits += 1;
    // Simulate network + generation latency
    await new Promise((r) => setTimeout(r, 120));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        response: speech
      })
    });
  });

  await page.route('**/api/verdict-card', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          id: 'testcard1',
          shareUrl: 'https://congressai.app/v/testcard1',
          imageUrl: 'https://congressai.app/api/verdict-card/testcard1.png'
        })
      });
      return;
    }
    await route.fallback();
  });

  await page.route('**/api/bill/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        document: {
          party: 'Republican',
          title: 'The Platform Security Act',
          billNumber: 'H.R. 4242',
          fullText: 'A BILL\nTo secure platforms.'
        }
      })
    });
  });

  await page.route('**/api/vote/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });
}

async function stubShareApis(page, { mobileUa } = {}) {
  await page.addInitScript((opts) => {
    window.__shareCalls = [];
    window.__clipboardWrites = [];
    window.__openedUrls = [];
    window.__locationAssigns = [];

    // Force desktop fallback path (no OS share sheet with files) unless testing mobile
    if (!opts?.mobileUa) {
      navigator.share = undefined;
      navigator.canShare = undefined;
    }

    const open = window.open.bind(window);
    window.open = (url, ...rest) => {
      window.__openedUrls.push(String(url));
      return open('about:blank', ...rest);
    };

    // Capture same-tab app handoffs (Android intent / iOS linkedin://)
    try {
      const desc = Object.getOwnPropertyDescriptor(window.Location.prototype, 'href');
      if (desc?.set) {
        Object.defineProperty(window.location, 'href', {
          configurable: true,
          enumerable: true,
          get() {
            return desc.get.call(window.location);
          },
          set(value) {
            const s = String(value);
            window.__locationAssigns.push(s);
            window.__openedUrls.push(s);
            if (/^https?:/i.test(s) && !/linkedin\.com|twitter\.com|x\.com|intent:/i.test(s)) {
              desc.set.call(window.location, value);
            }
            // Block external / intent / scheme navigations in the test page
          }
        });
      }
    } catch {
      /* ignore */
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText = async (text) => {
        window.__clipboardWrites.push({ type: 'text', text: String(text) });
      };
      navigator.clipboard.write = async (items) => {
        window.__clipboardWrites.push({ type: 'items', count: items?.length || 0 });
      };
    }

    // ClipboardItem may be used for PNG copy
    if (typeof ClipboardItem === 'undefined') {
      // eslint-disable-next-line no-global-assign
      window.ClipboardItem = class ClipboardItem {
        constructor(items) {
          this.items = items;
        }
      };
    }
  }, { mobileUa: Boolean(mobileUa) });
}

module.exports = { mockChamberApis, stubShareApis, SPEECHES };
