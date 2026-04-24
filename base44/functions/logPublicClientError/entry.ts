/**
 * PUBLIC endpoint — NO-OP safety valve.
 *
 * This function used to create IntegrationLog records for client-side errors
 * on public pages. However, the Base44 SDK fires dozens of benign `instanceof`
 * errors per session from background listeners, which saturated this endpoint,
 * triggered the rate-limiter (429), and (via the retry logic in the client)
 * blocked the main thread and froze the page.
 *
 * The client-side boundaries now filter those transient errors before calling
 * this endpoint. But browsers may still be running an older cached bundle that
 * calls it aggressively, so this function returns 200 immediately — no logging,
 * no rate-limit, no CPU. Fire-and-forget callers receive a clean success.
 *
 * Real client errors can be re-enabled here once all cached bundles are flushed.
 */
Deno.serve(async (_req) => {
  return Response.json({ ok: true });
});