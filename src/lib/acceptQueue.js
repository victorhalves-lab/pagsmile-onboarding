/**
 * FILA DE ACEITE PERSISTENTE
 * ==========================
 *
 * Garante que o aceite de uma proposta NUNCA se perde, mesmo com:
 *  - rede caindo no momento do clique
 *  - cliente fechando o browser antes do servidor confirmar
 *  - servidor demorando para responder (timeout)
 *  - cliente abrindo a proposta em outra aba / outro dispositivo
 *
 * Como funciona:
 *  1. Ao clicar em "Aceitar", gravamos o aceite em localStorage IMEDIATAMENTE.
 *  2. A UI trata como "aceita" (feedback instantâneo, cliente feliz).
 *  3. Um worker tenta enviar ao servidor em background.
 *  4. Se falhar, reagenda com backoff exponencial INFINITO (5s → 10s → 20s → 1min → 1min).
 *  5. Quando o cliente reabre a página (mesmo dias depois), o worker retoma.
 *  6. Ao confirmar no servidor, remove da fila.
 *
 * Idempotência: o servidor (publicProposalAction) já é idempotente — aceitar 2x
 * retorna {ok:true, skipped:true}. Então reenvios repetidos são seguros.
 */
// SDK-FREE: this worker runs on PUBLIC pages (anonymous visitors).
// The @base44/sdk fails with 401 for unauthenticated users on a private app.
import { callPublicFunction } from '@/lib/publicApi';

const QUEUE_KEY = 'pagsmile_accept_queue_v1';
const MAX_QUEUE_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

function readQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* quota cheia — ignorar, não é crítico */
  }
}

function pruneOld(queue) {
  const now = Date.now();
  return queue.filter(item => (now - (item.createdAt || 0)) < MAX_QUEUE_AGE_MS);
}

/**
 * Enfileira um aceite. Retorna imediatamente (não espera servidor).
 * A UI pode tratar como "aceito" imediatamente após esta chamada.
 */
export function enqueueAccept({ proposalId, token, slug, type, payload = null, action = 'accept' }) {
  const queue = pruneOld(readQueue());
  // Se já existe um item para essa proposta+ação, não duplicar
  const existing = queue.find(i => i.proposalId === proposalId && i.action === action);
  if (existing) return existing.id;

  const item = {
    id: `accept_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    proposalId,
    token,
    slug,
    type, // 'proposal' | 'pix_proposal'
    action, // 'accept' | 'reject' | 'counter'
    payload,
    attempts: 0,
    lastAttemptAt: null,
    createdAt: Date.now(),
    status: 'pending',
  };
  queue.push(item);
  writeQueue(queue);

  // Dispara tentativa imediata (sem await — fire and forget)
  setTimeout(() => processQueue(), 0);
  return item.id;
}

/**
 * Marca um item como enviado com sucesso.
 */
function removeFromQueue(id) {
  const queue = readQueue().filter(i => i.id !== id);
  writeQueue(queue);
}

/**
 * Calcula delay de retry. Infinito (nunca desiste), mas com teto de 1 min entre tentativas.
 */
function nextDelayMs(attempts) {
  if (attempts <= 1) return 2_000;  // 2s
  if (attempts <= 2) return 5_000;  // 5s
  if (attempts <= 4) return 15_000; // 15s
  if (attempts <= 8) return 30_000; // 30s
  return 60_000;                    // 1 min daí em diante
}

let processing = false;

/**
 * Processa a fila. Chamado:
 *  - ao enfileirar (imediato)
 *  - ao carregar a página (processQueue())
 *  - periodicamente via setInterval (startAcceptWorker())
 *  - quando a rede volta (listener 'online')
 */
export async function processQueue() {
  if (processing) return;
  processing = true;
  try {
    const queue = pruneOld(readQueue());
    if (queue.length === 0) return;

    const now = Date.now();
    for (const item of queue) {
      // Respeitar delay de retry
      if (item.lastAttemptAt) {
        const wait = nextDelayMs(item.attempts);
        if (now - item.lastAttemptAt < wait) continue;
      }

      // Tentar enviar
      item.attempts += 1;
      item.lastAttemptAt = Date.now();
      writeQueue(readQueue().map(i => i.id === item.id ? item : i));

      try {
        const res = await callPublicFunction('publicProposalAction', {
          token: item.token,
          slug: item.slug,
          type: item.type,
          action: item.action,
          payload: item.payload,
        });
        // Sucesso: ok:true (com ou sem skipped) OU erro 409 "já aceita" (idempotente)
        if (res?.ok) {
          removeFromQueue(item.id);
          continue;
        }
        // Erro de negócio que NÃO adianta reenviar: proposta expirada/cancelada
        const err = (res?.error || '').toLowerCase();
        if (err.includes('expirada') || err.includes('cancelada') || err.includes('recusada')) {
          // Guarda como "failed" mas não reagenda indefinidamente
          removeFromQueue(item.id);
          continue;
        }
        // Qualquer outro erro: deixa na fila para retry
      } catch (_) {
        // Erro de rede: deixa na fila para retry
      }
    }
  } finally {
    processing = false;
  }
}

let workerIntervalId = null;
let workerStarted = false;

/**
 * Inicia o worker. Chamar uma única vez no mount da página pública.
 * O worker processa a fila a cada 10s e também quando a rede volta.
 */
export function startAcceptWorker() {
  if (workerStarted) return;
  workerStarted = true;

  // Processa imediatamente ao iniciar
  processQueue();

  // Roda a cada 10s
  workerIntervalId = setInterval(() => processQueue(), 10_000);

  // Processa quando a rede volta
  window.addEventListener('online', () => processQueue());

  // Processa quando a aba volta a ficar visível
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') processQueue();
  });
}

export function stopAcceptWorker() {
  if (workerIntervalId) clearInterval(workerIntervalId);
  workerIntervalId = null;
  workerStarted = false;
}

/**
 * Retorna se uma proposta específica está na fila de aceite pendente.
 * Usado pela UI para exibir "Aceite registrado, sincronizando..." mesmo offline.
 */
export function isAcceptPending(proposalId) {
  return readQueue().some(i => i.proposalId === proposalId && i.action === 'accept' && i.status === 'pending');
}