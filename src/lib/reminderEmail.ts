// Preview-only mirror of the payment-reminder email that weeks_web actually sends.
//
// SOURCE OF TRUTH: weeks_web `src/lib/email.ts` → `buildPaymentReminderEmail` +
// `layout`. The hub never SENDS this mail (the weeks_web cron does); this copy
// exists solely so admins can preview what the parent receives. If the wording or
// layout changes in weeks_web, mirror it here too.

export interface ReminderPreviewParams {
  childName: string;
  programName: string;
  locationName: string;
  termLabel: string;
  priceKc: number;
  paymentUrl: string;
}

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f1f5f9;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:28px;">
      <h1 style="font-size:20px;margin:0 0 16px;color:#4f46e5;">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px;">
      Weeks · IT tábory pro děti · <a href="https://weeks.cz" style="color:#94a3b8;">weeks.cz</a> · info@weeks.cz · +420 703 046 440
    </p>
  </div>
</body></html>`;
}

export function buildReminderPreviewHtml(p: ReminderPreviewParams): string {
  const body = `
    <p>Dobrý den,</p>
    <p>děkujeme za zájem o náš <strong>${p.programName}</strong> v ${p.locationName}. Registraci pro <strong>${p.childName}</strong> máme rozepsanou, ale zatím u ní nevidíme dokončenou platbu. Místo se rezervuje až po zaplacení (volná místa se obsazují průběžně).</p>
    <p>Dokončit ji můžete jedním kliknutím:</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${p.paymentUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:10px;">Dokončit platbu</a>
    </p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <tr><td style="padding:6px 0;color:#64748b;">Termín</td><td style="padding:6px 0;text-align:right;font-weight:600;">${p.termLabel}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Cena</td><td style="padding:6px 0;text-align:right;font-weight:600;">${p.priceKc.toLocaleString('cs-CZ')} Kč</td></tr>
    </table>
    <p>Pokud už o místo nemáte zájem, nic neřešte — stačí tento e-mail ignorovat.</p>
    <p>S pozdravem,<br>tým Weeks</p>`;
  return layout('Dokončení registrace', body);
}
