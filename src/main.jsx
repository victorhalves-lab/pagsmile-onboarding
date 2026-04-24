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
async function importWithRetry(loader, label) {
  try {
    return await loader();
  } catch (err) {
    console.warn(`[boot] ${label} failed, retrying once...`, err?.message);
    await new Promise(r => setTimeout(r, 600));
    return await loader();
  }
}

function renderFatalError(err) {
  const root = document.getElementById('root');
  if (!root) return;
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;padding:24px;background:#f4f4f4;">
      <div style="max-width:480px;background:#fff;border-radius:12px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,0.08);text-align:center;">
        <h1 style="color:#002443;font-size:20px;margin:0 0 12px;">Erro ao carregar a aplicação</h1>
        <p style="color:#64748b;font-size:14px;margin:0 0 20px;">Não foi possível baixar um dos módulos. Isso geralmente acontece quando a conexão oscila ou uma nova versão acabou de ser publicada.</p>
        <button onclick="window.location.reload()" style="background:#2bc196;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;">Recarregar página</button>
        <p style="color:#94a3b8;font-size:11px;margin:16px 0 0;font-family:monospace;">${String(err?.message || err).slice(0,200)}</p>
      </div>
    </div>
  `;
}

async function boot() {
  try {
    await ensureSdkLoaded();
    const { default: App } = await importWithRetry(() => import('@/App.jsx'), 'App.jsx import');
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  } catch (err) {
    console.error('[boot] Fatal boot error:', err);
    renderFatalError(err);
  }
}

boot();