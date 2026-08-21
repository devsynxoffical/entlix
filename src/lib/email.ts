import { resolveSourceLink } from './adCreative';
import { triggerWebhookAlerts } from './webhook';

type AlertPayload = {
  recipients: string[];
  subject: string;
  html: string;
};

async function deliverEmail(payload: AlertPayload): Promise<{ sent: boolean; provider: string; error?: string }> {
  const from = process.env.EMAIL_FROM || 'Entiix Alerts <onboarding@resend.dev>';
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: payload.recipients,
          subject: payload.subject,
          html: payload.html,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('Resend email failed:', data);
        return { sent: false, provider: 'resend', error: data?.message || `HTTP ${res.status}` };
      }
      return { sent: true, provider: 'resend' };
    } catch (error: any) {
      console.error('Resend email error:', error);
      return { sent: false, provider: 'resend', error: error?.message || 'network error' };
    }
  }

  console.warn(
    '⚠️ No email provider configured. Set RESEND_API_KEY to deliver alerts.'
  );
  return { sent: false, provider: 'none', error: 'No email provider configured' };
}

export async function sendEmailAlert(group: any, ad: any) {
  const user = group.user;
  const userEmail = user?.email || null;
  const adminEmail = process.env.ADMIN_EMAIL || null;

  // Fire Slack and Discord webhook alerts concurrently (non-blocking)
  triggerWebhookAlerts(group, ad, user).catch(console.error);

  // Primary recipient = the logged-in account email that owns this monitoring group
  const recipients = Array.from(
    new Set([userEmail, adminEmail].filter((e): e is string => !!e && e.includes('@')))
  );

  if (recipients.length === 0) {
    console.warn('⚠️ No recipient email found for alert — user has no email and ADMIN_EMAIL is unset.');
    return { sent: false, recipients: [] };
  }

  const libraryLink = resolveSourceLink(ad.sourceLink, ad.metaAdId);

  const alertPayload: AlertPayload = {
    recipients,
    subject: `🚨 [NEW COMPETITOR AD] ${String(ad.matchingKeyword || '').toUpperCase()}: ${ad.advertiserName}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Entiix Intelligence</h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">New competitor ad detected</p>
        </div>

        <div style="padding: 24px; color: #0f172a;">
          <div style="margin-bottom: 16px;">
            <span style="background-color: #d1fae5; color: #047857; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase;">NEW AD DETECTED</span>
            <span style="font-size: 13px; color: #64748b; margin-left: 8px;">${new Date(ad.firstDetectedAt || Date.now()).toLocaleString()}</span>
          </div>

          <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">${ad.advertiserName}</h2>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155;">"${ad.adText || 'No ad text description available.'}"</p>
          </div>

          <table style="width: 100%; font-size: 13px; color: #475569; margin-bottom: 24px; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Monitoring Group:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${group.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Trigger Keyword:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #7c3aed;">#${ad.matchingKeyword}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Target Region:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${ad.region}</td>
            </tr>
            ${ad.whatsappContact ? `
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #64748b;">WhatsApp Lead:</td>
                <td style="padding: 8px 0; font-weight: 700; color: #16a34a;">${ad.whatsappContact}</td>
              </tr>
            ` : ''}
          </table>

          ${libraryLink ? `
            <a href="${libraryLink}" target="_blank" style="display: block; text-align: center; background: #7c3aed; color: #ffffff; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; margin-bottom: 12px;">
              Open Ad in Meta Ad Library &rarr;
            </a>
          ` : ''}

          ${ad.whatsappContact ? `
            <a href="https://wa.me/${String(ad.whatsappContact).replace(/[^0-9]/g, '')}" target="_blank" style="display: block; text-align: center; background: #16a34a; color: #ffffff; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px;">
              WhatsApp this advertiser &rarr;
            </a>
          ` : ''}
        </div>

        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
          Sent to: ${recipients.join(', ')}
        </div>
      </div>
    `,
  };

  console.log('====================================');
  console.log(`📧 EMAIL ALERT for group: ${group.name}`);
  console.log(`Recipients: ${recipients.join(', ')}`);
  console.log(`Subject: ${alertPayload.subject}`);
  console.log('====================================');

  const result = await deliverEmail(alertPayload);
  if (result.sent) {
    console.log(`✅ Alert email delivered via ${result.provider} → ${recipients.join(', ')}`);
  } else {
    console.warn(`❌ Alert email NOT delivered (${result.provider}): ${result.error}`);
  }

  return { ...alertPayload, ...result };
}
