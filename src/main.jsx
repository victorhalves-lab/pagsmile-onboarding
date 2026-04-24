import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/index.css'
import { ensureSdkLoaded } from '@/api/base44Client'

// ─────────────────────────────────────────────────────────────────────────
// Boot sequence:
// 1. Load the SDK (or skip it, on onboarding public routes).
// 2. Dynamically import App AFTER the SDK decision — this keeps any static
//    SDK imports out of the chunk loaded on onboarding public routes.
// 3. Render.
// ─────────────────────────────────────────────────────────────────────────
async function boot() {
  await ensureSdkLoaded();
  const { default: App } = await import('@/App.jsx');
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
}

boot();