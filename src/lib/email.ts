import { MonitoringGroup, Advertisement } from '@prisma/client';

export async function sendEmailAlert(group: any, ad: any) {
  const recipientEmail = group.user?.email || 'subscriber@entiix.com';
  
  const alertPayload = {
    to: recipientEmail,
    subject: `🚨 New Meta Ad Alert [${ad.matchingKeyword.toUpperCase()}]: ${ad.advertiserName}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; tracking-tight: -0.02em;">Entiix Intelligence</h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">New Competitive Meta Ad Detected</p>
        </div>

        <div style="padding: 24px; color: #0f172a;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <span style="background-color: #d1fae5; color: #047857; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase;">NEW AD DETECTED</span>
            <span style="font-size: 13px; color: #64748b;">${new Date(ad.firstDetectedAt).toLocaleString()}</span>
          </div>

          <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 12px 0; color: #0f172a;">${ad.advertiserName}</h2>
          
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
          </table>

          ${ad.sourceLink ? `
            <a href="${ad.sourceLink}" target="_blank" style="display: block; text-align: center; background: #7c3aed; color: #ffffff; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px;">
              Inspect Ad in Meta Ad Library &rarr;
            </a>
          ` : ''}
        </div>

        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
          You are receiving this email because real-time alerts are active for <strong>${group.name}</strong> on Entiix.
        </div>
      </div>
    `
  };

  console.log('====================================');
  console.log(`📧 EMAIL ALERT TRIGGERED FOR GROUP: ${group.name}`);
  console.log(`To: ${alertPayload.to}`);
  console.log(`Subject: ${alertPayload.subject}`);
  console.log(`Advertiser: ${ad.advertiserName}`);
  console.log(`Region: ${ad.region}`);
  console.log(`Date Detected: ${new Date(ad.firstDetectedAt).toLocaleString()}`);
  console.log(`Link: ${ad.sourceLink || 'N/A'}`);
  console.log('====================================');

  // Simulate notification delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return alertPayload;
}
