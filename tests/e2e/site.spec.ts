import { expect, test } from '@playwright/test';

test('homepage calculator covers comparison, errors, reset, and canonical', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Comparing Fractions Calculator/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.comparingfractions.com/'
  );

  await page.getByLabel('First fraction').fill('2/3');
  await page.getByLabel('Second fraction').fill('3/4');
  await page.getByRole('button', { name: 'Compare' }).click();
  const answer = page.locator('.answer-line');
  await expect(answer).toContainText('2/3');
  await expect(answer.locator('.symbol')).toHaveText('<');
  await expect(page.getByText('Use cross multiplication')).toBeVisible();

  await page.getByLabel('First fraction').fill('1/0');
  await page.getByRole('button', { name: 'Compare' }).click();
  await expect(page.getByRole('alert')).toContainText('denominator cannot be 0');

  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.getByLabel('First fraction')).toHaveValue('3/4');
});

test('tutorial, policy pages, sitemap, robots, and 404 are reachable', async ({ page }) => {
  await page.goto('/how-to-compare-fractions/');
  await expect(page.getByRole('heading', { name: 'How to Compare Fractions' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'How do you compare fractions with different denominators?' })
  ).toBeVisible();

  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();

  await page.goto('/terms/');
  await expect(page.getByRole('heading', { name: 'Terms of Use' })).toBeVisible();

  const robots = await page.request.get('/robots.txt');
  expect(await robots.text()).toContain('Sitemap: https://www.comparingfractions.com/sitemap.xml');

  const sitemap = await page.request.get('/sitemap.xml');
  expect(await sitemap.text()).toContain('https://www.comparingfractions.com/how-to-compare-fractions/');

  const missing = await page.request.get('/missing-page-for-test/');
  expect(missing.status()).toBe(404);
});
