'use client';

/**
 * Poslední záchytná síť.
 *
 * Chytá i chyby v kořenovém layoutu, takže si musí vykreslit vlastní <html>
 * a <body> — a nemůže spoléhat na globals.css ani na proměnné motivu, protože
 * ty se nahrávají právě v tom layoutu, který selhal. Proto inline styly.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="cs">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B1020',
          color: '#E2E8F0',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '28rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Weeks Hub se nepodařilo spustit
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '1.25rem' }}>
            Zkus stránku načíst znovu. Pokud to nepomůže, pošli Lukášovi kód chyby.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#6366F1',
              color: '#fff',
              border: 0,
              borderRadius: '0.75rem',
              padding: '0.6rem 1.1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Načíst znovu
          </button>
          {error.digest && (
            <p style={{ marginTop: '1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748B' }}>
              Kód chyby: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
