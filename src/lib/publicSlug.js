/**
 * Public Slug utilities — generate/canonicalize friendly URLs for public proposals and contracts.
 *
 * Format: "company-name-abc1" (slugified name + 4 random alphanum chars)
 * The 4-char suffix guarantees uniqueness and prevents guessing.
 */

/**
 * Slugify a string: remove accents, lowercase, replace spaces/special chars with "-".
 */
export function slugifyText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56); // leave room for suffix
}

/**
 * Generate a random 4-char alphanumeric suffix.
 */
export function randomSuffix(len = 4) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

/**
 * Generate a public slug from a company name.
 * Fallback: "proposta-abc1xyz8" if name is empty.
 */
export function generatePublicSlug(companyName) {
  const base = slugifyText(companyName);
  const suffix = randomSuffix(4);
  if (!base) return `proposta-${randomSuffix(8)}`;
  return `${base}-${suffix}`;
}

/**
 * Route prefix per entity type.
 */
export const SLUG_PREFIX = {
  proposal: '/p',
  standardProposal: '/pp',
  pixProposal: '/pix',
  contract: '/c',
};

/**
 * Build a public URL from a slug.
 */
export function buildPublicSlugUrl(type, slug, origin = null) {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  const prefix = SLUG_PREFIX[type];
  if (!prefix || !slug) return '';
  return `${base}${prefix}/${slug}`;
}

/**
 * Canonicalize the browser URL: swap the legacy URL for the new slug URL
 * without reloading the page. Safe to call multiple times (idempotent).
 */
export function canonicalizeSlugUrl(type, slug) {
  if (typeof window === 'undefined' || !slug) return;
  const prefix = SLUG_PREFIX[type];
  if (!prefix) return;
  const targetPath = `${prefix}/${slug}`;
  const currentPath = window.location.pathname;
  // Already on the new URL — nothing to do
  if (currentPath === targetPath) return;
  try {
    window.history.replaceState(null, '', targetPath);
  } catch {
    // No-op if history API unavailable
  }
}