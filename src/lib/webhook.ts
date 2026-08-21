// Slack & Discord Webhook Notification Engine for Entiix
export async function triggerWebhookAlerts(group: any, ad: any, user: any) {
  const slackUrl = user?.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;
  const discordUrl = user?.discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL;

  // 1. Send Slack Webhook Alert
  if (slackUrl) {
    try {
      const slackPayload = {
        text: `🚨 *[NEW COMPETITOR AD DETECTED]*`,
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: `🚨 New Meta Ad Alert: ${ad.advertiserName}`, emoji: true }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Group:* ${group.name}` },
              { type: 'mrkdwn', text: `*Keyword:* #${ad.matchingKeyword}` },
              { type: 'mrkdwn', text: `*Region:* ${ad.region}` },
              { type: 'mrkdwn', text: `*WhatsApp:* ${ad.whatsappContact || 'N/A'}` }
            ]
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `>${(ad.adText || '').slice(0, 200)}...` }
          },
          {
            type: 'actions',
            elements: [
              ...(ad.sourceLink ? [{
                type: 'button',
                text: { type: 'plain_text', text: 'Inspect in Meta Library ↗' },
                url: ad.sourceLink,
                style: 'primary'
              }] : []),
              ...(ad.whatsappContact ? [{
                type: 'button',
                text: { type: 'plain_text', text: 'Chat on WhatsApp 💬' },
                url: `https://wa.me/${ad.whatsappContact.replace(/[^0-9]/g, '')}`
              }] : [])
            ]
          }
        ]
      };

      await fetch(slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload)
      });
      console.log('✅ Slack Webhook Notification Sent!');
    } catch (err) {
      console.error('Slack Webhook Error:', err);
    }
  }

  // 2. Send Discord Webhook Alert
  if (discordUrl) {
    try {
      const discordPayload = {
        embeds: [{
          title: `🚨 New Competitor Ad Detected: ${ad.advertiserName}`,
          color: 0x7c3aed, // Purple
          fields: [
            { name: 'Monitoring Group', value: group.name, inline: true },
            { name: 'Trigger Keyword', value: `#${ad.matchingKeyword}`, inline: true },
            { name: 'Region', value: ad.region, inline: true },
            { name: 'WhatsApp Contact', value: ad.whatsappContact || 'None', inline: true }
          ],
          description: `"${(ad.adText || '').slice(0, 300)}..."`,
          url: ad.sourceLink || 'https://entiix.com',
          timestamp: new Date().toISOString()
        }]
      };

      await fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload)
      });
      console.log('✅ Discord Webhook Notification Sent!');
    } catch (err) {
      console.error('Discord Webhook Error:', err);
    }
  }
}
