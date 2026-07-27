export type PageKey = 'home' | 'guide' | 'privacy' | 'terms' | 'notFound';

export type PageMeta = {
  key: PageKey;
  path: string;
  title: string;
  description: string;
  h1: string;
};

export const CANONICAL_HOST = 'https://www.comparingfractions.com';

export const pages: Record<PageKey, PageMeta> = {
  home: {
    key: 'home',
    path: '/',
    title: 'Comparing Fractions Calculator | Which Fraction Is Greater?',
    description:
      'Compare two fractions, mixed numbers, integers, or negative fractions with exact BigInt math and step-by-step work.',
    h1: 'Comparing Fractions Calculator'
  },
  guide: {
    key: 'guide',
    path: '/how-to-compare-fractions/',
    title: 'How to Compare Fractions | Same, Different, Negative, and Mixed',
    description:
      'Learn how to compare fractions with the same denominator, different denominators, same numerator, mixed numbers, and negatives.',
    h1: 'How to Compare Fractions'
  },
  privacy: {
    key: 'privacy',
    path: '/privacy/',
    title: 'Privacy Policy | Comparing Fractions',
    description:
      'Privacy details for Comparing Fractions, a browser-local fraction comparison tool with no accounts or analytics in version one.',
    h1: 'Privacy Policy'
  },
  terms: {
    key: 'terms',
    path: '/terms/',
    title: 'Terms of Use | Comparing Fractions',
    description:
      'Terms for using Comparing Fractions as an educational tool for comparing fractions and checking math work.',
    h1: 'Terms of Use'
  },
  notFound: {
    key: 'notFound',
    path: '/404.html',
    title: 'Page Not Found | Comparing Fractions',
    description: 'The requested Comparing Fractions page could not be found.',
    h1: 'Page Not Found'
  }
};

export function getCurrentPage(pathname = window.location.pathname): PageMeta {
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
  if (normalized === '/') return pages.home;
  if (normalized === pages.guide.path) return pages.guide;
  if (normalized === pages.privacy.path) return pages.privacy;
  if (normalized === pages.terms.path) return pages.terms;
  return pages.notFound;
}

export function canonicalUrl(page: PageMeta): string {
  if (page.key === 'home') return `${CANONICAL_HOST}/`;
  return `${CANONICAL_HOST}${page.path}`;
}
