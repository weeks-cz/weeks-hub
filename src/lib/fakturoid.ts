import 'server-only';

// Minimální Fakturoid API v3 klient (Client Credentials). Pro náhled faktury:
// vrací public_html_url existující faktury. Účet sdílený s weeks_web.
const API_BASE = 'https://app.fakturoid.cz/api/v3';

interface FakturoidConfig { slug: string; clientId: string; clientSecret: string; userAgent: string; }

function getConfig(): FakturoidConfig | null {
  const slug = process.env.FAKTUROID_SLUG;
  const clientId = process.env.FAKTUROID_CLIENT_ID;
  const clientSecret = process.env.FAKTUROID_CLIENT_SECRET;
  const userAgent = process.env.FAKTUROID_USER_AGENT || 'Weeks Hub (admin@weeks.cz)';
  if (!slug || !clientId || !clientSecret) return null;
  return { slug, clientId, clientSecret, userAgent };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(cfg: FakturoidConfig, now = Date.now()): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.token;
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');
  const res = await fetch(`${API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': cfg.userAgent,
    },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
  });
  if (!res.ok) throw new Error(`Fakturoid token failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  cachedToken = { token: data.access_token, expiresAt: now + (data.expires_in ?? 7200) * 1000 };
  return cachedToken.token;
}

/** Vrátí public_html_url faktury, nebo null když není nakonfigurováno / faktura nenalezena. */
export async function getInvoicePublicUrl(invoiceId: string): Promise<string | null> {
  const cfg = getConfig();
  if (!cfg) return null;
  const token = await getAccessToken(cfg);
  const res = await fetch(`${API_BASE}/accounts/${cfg.slug}/invoices/${invoiceId}.json`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'User-Agent': cfg.userAgent },
  });
  if (!res.ok) return null;
  const inv = (await res.json()) as { public_html_url?: string };
  return inv.public_html_url ?? null;
}
