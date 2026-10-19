import { test, expect } from '@playwright/test';

const COMPONENTS = [
  { name: 'Order Routing', slug: 'order-routing' },
  { name: 'Available to Promise', slug: 'available-to-promise' },
  { name: 'Fulfillment', slug: 'fulfillment' },
  { name: 'Inventory Count', slug: 'inventory-count' },
  { name: 'Commerce Admin', slug: 'admin' },
];

/**
 * Pick N distinct random items from an array
 */
function pickRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
}

for (const comp of COMPONENTS) {
  test(`Verify ${comp.name} root and random child endpoint pages render correctly`, async ({ page }) => {
    const rootUrl = `https://docs.hotwax.co/documents/integrate-with-hotwax/components/${comp.slug}`;
    console.log(`\n======================================================`);
    console.log(`🔍 Checking Root Component: ${comp.name}`);
    console.log(`   URL: ${rootUrl}`);

    // 1. Visit root component landing page
    const response = await page.goto(rootUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect(response?.status(), `Expected HTTP 200 for ${rootUrl}`).toBe(200);

    // Give GitBook client-side content a moment to settle
    await page.waitForTimeout(2000);

    const rootText = await page.locator('body').innerText();
    expect(rootText, `Error rendering root spec for ${comp.name}`).not.toContain('Failed to load OpenAPI spec');
    expect(rootText, `Page not found for ${comp.name}`).not.toContain('Page not found');

    // 2. Discover all dynamically generated child endpoint sub-pages on this component
    const endpointUrls = await page
      .locator(`main a[href*="/components/${comp.slug}/"]`)
      .evaluateAll((elements: HTMLAnchorElement[]) =>
        Array.from(new Set(elements.map(a => a.href)))
          .filter(url => !url.endsWith('/models')) // Exclude the static models list
      );

    expect(
      endpointUrls.length,
      `No child endpoint pages discovered for ${comp.name}`
    ).toBeGreaterThan(0);

    console.log(`   Total API sub-pages found: ${endpointUrls.length}`);

    // 3. Pick 2 random endpoint pages from the discovered list
    const randomEndpoints = pickRandomItems(endpointUrls, 2);
    console.log(`   🎲 Randomly selected 2 endpoints to deep-check:`);

    for (const [idx, epUrl] of randomEndpoints.entries()) {
      console.log(`     [${idx + 1}/2] Opening: ${epUrl}`);

      const epResponse = await page.goto(epUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      expect(epResponse?.status(), `Expected HTTP 200 for endpoint ${epUrl}`).toBe(200);

      // Wait for OpenAPI method blocks to load
      await page.waitForTimeout(1500);

      const epBodyText = await page.locator('body').innerText();
      expect(epBodyText, `GitBook spec loading error on ${epUrl}`).not.toContain('Failed to load OpenAPI spec');
      expect(epBodyText, `Endpoint page not found on ${epUrl}`).not.toContain('Page not found');

      // Verify that interactive HTTP method badges (GET, POST, PUT, DELETE, etc.) are present
      const hasMethodBadge = await page.locator('text=/GET|POST|PUT|DELETE|PATCH/i').count();
      expect(
        hasMethodBadge,
        `No HTTP method badges (GET/POST/PUT/DELETE) found on endpoint page: ${epUrl}`
      ).toBeGreaterThan(0);

      console.log(`     ✅ Endpoint page loaded and rendered HTTP method blocks successfully.`);
    }

    console.log(`✅ ${comp.name}: Root and 2 random API pages verified!`);
  });
}
