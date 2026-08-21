import { resolveSourceLink } from './adCreative';
import { triggerWebhookAlerts } from './webhook';

type AlertPayload = {
  recipients: string[];
  subject: string;
  html: string;
};

function parseEmailList(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'));
}

/** Flat recipient list — each address gets its own separate email (no CC). */
export function getAlertRecipients(): string[] {
  const fromEnv = [
    ...parseEmailList(process.env.ALERT_TO_EMAIL),
    ...parseEmailList(process.env.ALERT_EMAILS),
    ...parseEmailList(process.env.ALERT_CC_EMAILS), // legacy: treated as separate To, not CC
    ...parseEmailList(process.env.ADMIN_EMAIL),
  ];

  const defaults = [
    'hassanaliin9class@gmail.com',
    'ahmadadsmanager@gmail.com',
    'rankmoraoffical@gmail.com',
  ];

  const list = fromEnv.length > 0 ? fromEnv : defaults;
  // Verified free-tier inbox first so it always gets mail even if others fail
  const preferred = 'hassanaliin9class@gmail.com';
  const unique = Array.from(new Set(list));
  unique.sort((a, b) => {
    if (a === preferred) return -1;
    if (b === preferred) return 1;
    return a.localeCompare(b);
  });
  return unique;
}

async function deliverEmail(payload: AlertPayload): Promise<{ sent: boolean; provider: string; error?: string; sentTo?: string[] }> {
  const from = process.env.EMAIL_FROM || 'Entiix Alerts <onboarding@resend.dev>';
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    console.warn('⚠️ No email provider configured. Set RESEND_API_KEY to deliver alerts.');
    return { sent: false, provider: 'none', error: 'No email provider configured' };
  }

  const sentTo: string[] = [];
  const errors: string[] = [];

  // Always send separately — one Resend API call per recipient (no CC)
  for (const to of payload.recipients) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: payload.subject,
          html: payload.html,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error(`Resend failed for ${to}:`, data);
        errors.push(`${to}: ${data?.message || `HTTP ${res.status}`}`);
      } else {
        console.log(`✅ Sent separate alert to ${to}`);
        sentTo.push(to);
      }
    } catch (error: any) {
      console.error(`Resend error for ${to}:`, error);
      errors.push(`${to}: ${error?.message || 'network error'}`);
    }
  }

  if (sentTo.length > 0) {
    return {
      sent: true,
      provider: 'resend',
      sentTo,
      error: errors.length ? errors.join(' | ') : undefined,
    };
  }

  return { sent: false, provider: 'resend', error: errors.join(' | ') || 'All recipients failed' };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** One summary email for a whole scan batch (not one email per ad). */
export async function sendBulkScanAlert(opts: {
  groupsScanned: number;
  ads: any[];
  user?: any;
}) {
  const { groupsScanned, ads, user } = opts;
  if (!ads.length) {
    return { sent: false, skipped: true, reason: 'no new ads' };
  }

  if (user?.emailAlerts === false) {
    return { sent: false, skipped: true, reason: 'emailAlerts disabled' };
  }

  const recipients = getAlertRecipients();
  if (recipients.length === 0) {
    console.warn('⚠️ No alert recipients configured.');
    return { sent: false, recipients: [] };
  }

  // Fire webhook for the first ad only (avoid spam)
  if (ads[0]) {
    triggerWebhookAlerts({ name: 'Hourly Scan' }, ads[0], user).catch(console.error);
  }

  const count = ads.length;
  const rows = ads
    .slice(0, 40)
    .map((ad, i) => {
      const link = resolveSourceLink(ad.sourceLink, ad.metaAdId);
      const text = escapeHtml(String(ad.adText || 'No copy').slice(0, 160));
      return `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;vertical-align:top;">${i + 1}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;font-size:13px;vertical-align:top;">
            <strong style="color:#0f172a;">${escapeHtml(ad.advertiserName || 'Unknown')}</strong><br/>
            <span style="color:#7c3aed;font-size:12px;">#${escapeHtml(ad.matchingKeyword || '')}</span>
            <span style="color:#94a3b8;font-size:12px;"> · ${escapeHtml(ad.region || '')}</span>
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;vertical-align:top;">${text}${String(ad.adText || '').length > 160 ? '…' : ''}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;font-size:12px;vertical-align:top;white-space:nowrap;">
            ${link ? `<a href="${link}" style="color:#7c3aed;font-weight:700;text-decoration:none;">Open</a>` : '—'}
            ${ad.whatsappContact ? `<br/><a href="https://wa.me/${String(ad.whatsappContact).replace(/[^0-9]/g, '')}" style="color:#16a34a;font-weight:700;text-decoration:none;">WhatsApp</a>` : ''}
          </td>
        </tr>`;
    })
    .join('');

  const moreNote =
    count > 40
      ? `<p style="font-size:12px;color:#94a3b8;margin:12px 0 0;">Showing 40 of ${count} new ads. Open the Entiix dashboard for the full list.</p>`
      : '';

  const alertPayload: AlertPayload = {
    recipients,
    subject: `🚨 Entiix: ${count} new competitor ad${count === 1 ? '' : 's'} found`,
    html: `
      <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:720px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;background:#ffffff;">
        <div style="background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);padding:24px;text-align:center;color:white;">
          <h1 style="margin:0;font-size:22px;font-weight:800;">Entiix Intelligence</h1>
          <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Hourly competitor ad scan summary</p>
        </div>
        <div style="padding:24px;color:#0f172a;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
            We scanned <strong>${groupsScanned}</strong> active monitoring group${groupsScanned === 1 ? '' : 's'} and found
            <strong style="color:#7c3aed;">${count}</strong> new unique ad${count === 1 ? '' : 's'} (duplicates skipped).
          </p>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f8fafc;text-align:left;">
                <th style="padding:8px;font-size:11px;text-transform:uppercase;color:#94a3b8;border-bottom:1px solid #e2e8f0;">#</th>
                <th style="padding:8px;font-size:11px;text-transform:uppercase;color:#94a3b8;border-bottom:1px solid #e2e8f0;">Advertiser</th>
                <th style="padding:8px;font-size:11px;text-transform:uppercase;color:#94a3b8;border-bottom:1px solid #e2e8f0;">Ad copy</th>
                <th style="padding:8px;font-size:11px;text-transform:uppercase;color:#94a3b8;border-bottom:1px solid #e2e8f0;">Links</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          ${moreNote}
        </div>
        <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 24px;text-align:center;font-size:12px;color:#94a3b8;">
          Sent separately to: ${recipients.join(', ')}
        </div>
      </div>
    `,
  };

  console.log('====================================');
  console.log(`📧 BULK SCAN ALERT — ${count} new ad(s)`);
  console.log(`Recipients (separate emails): ${recipients.join(', ')}`);
  console.log(`Subject: ${alertPayload.subject}`);
  console.log('====================================');

  const result = await deliverEmail(alertPayload);
  if (result.sent) {
    console.log(
      `✅ Bulk alert delivered via ${result.provider} → ${(result.sentTo || []).join(', ')}` +
        (result.error ? ` (partial: ${result.error})` : '')
    );
  } else {
    console.warn(`❌ Bulk alert NOT delivered (${result.provider}): ${result.error}`);
  }

  return { ...alertPayload, ...result, count };
}

/** @deprecated use sendBulkScanAlert — kept for any one-off callers */
export async function sendEmailAlert(group: any, ad: any) {
  return sendBulkScanAlert({
    groupsScanned: 1,
    ads: [ad],
    user: group?.user,
  });
}
