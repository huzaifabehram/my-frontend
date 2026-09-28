// src/utils/siteSettings.js
// ─────────────────────────────────────────────────────────────────────────────
// ONE shared, cached fetch of /settings (the logos etc. from Super Admin →
// Settings). Before this, every page — and several components on the SAME page
// (header, footer, page body) — each called /settings on their own, so opening
// a single page could fire it 2–3 times against a server that can be slow to
// wake. Now the first caller starts the request, everyone else waits on that
// same request, and the result is reused for a minute. index.js also calls it
// before React has even started, so the request is already under way while the
// app boots.
//
// The individual logo URLs are also written to localStorage under the same keys
// the pages already read (lerni_header_logo_url, …) so the very first paint of
// the next visit can show the real logo instantly.
// ─────────────────────────────────────────────────────────────────────────────
import { API } from '../context/AuthContext';

const TTL_MS = 60 * 1000;
let memo = null;
let memoAt = 0;
let inflight = null;

function persistLogoKeys(d) {
  try {
    localStorage.setItem('lerni_header_logo_url', d.logoUrl || '');
    localStorage.setItem('lerni_footer_logo_url', d.footerLogoUrl || '');
    localStorage.setItem('lerni_payment_logo_ubl', d.paymentLogoUbl || '');
    localStorage.setItem('lerni_payment_logo_allied', d.paymentLogoAllied || '');
    localStorage.setItem('lerni_payment_logo_jazzcash', d.paymentLogoJazzcash || '');
    localStorage.setItem('lerni_payment_logo_easypaisa', d.paymentLogoEasypaisa || '');
  } catch { /* cache is a nice-to-have */ }
}

export function fetchSiteSettings() {
  if (memo && Date.now() - memoAt < TTL_MS) return Promise.resolve(memo);
  if (inflight) return inflight;
  inflight = API.get('/settings')
    .then((res) => {
      memo = res.data || {};
      memoAt = Date.now();
      persistLogoKeys(memo);
      return memo;
    })
    .finally(() => { inflight = null; });
  return inflight;
} 