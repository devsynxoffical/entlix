#!/usr/bin/env node
/**
 * One-time Telegram login → prints a GramJS StringSession.
 *
 * Prerequisites:
 *   1. Create an app at https://my.telegram.org → API development tools
 *   2. Put TELEGRAM_API_ID and TELEGRAM_API_HASH in .env (or pass as env vars)
 *
 * Usage:
 *   node scripts/telegram-login.mjs
 *
 * Then paste the printed session into Settings → Telegram Session
 * or Railway TELEGRAM_SESSION.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(String(answer || '').trim());
    });
  });
}

async function main() {
  loadEnv();

  const apiId = Number(process.env.TELEGRAM_API_ID || '');
  const apiHash = (process.env.TELEGRAM_API_HASH || '').trim();

  if (!apiId || !apiHash) {
    console.error('Set TELEGRAM_API_ID and TELEGRAM_API_HASH in .env first (from https://my.telegram.org).');
    process.exit(1);
  }

  const { TelegramClient } = require('telegram');
  const { StringSession } = require('telegram/sessions');

  const stringSession = new StringSession('');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log('Connecting to Telegram…');
  await client.start({
    phoneNumber: async () => ask('Phone number (international, e.g. +923001234567): '),
    phoneCode: async () => ask('Code from Telegram: '),
    password: async () => ask('2FA password (if enabled, else press Enter): '),
    onError: (err) => console.error(err),
  });

  const session = client.session.save();
  console.log('\n✅ Login OK. Copy this StringSession into Entiix Settings or TELEGRAM_SESSION:\n');
  console.log(session);
  console.log('\nKeep this secret — it is equivalent to your Telegram account login.\n');

  await client.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
