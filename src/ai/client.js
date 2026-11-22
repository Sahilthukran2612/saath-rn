import { cloudConfig, isConfigured } from '../services/cloud';
import { sanitizeCard, sanitizeReply } from './guard';

// Talks to Saath's own relay (a Supabase Edge Function, see docs/AI.md), never to xAI directly: the API key lives on
// the server, not in the app. If anything is missing or slow the caller falls back to the offline rule-based cards
// and a plain "the helper needs internet" line. Nothing here throws.

const TIMEOUT_MS = 14000;
export const CARD_ICONS = [
  'glass',
  'walker',
  'plate',
  'foot',
  'strip',
  'drop',
  'note',
  'face',
  'steps',
  'phone',
  'stretch',
  'moon',
];
export const CARD_TABS = ['care', 'plan', 'circle', 'safety'];

async function post(body, cfg = cloudConfig(), fetchImpl = fetch) {
  if (!isConfigured(cfg)) return { ok: false, reason: 'not_configured' };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${cfg.url}/functions/v1/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cfg.key, Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    if (!res.ok) return { ok: false, reason: res.status === 429 ? 'busy' : 'unavailable' };
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false, reason: 'offline' };
  } finally {
    clearTimeout(timer);
  }
}

const idOf = (title) => {
  let h = 2166136261;
  for (let i = 0; i < title.length; i++) {
    h ^= title.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `ai-${(h >>> 0).toString(36)}`;
};

// Between five and seven safe cards, or an empty list if the server gave nothing usable.
export async function fetchAiCards(ctx, cfg, fetchImpl) {
  const r = await post({ kind: 'cards', ctx }, cfg, fetchImpl);
  if (!r.ok) return { ok: false, reason: r.reason, cards: [] };
  const raw = Array.isArray(r.data?.cards) ? r.data.cards : [];
  const seen = new Set();
  const cards = [];
  for (const c of raw) {
    const safe = sanitizeCard(c, ctx.lang);
    if (!safe) continue;
    const id = idOf(safe.title);
    if (seen.has(id)) continue;
    seen.add(id);
    cards.push({
      id,
      kind: 'ai',
      ai: true,
      title: safe.title,
      body: safe.body,
      doodle: CARD_ICONS.includes(c.icon) ? c.icon : 'note',
      tab: CARD_TABS.includes(c.tab) ? c.tab : null,
      priority: 40 - cards.length,
    });
    if (cards.length === 7) break;
  }
  return cards.length >= 3 ? { ok: true, cards } : { ok: false, reason: 'thin', cards: [] };
}

// One chat turn. `messages` is the recent history: [{ role: 'user' | 'assistant', text }].
export async function fetchAiReply(ctx, messages, cfg, fetchImpl) {
  const history = messages.slice(-8).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.text).slice(0, 500),
  }));
  const r = await post({ kind: 'chat', ctx, messages: history }, cfg, fetchImpl);
  if (!r.ok) return { ok: false, reason: r.reason };
  const out = sanitizeReply(r.data?.reply, ctx.lang);
  return { ok: true, text: out.text, blocked: out.blocked };
}
