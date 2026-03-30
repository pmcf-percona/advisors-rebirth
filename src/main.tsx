import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PostHogProvider } from '@posthog/react';
import App from './App';
import './index.css';

const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
} as const;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN} options={posthogOptions}>
      <BrowserRouter basename="/advisors-rebirth">
        <App />
      </BrowserRouter>
    </PostHogProvider>
  </StrictMode>,
);
