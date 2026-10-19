import { test, expect } from '@playwright/test';

const COMPONENTS = [
  { name: 'Order Routing', slug: 'order-routing' },
  { name: 'Available to Promise', slug: 'available-to-promise' },
  { name: 'Fulfillment', slug: 'fulfillment' },
  { name: 'Inventory Count', slug: 'inventory-count' },
  { name: 'Commerce Admin', slug: 'admin' },
];

for (const comp of COMPONENTS) {
  test(`Verify ${comp.name} API docs page renders OpenAPI spec correctly`, async ({ page }) => {
    const url = `https://docs.hotwax.co/documents/integrate-with-hotwax/components/${comp.slug}`;
    console.log(`Checking API docs page: ${url}`);

    // Navigate to the component docs page
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect(response?.status(), `Expected HTTP 200 for ${url}`).toBe(200);

    // Wait for client-side GitBook OpenAPI component to finish rendering
    await page.waitForTimeout(4000);

    const bodyText = await page.locator('body').innerText();

    // Check that GitBook has not encountered an OpenAPI spec rendering failure
    expect(bodyText, `Error detected rendering OpenAPI spec on ${url}`).not.toContain('Failed to load OpenAPI spec');
    expect(bodyText, `Error detected rendering OpenAPI spec on ${url}`).not.toContain('Unable to load specification');
    expect(bodyText, `Page not found on ${url}`).not.toContain('Page not found');

    // Verify presence of HTTP method tags (GET, POST, etc.) or endpoint sections
    const hasMethodBadges = await page.locator('text=/GET|POST|PUT|DELETE/i').count();
    expect(hasMethodBadges, `No API method blocks (GET/POST/PUT/DELETE) found on ${url}`).toBeGreaterThan(0);
  });
}
