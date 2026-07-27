import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { canonicalUrl, getCurrentPage } from './pages';

const page = getCurrentPage();

document.title = page.title;
document
  .querySelector('meta[name="description"]')
  ?.setAttribute('content', page.description);
document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl(page));

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <StrictMode>
      <App page={page} />
    </StrictMode>
  );
}
