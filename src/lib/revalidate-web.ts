// Fire-and-forget revalidate ping to weeks.cz after camps change.
// Called from useCamps after create/update/delete so the public site reflects
// edits without waiting for ISR. Failures are non-blocking — the cache will
// expire naturally within REVALIDATE_TTL seconds.

const WEB_URL = process.env.NEXT_PUBLIC_WEEKS_WEB_URL || 'https://weeks.cz';
const SECRET = process.env.NEXT_PUBLIC_REVALIDATE_SECRET || '';

export async function revalidateWebCamps(): Promise<void> {
  if (!SECRET) return;
  try {
    await fetch(`${WEB_URL}/api/revalidate?secret=${encodeURIComponent(SECRET)}`, {
      method: 'POST',
      // Keepalive lets the request finish even if the user navigates away
      keepalive: true,
    });
  } catch {
    // Silent — revalidate is best-effort, ISR will catch up eventually
  }
}
