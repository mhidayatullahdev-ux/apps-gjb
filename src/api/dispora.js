import api from './client';

export const BASE_URL = 'https://service-gor.84.247.188.148.sslip.io';

export function cleanText(value) {
  if (!value) return '';
  return String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const stripQuotes = (v) => cleanText(v).replace(/^["“”']+|["“”']+$/g, '');
const pick = (obj, ...keys) => {
  for (const k of keys) if (obj && obj[k]) return obj[k];
  return null;
};

// Mapping nama program → link resmi (opsional)
const PROGRAM_LINKS = [
  ['jkt sport', 'https://ppop-dispora.jakarta.go.id/'],
  ['ppop', 'https://ppop-dispora.jakarta.go.id/'],
  ['sidasi', 'https://sidasi-dispora.jakarta.go.id/'],
  ['rekomtek', 'https://dispora.jakarta.go.id/rekomtek'],
  ['e-booking', 'https://dispora.jakarta.go.id/facilities'],
  ['jkt muda', 'https://dispora.jakarta.go.id/jktmuda'],
  ['jktmuda', 'https://dispora.jakarta.go.id/jktmuda'],
];

export function linkForProgram(title) {
  const key = String(title || '').toLowerCase();
  for (const [needle, url] of PROGRAM_LINKS) {
    if (key.includes(needle)) return url;
  }
  return null;
}

// ---------- Normalizer ----------

const ACCENTS = ['primary', 'blue', 'gold'];

function normalizeProgram(p, i = 0) {
  return {
    id: String(p.id ?? p.slug ?? i),
    title: p.title || p.name || '-',
    description: cleanText(pick(p, 'description', 'excerpt', 'summary', 'content')),
    content: cleanText(pick(p, 'content', 'description')),
    image: pick(p, 'image', 'bannerImage', 'thumbnail', 'cover', 'imageUrl'),
    tag: p.tag || p.type || p.category || 'Program',
    accent: p.accent || ACCENTS[i % ACCENTS.length],
    url: pick(p, 'url', 'link', 'externalUrl') || linkForProgram(p.title || p.name),
    children: p.children || [],
  };
}

function normalizeInspiration(a, i = 0) {
  return {
    id: String(a.id ?? i),
    name: a.name || '-',
    achievement: pick(a, 'achievement', 'title', 'subtitle') || '',
    quote: stripQuotes(pick(a, 'quote', 'text', 'description')),
    image: pick(a, 'image', 'photo', 'imageUrl', 'thumbnail'),
  };
}

function normalizeQuote(q, i = 0) {
  return {
    id: String(q.id ?? i),
    quote: stripQuotes(pick(q, 'quote', 'text', 'content')),
    name: pick(q, 'name', 'author') || '',
    role: pick(q, 'role', 'position') || '',
  };
}

function normalizeHeroItem(h) {
  return {
    id: h.id,
    type: h.type || 'INFO',
    title: h.title,
    excerpt: cleanText(h.excerpt),
    content: cleanText(h.content || h.excerpt),
    date: h.date,
    image: h.image,
    bannerImage: h.bannerImage || h.image,
    heroBadge: h.heroBadge,
    heroCtaText: h.heroCtaText,
    heroCtaUrl: h.heroCtaUrl,
    registrationUrl: h.registrationUrl,
  };
}

function normalizeArticle(a) {
  return {
    id: a.id,
    category: a.category || 'Berita',
    title: a.title,
    slug: a.slug,
    excerpt: cleanText(a.excerpt),
    content: cleanText(a.content),
    body: cleanText(a.content),
    image: a.thumbnail || a.image,
    thumbnail: a.thumbnail,
    date: a.published_at
      ? new Date(a.published_at).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric',
        })
      : '',
    published_at: a.published_at,
  };
}

function normalizeGalleryItem(g, i = 0) {
  return {
    id: String(g.id ?? i),
    image: pick(g, 'image', 'imageUrl', 'url'),
    caption: cleanText(pick(g, 'caption', 'title', 'description') || ''),
    link: pick(g, 'link', 'permalink'),
  };
}

function normalizeSocialItem(s, i = 0) {
  return {
    id: String(s.id ?? i),
    image: pick(s, 'image', 'imageUrl'),
    title: s.title || 'Dispora',
    caption: cleanText(pick(s, 'caption', 'description') || ''),
    link: pick(s, 'link', 'permalink'),
    handle: s.handle || s.username ? `@${s.username}` : '@disporadkijkt',
  };
}

// ---------- Fetch functions (pakai API Laravel) ----------

export async function fetchHero() {
  try {
    const res = await api.get('/api/articles?page=1', { auth: false });
    const list = res?.data || res?.articles?.data || [];
    return list.slice(0, 5).map((a) =>
      normalizeHeroItem({
        id: a.id,
        type: 'NEWS',
        title: a.title,
        excerpt: a.excerpt,
        content: a.content,
        date: a.published_at,
        image: a.thumbnail,
        registrationUrl: null,
      })
    );
  } catch (e) {
    return [];
  }
}

export async function fetchPrograms() {
  try {
    const res = await api.get('/api/articles?page=1', { auth: false });
    const list = res?.data || [];
    return list.slice(0, 5).map(normalizeProgram);
  } catch (e) {
    return [];
  }
}

export async function fetchInspiration() {
  return [];
}

export async function fetchQuotes() {
  return [];
}

export async function fetchGallery() {
  try {
    const res = await api.get('/api/facilities', { auth: false });
    const list = res?.facilities || [];
    return list
      .filter((f) => f.image || f.image_url)
      .map((f, i) =>
        normalizeGalleryItem({
          id: f.id,
          image: f.image_url || f.image,
          caption: f.name,
          link: null,
        }, i)
      );
  } catch (e) {
    return [];
  }
}

export async function fetchSocial() {
  return [];
}

export async function fetchHomeContent() {
  const [hero, programs, inspiration, quotes, gallery, social] = await Promise.all([
    fetchHero(),
    fetchPrograms(),
    fetchInspiration(),
    fetchQuotes(),
    fetchGallery(),
    fetchSocial(),
  ]);

  return {
    hero,
    programs,
    inspiration,
    quotes,
    gallery,
    social,
    errors: {},
  };
}

export async function fetchHelpdeskTickets() {
  // Helpdesk tickets biasanya butuh auth admin; untuk user pakai list chat
  try {
    const res = await api.get('/api/chat/messages');
    const messages = res?.messages || [];
    // Convert messages jadi "ticket" shape sederhana
    return messages.map((m) => ({
      id: m.id,
      ticketNumber: `CHAT-${String(m.id).padStart(4, '0')}`,
      subject: m.sender_type === 'admin' ? 'Balasan admin' : 'Pesan Anda',
      message: m.message,
      name: m.sender_type === 'user' ? 'Anda' : 'Helpdesk',
      status: m.is_read ? 'CLOSED' : 'OPEN',
      createdAt: m.created_at,
    }));
  } catch (e) {
    return [];
  }
}

export async function sendChatMessage({ sessionId, message, attachmentUrl, attachmentName }) {
  try {
    const res = await api.post('/api/chat/messages', { message });
    return {
      reply: null, // chat dari admin via notifikasi
      sessionId: sessionId || res?.data?.id || null,
      raw: res,
    };
  } catch (e) {
    throw e;
  }
}

export default {
  BASE_URL,
  linkForProgram,
  fetchHero,
  fetchPrograms,
  fetchInspiration,
  fetchQuotes,
  fetchGallery,
  fetchSocial,
  fetchHelpdeskTickets,
  fetchHomeContent,
  sendChatMessage,
  cleanText,
};